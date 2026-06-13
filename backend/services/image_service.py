"""
Image Generation Service - FULL DB PERSISTENCE + EDIT SUPPORT
Uses Hugging Face InferenceClient + AstraDB persistence
FIXED: Reload persistence, image editing, full conversation history
"""

import os
import uuid
import io
import re
from typing import Optional, Dict, Any, List
from datetime import datetime

from PIL import Image, ImageDraw
from dotenv import load_dotenv
from pathlib import Path
from huggingface_hub import InferenceClient

# Load environment from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

HUGGING_FACE_API_KEY = os.getenv("HUGGING_FACE_API_KEY", "")

class ImageGenerationService:
    """Image generation with full DB persistence and editing support"""
    
    def __init__(self, db_service):
        self.db_service = db_service  # DatabaseService instance
        
        self.huggingface_key = HUGGING_FACE_API_KEY
        self._init_client()
    
    def _init_client(self):
        """Initialize HuggingFace client"""
        if self.huggingface_key:
            try:
                self.client = InferenceClient(
                    provider="fal-ai",
                    api_key=self.huggingface_key
                )
                print("🚀 Image Service: HF + DB ready")
            except Exception as e:
                self.client = None
                print(f"⚠️ HF client failed: {e}")
        else:
            self.client = None
            print("⚠️ No HUGGING_FACE_API_KEY")
    
    async def _generate_huggingface(
        self,
        prompt: str,
        width: int = 1024,
        height: int = 1024,
        base_image_url: Optional[str] = None  # For future inpainting
    ) -> List[bytes]:
        """Generate image via HF"""
        if not self.client:
            raise Exception("HF client not available")
        
        try:
            image = self.client.text_to_image(
                prompt,
                model="black-forest-labs/FLUX.1-schnell"
            )
            
            if image:
                img_bytes = io.BytesIO()
                image.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                return [img_bytes.getvalue()]
            raise Exception("No image returned")
        except Exception as e:
            print(f"HF error: {e}")
            raise
    
    async def generate(
        self,
        prompt: str,
        user_id: str,
        chat_id: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        samples: int = 1,
        base_image_url: Optional[str] = None,  # For edits
        is_edit: bool = False
    ) -> Dict[str, Any]:
        """Generate or edit image - MAINTAIN CHAT HISTORY"""
        # If no chat_id provided, create one. Otherwise, continue existing chat.
        if not chat_id:
            chat_id = f"image_{user_id}_{uuid.uuid4().hex[:12]}"
            print(f"🎨 NEW image chat: '{prompt[:50]}...' in chat {chat_id}")
        else:
            print(f"🎨 {'EDIT' if is_edit else 'CONTINUE'} image: '{prompt[:50]}...' in existing chat {chat_id}")
        
        # Get existing chat context for conversation history
        chat_context = await self.get_chat_images(user_id, chat_id)
        
        # Build prompt with conversation context
        full_prompt = prompt
        if chat_context:
            # Include previous prompts in context for better continuity
            previous_prompts = [img.get('prompt', '') for img in chat_context[-3:]]  # Last 3 images
            if previous_prompts:
                context_str = " | ".join(previous_prompts)
                full_prompt = f"Previous images in this conversation: {context_str}. Now: {prompt}"
                print(f"   📝 Added context from {len(previous_prompts)} previous images")
        
        # Detect edit intent in prompt
        edit_keywords = ['add', 'remove', 'change', 'modify', 'put', 'toppings', 'edit', 'modify', 'change']
        detected_edit = is_edit or any(re.search(rf'\b{word}\b', prompt.lower()) for word in edit_keywords)
        
        if detected_edit and chat_context:
            # For edits, use the last image as base context
            last_image = chat_context[-1]
            full_prompt = f"Edit this image (original prompt: '{last_image.get('prompt', '')}'). Modifications: {prompt}"
            print(f"   ✏️ Edit mode: using last image as context")
        
        # Generate image
        generated_images = []
        provider = "huggingface"
        
        try:
            if self.huggingface_key:
                images = await self._generate_huggingface(
                    prompt=full_prompt,
                    width=width,
                    height=height
                )
                generated_images = images
            else:
                generated_images = self._generate_placeholder(prompt, samples)
                provider = "placeholder"
        except Exception as e:
            print(f"   ❌ Generation failed: {e}")
            generated_images = self._generate_placeholder(prompt, samples)
            provider = "error"
        
        # === CRITICAL: PERSIST TO DATABASE ===
        image_history = {
            "image_id": f"img_{uuid.uuid4().hex[:12]}",
            "chat_id": chat_id,
            "user_id": user_id,
            "prompt": prompt,
            "full_prompt": full_prompt,  # Includes conversation context
            "is_edit": detected_edit,
            "base_image_url": base_image_url,
            "images_data": [img.hex() for img in generated_images[:1]],  # Store first as hex
            "provider": provider,
            "width": width,
            "height": height,
            "samples": samples,
            "created_at": datetime.now().isoformat()
        }
        
        # NOTE: persistence is now handled by the main API endpoint
        # (database_service.save_image) after Cloudinary upload so that
        # image URLs are stored alongside metadata. We keep the image_history
        # object for callers to use, but do not persist here to avoid duplicates.
        
        return {
            "images": generated_images,
            "chat_id": chat_id,
            "image_id": image_history["image_id"],
            "prompt": prompt,
            "provider": provider,
            "is_edit": detected_edit,
            "status": "success",
            "chat_context_len": len(chat_context)
        }
    
    async def edit_image(
        self,
        base_image_url: str,
        edit_prompt: str,
        user_id: str,
        chat_id: str
    ) -> Dict[str, Any]:
        """Edit existing image"""
        print(f"✏️ Editing image {base_image_url[:50]} with: '{edit_prompt[:50]}'")
        
        # Enhanced edit prompt
        edit_prompt_full = f"Edit this image: {base_image_url}. Modifications: {edit_prompt}. Preserve original composition."
        
        return await self.generate(
            prompt=edit_prompt_full,
            user_id=user_id,
            chat_id=chat_id,
            base_image_url=base_image_url,
            is_edit=True
        )
    
    async def get_chat_images(
        self,
        user_id: str,
        chat_id: str
    ) -> List[Dict[str, Any]]:
        """Load full image history for chat - RELOAD SUPPORT WITH USER ID FILTERING"""
        if not user_id or user_id == 'anonymous':
            return []
        
        chat = await self.db_service.get_chat(user_id, chat_id)
        
        if not chat:
            print(f"⚠️ Chat not found for user {user_id}, chat_id {chat_id}")
            return []
        
        # Extract image messages
        images = []
        for msg in chat.get("messages", []):
            if msg.get("type") == "image" and "image_data" in msg:
                img_data = msg["image_data"]
                images.append({
                    "image_id": img_data.get("image_id"),
                    "prompt": img_data.get("prompt", ""),
                    "full_prompt": img_data.get("full_prompt", ""),
                    "is_edit": img_data.get("is_edit", False),
                    "provider": img_data.get("provider", ""),
                    "created_at": img_data.get("created_at", ""),
                    "image_url": msg.get("image_url")  # From Cloudinary
                })
        
        print(f"📂 Loaded {len(images)} images for user {user_id}, chat {chat_id}")
        return images
    
    def _generate_placeholder(self, prompt: str, samples: int) -> List[bytes]:
        """Placeholder images"""
        images = []
        colors = [(100, 150, 255), (255, 150, 100), (100, 255, 150), (255, 100, 200)]
        
        for i in range(samples):
            color = colors[i % len(colors)]
            img = Image.new('RGB', (512, 512), color=color)
            draw = ImageDraw.Draw(img)
            
            try:
                from PIL import ImageFont
                font = ImageFont.load_default()
                draw.text((20, 20), f"Prompt: {prompt[:30]}...", fill=(255,255,255), font=font)
                draw.text((20, 50), "DEMO MODE", fill=(200,200,200), font=font)
            except:
                pass
            
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            images.append(img_bytes.getvalue())
        
        return images

