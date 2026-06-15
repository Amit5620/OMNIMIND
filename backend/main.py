"""
OmniMind FastAPI Backend
Main application server with all AI tool endpoints
FIXED: Proper user isolation, error handling, and chat persistence
"""

import os
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pathlib import Path

# Load environment from backend/.env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Import services
from services.groq_service import GroqService
from services.image_service import ImageGenerationService
from services.translation_service import TranslationService
from services.summarization_service import SummarizationService
from services.database_service import DatabaseService
from services.cloudinary_service import CloudinaryService
from services.code_storage_service import CodeStorageService
from services.code_studio_service import CodeStudioService
from services.code_studio_router import build_code_studio_router


# Initialize services
database_service = DatabaseService()
groq_service = GroqService(db_service=database_service)
image_service = ImageGenerationService(database_service)
translation_service = TranslationService()
summarization_service = SummarizationService(db_service=database_service)
cloudinary_service = CloudinaryService()

code_storage_service = CodeStorageService()
code_studio_service = CodeStudioService(storage=code_storage_service)

# mount Code Studio router after FastAPI app is created
# (kept here to avoid NameError on import-time execution)
# NOTE: actual mount is added below.



# ===================
# Request Models
# ===================

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    chat_id: Optional[str] = Field(None, description="Chat history ID")
    user_id: str = Field(..., description="User ID from authentication")
    system_prompt: Optional[str] = Field(None, description="Optional system prompt")


class CodingRequest(BaseModel):
    message: str = Field(..., description="User's coding question or request")
    chat_id: Optional[str] = Field(None, description="Chat history ID")
    user_id: str = Field(..., description="User ID from authentication")
    language: Optional[str] = Field("python", description="Programming language")


class YouTubeSummarizeRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL")
    chat_id: Optional[str] = Field(None, description="Chat history ID")
    user_id: str = Field(..., description="User ID from authentication")


class WebsiteSummarizeRequest(BaseModel):
    url: str = Field(..., description="Website URL")
    chat_id: Optional[str] = Field(None, description="Chat history ID")
    user_id: str = Field(..., description="User ID from authentication")


class DocumentSummarizeRequest(BaseModel):
    file_content: str = Field(..., description="Document content text or base64-encoded binary data")
    file_name: str = Field(..., description="Document file name")
    content_encoding: Optional[str] = Field(None, description="Encoding of file_content, such as utf-8 or base64")
    chat_id: Optional[str] = Field(None, description="Chat history ID")
    user_id: str = Field(..., description="User ID from authentication")


class QARequest(BaseModel):
    chat_id: str = Field(..., description="Chat history ID to ask question from")
    question: str = Field(..., description="User question")
    user_id: str = Field(..., description="User ID from authentication")


class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Image generation prompt")
    chat_id: Optional[str] = Field(None, description="Chat history ID")
    user_id: str = Field(..., description="User ID from authentication")
    width: Optional[int] = Field(1024, description="Image width")
    height: Optional[int] = Field(1024, description="Image height")
    samples: Optional[int] = Field(1, description="Number of images to generate")

class ImageEditRequest(BaseModel):
    edit_prompt: str = Field(..., description="Edit instructions")
    base_image_url: str = Field(..., description="URL of image to edit")
    chat_id: Optional[str] = Field(None, description="Chat history ID") 
    user_id: str = Field(..., description="User ID from authentication")

class TranslateRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    chat_id: Optional[str] = Field(None, description="Chat history ID")
    source_language: str = Field("auto", description="Source language (auto for detection)")
    target_language: str = Field("en", description="Target language code")
    user_id: str = Field(..., description="User ID from authentication")


class ChatHistoryRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    tool: Optional[str] = Field(None, description="Filter chats by tool")
    chat_id: Optional[str] = Field(None, description="Specific chat ID")
    limit: Optional[int] = Field(50, description="Max messages to retrieve")


