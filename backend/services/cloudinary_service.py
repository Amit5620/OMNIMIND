"""
Cloudinary Service
Uploads and manages images using Cloudinary
"""

import os
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
import base64
import io

from dotenv import load_dotenv
from pathlib import Path
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Load environment from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class CloudinaryService:
    """Service for uploading images to Cloudinary"""
    
    def __init__(self):
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True
        )
        
        self.cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        self.api_key = os.getenv("CLOUDINARY_API_KEY")
        
        # In-memory URL storage (fallback)
        self._url_store: Dict[str, str] = {}
    
    def _is_configured(self) -> bool:
        """Check if Cloudinary is properly configured"""
        return bool(self.cloud_name and self.api_key)
    
    async def upload_image(
        self,
        image_data: bytes,
        user_id: str,
        prompt: str,
        folder: Optional[str] = None
    ) -> str:
        """
        Upload image to Cloudinary
        
        Args:
            image_data: Image bytes
            user_id: User ID
            prompt: Generation prompt (for tags/description)
            folder: Optional folder path
            
        Returns:
            Uploaded image URL
        """
        if not self._is_configured():
            # Generate placeholder URL
            return self._generate_placeholder_url(prompt)
        
        try:
            # Generate unique public ID
            public_id = f"omnimind/{user_id}/{uuid.uuid4().hex[:12]}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                image_data,
                public_id=public_id,
                folder=folder or f"omnimind/{user_id}",
                tags=[user_id, "omnimind", "ai-generated"],
                context={
                    "prompt": prompt[:500],  # Limit prompt length
                    "created_at": datetime.now().isoformat()
                }
            )
            
            # Store URL
            self._url_store[public_id] = result.get("secure_url")
            
            return result.get("secure_url")
            
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            # Return placeholder on error
            return self._generate_placeholder_url(prompt)
    
    async def upload_base64_image(
        self,
        base64_string: str,
        user_id: str,
        prompt: str
    ) -> str:
        """Upload base64 encoded image"""
        try:
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            return await self.upload_image(
                image_data=image_data,
                user_id=user_id,
                prompt=prompt
            )
        except Exception as e:
            print(f"Base64 upload error: {e}")
            return self._generate_placeholder_url(prompt)
    
    async def delete_image(self, public_id: str) -> bool:
        """Delete image from Cloudinary"""
        if not self._is_configured():
            return False
        
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            print(f"Cloudinary delete error: {e}")
            return False
    
    def _generate_placeholder_url(self, prompt: str) -> str:
        """Generate a placeholder URL for demo purposes"""
        # For demo, return a data URL with a simple colored image
        # In production, this would be a proper placeholder
        
        # Create simple placeholder image
        from PIL import Image, ImageDraw
        
        img = Image.new('RGB', (512, 512), color=(100, 100, 200))
        draw = ImageDraw.Draw(img)
        
        # Add text
        try:
            draw.text(
                (256, 256),
                "AI Generated",
                fill=(255, 255, 255),
                anchor="mm"
            )
        except:
            pass
        
        # Convert to base64
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"
    
    async def get_image_info(self, public_id: str) -> Optional[Dict[str, Any]]:
        """Get image information"""
        if not self._is_configured():
            return None
        
        try:
            result = cloudinary.api.resource(public_id)
            return result
        except Exception as e:
            print(f"Cloudinary info error: {e}")
            return None
    
    def get_url(self, public_id: str) -> Optional[str]:
        """Get stored URL"""
        return self._url_store.get(public_id)
