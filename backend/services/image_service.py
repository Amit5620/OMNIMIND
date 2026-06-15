"""backend.services.image_service

Image Generation Service

Purpose:
- Generate images using HuggingFace InferenceClient.
- If HuggingFace is unreachable (DNS/network restrictions on hosting), return placeholders
  so the frontend still receives images.

Notes:
- Cloudinary upload + DB persistence are handled by backend/main.py endpoints.
- This module must be valid Python (no indentation errors).
"""

from __future__ import annotations

import io
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from PIL import Image, ImageDraw

# Load environment from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

HUGGING_FACE_API_KEY = os.getenv("HUGGING_FACE_API_KEY", "")


class ImageGenerationService:
    """Image generation with chat continuity and edit support."""

    def __init__(self, db_service: Any):
        self.db_service = db_service
        self.huggingface_key = HUGGING_FACE_API_KEY
        self.client: Optional[InferenceClient] = None
        self._init_client()

    def _init_client(self) -> None:
        if not self.huggingface_key:
            self.client = None
            print("⚠️ No HUGGING_FACE_API_KEY")
            return

        try:
            # Important: use HF InferenceClient with HF token.
            # Do NOT set provider="fal-ai" (your env var naming + HF token expects HF provider).
            self.client = InferenceClient(
                provider="hf-inference",
                api_key=self.huggingface_key
            )
            print("🚀 Image Service: HF client ready")
        except Exception as e:
            self.client = None
            print(f"⚠️ HF client failed: {e}")

    async def get_chat_images(
        self,
        user_id: str,
        chat_id: str,
    ) -> List[Dict[str, Any]]:
        """Load image history for chat (used to add continuity to prompts)."""
        if not user_id or user_id == "anonymous":
            return []

        chat = await self.db_service.get_chat(user_id, chat_id)
        if not chat:
            print(f"⚠️ Chat not found for user {user_id}, chat_id {chat_id}")
            return []

        images: List[Dict[str, Any]] = []
        for msg in chat.get("messages", []):
            if msg.get("type") == "image" and "image_data" in msg:
                img_data = msg["image_data"]
                images.append(
                    {
                        "image_id": img_data.get("image_id"),
                        "prompt": img_data.get("prompt", ""),
                        "full_prompt": img_data.get("full_prompt", ""),
                        "is_edit": img_data.get("is_edit", False),
                        "provider": img_data.get("provider", ""),
                        "created_at": img_data.get("created_at", ""),
                        "image_url": msg.get("image_url"),
                    }
                )

        print(f"📂 Loaded {len(images)} images for user {user_id}, chat {chat_id}")
        return images

    def _generate_placeholder(self, prompt: str, samples: int) -> List[bytes]:
        """Placeholder images returned when HF generation fails."""
        images: List[bytes] = []
        colors = [(100, 150, 255), (255, 150, 100), (100, 255, 150), (255, 100, 200)]

        for i in range(samples):
            color = colors[i % len(colors)]
            img = Image.new("RGB", (512, 512), color=color)
            draw = ImageDraw.Draw(img)

            try:
                from PIL import ImageFont

                font = ImageFont.load_default()
                draw.text(
                    (20, 20),
                    f"Prompt: {prompt[:30]}...",
                    fill=(255, 255, 255),
                    font=font,
                )
                draw.text((20, 50), "DEMO MODE", fill=(200, 200, 200), font=font)
            except Exception:
                pass

            img_bytes = io.BytesIO()
            img.save(img_bytes, format="PNG")
            images.append(img_bytes.getvalue())

        return images

    async def _generate_huggingface(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
    ) -> List[bytes]:
        if not self.client:
            raise Exception("HF client not available")

        # Your model choice from existing code
        image = self.client.text_to_image(
            prompt,
            model="black-forest-labs/FLUX.1-schnell",
        )

        if not image:
            raise Exception("No image returned")

        img_bytes = io.BytesIO()
        # expected: PIL-like image
        image.save(img_bytes, format="PNG")
        img_bytes.seek(0)
        return [img_bytes.getvalue()]

    async def generate(
        self,
        prompt: str,
        user_id: str,
        chat_id: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        samples: int = 1,
        base_image_url: Optional[str] = None,
        is_edit: bool = False,
    ) -> Dict[str, Any]:
        """Generate or edit image.

        Returns:
          { images: List[bytes], chat_id: str, ... }

        Main API endpoint will convert bytes to Cloudinary URLs.
        """

        if not chat_id:
            chat_id = f"image_{user_id}_{uuid.uuid4().hex[:12]}"
            print(f"🎨 NEW image chat: '{prompt[:50]}...' in chat {chat_id}")
        else:
            print(
                f"🎨 {'EDIT' if is_edit else 'CONTINUE'} image: '{prompt[:50]}...' in existing chat {chat_id}"
            )

        chat_context = await self.get_chat_images(user_id, chat_id)

        full_prompt = prompt
        if chat_context:
            previous_prompts = [img.get("prompt", "") for img in chat_context[-3:]]
            if previous_prompts:
                context_str = " | ".join(previous_prompts)
                full_prompt = (
                    f"Previous images in this conversation: {context_str}. Now: {prompt}"
                )
                print(f"   📝 Added context from {len(previous_prompts)} previous images")

        edit_keywords = ["add", "remove", "change", "modify", "put", "toppings", "edit"]
        detected_edit = is_edit or any(
            re.search(rf"\b{word}\b", prompt.lower()) for word in edit_keywords
        )

        if detected_edit and chat_context:
            last_image = chat_context[-1]
            full_prompt = (
                "Edit this image (original prompt: '"
                + last_image.get("prompt", "")
                + "'). Modifications: "
                + prompt
            )
            print("   ✏️ Edit mode: using last image as context")

        provider = "huggingface"
        try:
            if self.client:
                generated_images = await self._generate_huggingface(
                    prompt=full_prompt,
                    width=width,
                    height=height,
                )
            else:
                raise Exception("HF client not available")
        except Exception as e:
            print(f"   ❌ Generation failed: {e}")
            generated_images = self._generate_placeholder(prompt, samples)
            provider = "placeholder"

        # metadata kept for compatibility/diagnostics; main.py persists later.
        _image_history = {
            "image_id": f"img_{uuid.uuid4().hex[:12]}",
            "chat_id": chat_id,
            "user_id": user_id,
            "prompt": prompt,
            "full_prompt": full_prompt,
            "is_edit": detected_edit,
            "base_image_url": base_image_url,
            "provider": provider,
            "width": width,
            "height": height,
            "samples": samples,
            "created_at": datetime.now().isoformat(),
        }

        return {
            "images": generated_images,
            "chat_id": chat_id,
            "image_id": _image_history["image_id"],
            "prompt": prompt,
            "provider": provider,
            "is_edit": detected_edit,
            "status": "success",
            "chat_context_len": len(chat_context),
        }

    async def edit_image(
        self,
        base_image_url: str,
        edit_prompt: str,
        user_id: str,
        chat_id: str,
    ) -> Dict[str, Any]:
        print(f"✏️ Editing image {base_image_url[:50]} with: '{edit_prompt[:50]}'")
        edit_prompt_full = (
            f"Edit this image: {base_image_url}. Modifications: {edit_prompt}. Preserve original composition."
        )

        return await self.generate(
            prompt=edit_prompt_full,
            user_id=user_id,
            chat_id=chat_id,
            base_image_url=base_image_url,
            is_edit=True,
        )