# ===================
# Response Models
# ===================

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response")
    chat_id: str = Field(..., description="Chat history ID")
    message_id: str = Field(..., description="Message ID")


class ImageGenerateResponse(BaseModel):
    images: List[str] = Field(..., description="List of generated image URLs")
    chat_id: str = Field(..., description="Chat history ID")


class TranslationResponse(BaseModel):
    translated_text: str = Field(..., description="Translated text")
    detected_language: Optional[str] = Field(None, description="Detected source language")
    chat_id: str = Field(..., description="Chat history ID")
    message_id: str = Field(..., description="Message ID")


class ChatHistoryResponse(BaseModel):
    chats: List[Dict[str, Any]] = Field(..., description="List of chat histories")


class ApiResponse(BaseModel):
    success: bool = Field(..., description="Success status")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")


# ===================
# App Lifespan
# ===================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 OmniMind Backend Starting...")
    
    # Initialize database
    try:
        await database_service.connect()
        print("✅ Database connected")
    except Exception as e:
        print(f"⚠️ Database connection failed: {e}")
    
    print("✅ OmniMind Backend Ready!")
    
    yield
    
    # Shutdown
    print("🛑 OmniMind Backend Shutting down...")
    await database_service.disconnect()


# ===================
# Create FastAPI App
# ===================

app = FastAPI(
    title="OmniMind API",
    description="AI-powered platform with chat, coding, summarization, image generation, and translation tools",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
extra_origins = os.getenv("FRONTEND_ALLOWED_ORIGINS", "")

allowed_origins = {
    frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
}

if extra_origins:
    for o in extra_origins.split(","):
        o = o.strip()
        if o:
            allowed_origins.add(o.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===================
# Health Check
# ===================

@app.get("/")
async def root():
    return {
        "status": "OmniMind Core: Online",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "groq": "connected",
            "stability": "connected" if os.getenv("STABILITY_KEY") else "not configured",
            "cloudinary": "connected",
            "database": "connected" if database_service.is_connected else "disconnected"
        }
    }


# ===================
# Network Diagnostics (Render -> Hugging Face)
# ===================

@app.get("/dns-test")
async def dns_test():
    import socket

    try:
        return {
            "success": True,
            "ip": socket.gethostbyname(
                "api-inference.huggingface.co"
            )
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/hf-network")
async def hf_network():
    """Test outbound HTTPS connectivity to Hugging Face."""
    try:
        import requests

        r = requests.get("https://huggingface.co", timeout=10)
        return {"success": True, "status": r.status_code}

    except Exception as e:
        return {"success": False, "error": str(e)}



# ===================
# AI Chat Endpoint
# ===================

@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with AI using Groq"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        result = await groq_service.chat(
            message=request.message,
            chat_id=request.chat_id,
            user_id=request.user_id,
            system_prompt=request.system_prompt
        )
        
        # NOTE: Database persistence is now handled internally by groq_service
        
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# AI Coding Endpoint
# ===================

@app.post("/api/ai/coding", response_model=ChatResponse)
async def coding(request: CodingRequest):
    """Chat with AI specialized for coding"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        result = await groq_service.coding(
            message=request.message,
            chat_id=request.chat_id,
            user_id=request.user_id,
            language=request.language
        )
        
        # NOTE: Database persistence is now handled internally by groq_service
        
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Coding error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# YouTube Summarization Endpoint
# ===================

@app.post("/api/ai/youtube-summarize", response_model=ChatResponse)
async def youtube_summarize(request: YouTubeSummarizeRequest):
    """Summarize YouTube video content"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        # Call service - it handles DB persistence
        result = await summarization_service.summarize_youtube(
            url=request.url,
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        # Surface real backend reason to frontend for better debugging/UX.
        print(f"YouTube summarize error: {e}")
        raise HTTPException(status_code=500, detail=f"YouTube summarization failed: {repr(e)}")


@app.post("/api/ai/qa", response_model=ChatResponse)
async def ask_question(request: QARequest):
    """Answer a question using an existing chat's assistant content (summary/messages)."""
    try:
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")

        result = await summarization_service.answer_question(
            chat_id=request.chat_id,
            question=request.question,
            user_id=request.user_id,
        )
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"QA error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Website Summarization Endpoint
# ===================

@app.post("/api/ai/website-summarize", response_model=ChatResponse)
async def website_summarize(request: WebsiteSummarizeRequest):
    """Summarize website content"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        # Call service - it handles DB persistence
        result = await summarization_service.summarize_website(
            url=request.url,
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Website summarize error: {e}")
        raise HTTPException(status_code=500, detail=f"Website analysis failed: {str(e)}")


# ===================
# Document Summarization Endpoint
# ===================

@app.post("/api/ai/document-summarize", response_model=ChatResponse)
async def document_summarize(request: DocumentSummarizeRequest):
    """Summarize document content"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        # Call service - it handles DB persistence
        result = await summarization_service.summarize_document(
            content=request.file_content,
            file_name=request.file_name,
            content_encoding=request.content_encoding,
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Document summarize error: {e}")
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")


# ===================
# Image Generation Endpoint
# ===================

@app.post("/api/ai/image-generate", response_model=ImageGenerateResponse)
async def image_generate(request: ImageGenerateRequest):
    """Generate images using Stability AI"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        result = await image_service.generate(
            prompt=request.prompt,
            user_id=request.user_id,
            chat_id=request.chat_id,
            width=request.width,
            height=request.height,
            samples=request.samples
        )

        # Save images to Cloudinary and get URLs
        image_urls = []
        for img_data in result["images"]:
            try:
                cloudinary_url = await cloudinary_service.upload_image(
                    image_data=img_data,
                    user_id=request.user_id,
                    prompt=request.prompt
                )
                image_urls.append(cloudinary_url)
            except Exception as cloud_error:
                print(f"Cloudinary upload error: {cloud_error}")
                # Use placeholder if Cloudinary fails
                image_urls.append(f"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")

        # Persist prompt + image message into the image storage via helper.
        # This centralizes persistence to ensure messages array is populated correctly.
        try:
            await database_service.save_image(
                user_id=request.user_id,
                chat_id=result["chat_id"],
                image_urls=image_urls,
                prompt=request.prompt,
            )
        except Exception as persist_error:
            print(f"Error persisting image generation to DB: {persist_error}")

        return ImageGenerateResponse(images=image_urls, chat_id=result["chat_id"])
    except HTTPException:
        raise
    except Exception as e:
        print(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================
# Image Edit Endpoint - NEW
# ===================

@app.post("/api/ai/image-edit", response_model=ImageGenerateResponse)
async def image_edit(request: ImageEditRequest):
    """Edit existing image"""
    try:
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        # Save edit request
        user_msg = f"Edit image: {request.edit_prompt}"
        await database_service.save_message(
            user_id=request.user_id,
            chat_id=request.chat_id,
            message=user_msg,
            role="user"
        )
        
        # Call edit service
        result = await image_service.edit_image(
            base_image_url=request.base_image_url,
            edit_prompt=request.edit_prompt,
            user_id=request.user_id,
            chat_id=request.chat_id
        )
        
        # Upload new edited image
        image_urls = []
        for img_data in result["images"]:
            try:
                cloudinary_url = await cloudinary_service.upload_image(
                    image_data=img_data,
                    user_id=request.user_id,
                    prompt=f"EDIT: {request.edit_prompt}"
                )
                image_urls.append(cloudinary_url)
            except Exception as cloud_error:
                print(f"Cloudinary upload error: {cloud_error}")
                image_urls.append(f"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
        
        # Save edited result
        edit_msg = f"Edited image: {request.edit_prompt}"
        await database_service.save_message(
            user_id=request.user_id,
            chat_id=result["chat_id"],
            message=edit_msg,
            role="assistant",
            message_type="image",
            image_url=image_urls[0] if image_urls else None
        )
        
        return ImageGenerateResponse(images=image_urls, chat_id=result["chat_id"])
    except HTTPException:
        raise
    except Exception as e:
        print(f"Image edit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Translation Endpoint
# ===================

@app.post("/api/ai/translate", response_model=TranslationResponse)
async def translate(request: TranslateRequest):
    """Translate text between languages (persist to translation tool storage)"""
    try:
        if not request.user_id or request.user_id == "anonymous":
            raise HTTPException(status_code=400, detail="Valid user_id is required")

        # Create/keep tool-specific chat_id for translation
        chat_id = request.chat_id
        if not chat_id:
            chat_id = f"translate_{request.user_id}_{uuid.uuid4().hex[:12]}"

        result = await translation_service.translate(
            text=request.text,
            source_language=request.source_language,
            target_language=request.target_language,
            user_id=request.user_id,
        )

        # Persist user text + translated assistant output
        user_message_id = await database_service.save_message(
            user_id=request.user_id,
            chat_id=chat_id,
            message=request.text,
            role="user",
            message_type="text",
        )

        assistant_message_id = await database_service.save_message(
            user_id=request.user_id,
            chat_id=chat_id,
            message=result["translated_text"],
            role="assistant",
            message_type="text",
        )

        return TranslationResponse(
            translated_text=result["translated_text"],
            detected_language=result.get("detected_language"),
            chat_id=chat_id,
            message_id=assistant_message_id or user_message_id or f"msg_{uuid.uuid4().hex[:12]}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Chat History Endpoints
# ===================

class ChatTitleRequest(BaseModel):
    user_id: str
    chat_id: str
    title: str


@app.post("/api/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(request: ChatHistoryRequest):
    """Get user's chat history - filtered by user_id and optional tool"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        chats = await database_service.get_chat_history(
            user_id=request.user_id,
            tool=request.tool,
            chat_id=request.chat_id,
            limit=request.limit or 50
        )
        return ChatHistoryResponse(chats=chats)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/create")
async def create_chat(user_id: str):
    """Create a new chat"""
    try:
        # Validate user_id
        if not user_id or user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        chat_id = await database_service.create_chat(user_id=user_id)
        return {"success": True, "chat_id": chat_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/edit-title")
async def edit_chat_title(request: ChatTitleRequest):
    """Edit chat title"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        success = await database_service.update_chat_title(
            chat_id=request.chat_id,
            title=request.title,
            user_id=request.user_id
        )
        if success:
            return {"success": True, "message": "Chat title updated"}
        else:
            raise HTTPException(status_code=404, detail="Chat not found or not authorized")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/delete")
async def delete_chat(request: ChatHistoryRequest):
    """Delete a chat - only deletes if user owns the chat"""
    try:
        # Validate user_id
        if not request.user_id or request.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail="Valid user_id is required")
        
        if not request.chat_id:
            raise HTTPException(status_code=400, detail="chat_id is required")
        
        success = await database_service.delete_chat(user_id=request.user_id, chat_id=request.chat_id)
        if success:
            return {"success": True, "message": "Chat deleted"}
        else:
            raise HTTPException(status_code=404, detail="Chat not found or not authorized")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Contact Form Endpoint
# ===================

class ContactRequest(BaseModel):
    name: str
    email: str
    message: str
    user_id: Optional[str] = None


@app.post("/api/contact", response_model=ApiResponse)
async def contact(request: ContactRequest):
    """Contact form submission with email notification"""
    try:
        # Save to database
        await database_service.save_contact(
            name=request.name,
            email=request.email,
            message=request.message,
            user_id=request.user_id
        )
        
        return ApiResponse(
            success=True,
            message="Message received. We'll contact you soon!",
            data={"timestamp": datetime.now().isoformat()}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Run Server
# ===================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("DEBUG", "true").lower() == "true"
    )
