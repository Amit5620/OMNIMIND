"""
Summarization Service
Handles YouTube video, Website, and Document summarization
FIXED: Database persistence, user isolation, proper chat ID management
"""

import os
import re
import io
import uuid
import json
import base64
from typing import Optional, Dict, Any
from datetime import datetime
from collections import OrderedDict

import aiohttp
import asyncio
from bs4 import BeautifulSoup

from dotenv import load_dotenv
from pathlib import Path

from services.ai_orchestrator import AiOrchestrator
from services import prompt_templates


# Load environment from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class SummarizationService:
    """Service for summarizing YouTube videos, websites, and documents with DB persistence"""

    def __init__(self, db_service=None):
        self.orchestrator = AiOrchestrator()
        self.db_service = db_service

        # Tool-specific system prompts live in prompt_templates
        self.youtube_system = prompt_templates.YOUTUBE_SYSTEM
        self.youtube_map_prompt = prompt_templates.YOUTUBE_MAP_PROMPT
        self.youtube_reduce_prompt = prompt_templates.YOUTUBE_REDUCE_PROMPT

        self.website_system = prompt_templates.WEBSITE_SYSTEM
        self.website_map_prompt = prompt_templates.WEBSITE_MAP_PROMPT
        self.website_reduce_prompt = prompt_templates.WEBSITE_REDUCE_PROMPT

        self.document_system = prompt_templates.DOCUMENT_SYSTEM
        self.document_map_prompt = prompt_templates.DOCUMENT_MAP_PROMPT
        self.document_reduce_prompt = prompt_templates.DOCUMENT_REDUCE_PROMPT

        # Generic fallback summary prompt
        self.summary_prompt = "You are OmniMind AI. Produce a concise, accurate summary of the provided text."

        # RAG prompt (LLM-as-retriever)
        self.document_chunk_relevance_prompt = getattr(
            prompt_templates,
            "DOCUMENT_CHUNK_RELEVANCE_PROMPT",
            "You are OmniMind AI. Score the relevance of this chunk for an overall document summary. Return JSON {\"score\": number, \"reason\": string}.",
        )

    def _extract_video_id(self, url: str) -> Optional[str]:

        """Extract YouTube video ID from URL"""
        # Various YouTube URL patterns
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
            r'(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    async def summarize_youtube(
        self,
        url: str,
        user_id: str,
        chat_id: Optional[str] = None
    ) -> Dict[str, Any]:

        """
        Summarize YouTube video content with DB persistence
        
        Args:
            url: YouTube video URL
            user_id: User ID (for isolation)
            chat_id: Optional existing chat ID to continue
            
        Returns:
            Dictionary with summary and metadata
        """
        try:
            if not user_id or user_id == 'anonymous':
                raise ValueError("Valid user_id is required")

            video_id = self._extract_video_id(url)
            if not video_id:
                raise ValueError("Invalid YouTube URL")

            if not chat_id:
                chat_id = f"youtube_{user_id}_{uuid.uuid4().hex[:12]}"

            youtube_content = await self._get_youtube_content(video_id)


            if youtube_content:

                summary = await self._summarize_text(
                    content=youtube_content,

                    context="YouTube video content",
                    tool="youtube",

                )

                full_response = (
                    f"## YouTube Video Summary\n\n**Video URL:** {url}\n\n"
                    f"### Summary\n\n{summary}\n\n---\n\n"
                    "*This summary was generated from available YouTube data (transcript, subtitles, or metadata).*"
                )
            else:
                full_response = (
                    f"## YouTube Video Summary\n\n**Video URL:** {url}\n\n"
                    "### Note\nUnable to retrieve the video transcript automatically.\n\n"
                    "To get an accurate summary, please:\n1. Provide the video transcript manually, or\n2. Use the chat feature to discuss the video topics\n\n"
                    "### Suggested Questions\n- What are the main concepts discussed in this video?\n"
                    "- What key takeaways should I focus on?\n- Can you explain [specific topic] from this video?"
                )

            # Persist to database
            if self.db_service:
                try:
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=f"Summarize YouTube: {url}",
                        role="user",
                        message_type="text",
                    )
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=full_response,
                        role="assistant",
                        message_type="text",
                        message_source="summary",
                    )
                except Exception as db_error:
                    print(f"⚠️ Failed to save YouTube summary to DB: {db_error}")

            return {
                "response": full_response,
                "chat_id": chat_id,
                "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                "message_type": "summary",
            }

        except Exception as e:
            print(f"❌ YouTube summarization error: {e}")
            raise

    async def _get_youtube_content(self, video_id: str) -> Optional[str]:
        """Fetch YouTube information using a free fallback chain.

        Fallback chain:
            youtube-transcript-api
            ↓
            yt-dlp subtitles
            ↓
            yt-dlp metadata
            ↓
            YouTube oEmbed (fast; usually not blocked)
        """

        print(f"[YouTube] Processing {video_id}")

        transcript = await self._transcript_api_fetch(video_id)
        if transcript:
            print("[YouTube] Transcript API success")
            return transcript

        transcript = await self._ytdlp_subtitles(video_id)
        if transcript:
            print("[YouTube] yt-dlp subtitles success")
            return transcript

        metadata = await self._ytdlp_metadata(video_id)
        if metadata:
            print("[YouTube] Using metadata fallback")
            return metadata

        oembed_text = await self._youtube_oembed_fetch(video_id)
        if oembed_text:
            print("[YouTube] Using oEmbed fallback")
            return oembed_text

        return None

    async def _youtube_oembed_fetch(self, video_id: str, timeout: int = 10) -> Optional[str]:
        """Fetch title/channel info using YouTube oEmbed.

        This endpoint typically works even when transcript/yt-dlp are blocked.
        """
        try:
            url = (
                "https://www.youtube.com/oembed?"
                f"url=https://www.youtube.com/watch?v={video_id}&format=json"
            )

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=timeout) as resp:
                    if resp.status != 200:
                        return None
                    data = await resp.json()

            title = (data.get("title") or "").strip()
            author = (data.get("author_name") or "").strip()

            if not title and not author:
                return None

            # Keep it compact and LLM-friendly.
            return (
                "Title:\n"
                f"{title}\n\n"
                "Channel:\n"
                f"{author}\n"
            )
        except Exception as e:
            print(f"[YouTube oEmbed] {e}")
            return None


    async def _transcript_api_fetch(self, video_id: str) -> Optional[str]:
        """Try to fetch transcript using youtube-transcript-api."""
        try:
            from youtube_transcript_api import YouTubeTranscriptApi

            def run():
                try:
                    api = YouTubeTranscriptApi()
                    transcript = api.fetch(video_id)

                    return " ".join(
                        (item.text if hasattr(item, "text") else item["text"]) for item in transcript
                    )
                except Exception as e:
                    print(f"[TranscriptAPI] {e}")
                    return None

            return await asyncio.to_thread(run)

        except Exception as e:
            print(f"[TranscriptAPI Import] {e}")
            return None

    async def _ytdlp_subtitles(self, video_id: str) -> Optional[str]:
        """Try to fetch subtitle text using yt-dlp subtitle URLs."""
        try:
            import yt_dlp
            import requests

            def run():
                try:
                    url = f"https://www.youtube.com/watch?v={video_id}"

                    opts = {
                        "skip_download": True,
                        "quiet": True,
                    }

                    with yt_dlp.YoutubeDL(opts) as ydl:
                        info = ydl.extract_info(url, download=False)

                    subtitles = info.get("subtitles") or {}
                    auto_captions = info.get("automatic_captions") or {}

                    # Prefer manual subtitles, then auto captions.
                    def pick_first_subtitle_url(subs_dict: dict) -> Optional[str]:
                        for _lang, tracks in (subs_dict or {}).items():
                            if not tracks:
                                continue
                            return tracks[0].get("url")
                        return None

                    subtitle_url = (
                        pick_first_subtitle_url(subtitles) or pick_first_subtitle_url(auto_captions)
                    )

                    if not subtitle_url:
                        return None

                    response = requests.get(subtitle_url, timeout=20)
                    response.raise_for_status()

                    text = response.text or ""
                    text = re.sub(r"<[^>]+>", " ", text)
                    text = re.sub(r"\d+:\d+:\d+\.\d+", " ", text)
                    text = re.sub(r"\s+", " ", text)
                    return text.strip() or None

                except Exception as e:
                    print(f"[yt-dlp subtitles] {e}")
                    return None

            return await asyncio.to_thread(run)

        except Exception as e:
            print(f"[yt-dlp subtitles outer] {e}")
            return None

    async def _ytdlp_metadata(self, video_id: str) -> Optional[str]:
        """Fallback: fetch title/description/tags/channel using yt-dlp metadata."""
        try:
            import yt_dlp

            def run():
                try:
                    url = f"https://www.youtube.com/watch?v={video_id}"
                    opts = {
                        "skip_download": True,
                        "quiet": True,
                    }

                    with yt_dlp.YoutubeDL(opts) as ydl:
                        info = ydl.extract_info(url, download=False)

                    title = info.get("title", "") or ""
                    description = info.get("description", "") or ""
                    uploader = info.get("uploader", "") or ""
                    tags = ", ".join((info.get("tags", []) or [])[:20])

                    # Keep metadata compact to avoid huge prompts
                    if len(description) > 4000:
                        description = description[:4000] + "..."

                    return f"""
Title:
{title}

Channel:
{uploader}

Tags:
{tags}

Description:
{description}
"""

                except Exception as e:
                    print(f"[yt-dlp metadata] {e}")
                    return None

            return await asyncio.to_thread(run)

        except Exception as e:
            print(f"[yt-dlp metadata outer] {e}")
            return None

    
    
    async def summarize_website(
        self,
        url: str,
        user_id: str,
        chat_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Summarize website content with DB persistence
        
        Args:
            url: Website URL
            user_id: User ID (for isolation)
            chat_id: Optional existing chat ID to continue
            
        Returns:
            Dictionary with summary and metadata
        """
        try:
            # Validate user_id
            if not user_id or user_id == 'anonymous':
                raise ValueError("Valid user_id is required")
            
            # Use provided chat_id or generate new one with user_id
            if not chat_id:
                chat_id = f"website_{user_id}_{uuid.uuid4().hex[:12]}"
            
            # Fetch website content
            content = await self._fetch_webpage(url)
            
            if content:
                # Summarize the content
                summary = await self._summarize_text(
                    content=content,
                    context="website content",
                    tool="website"
                )
                full_response = f"## Website Summary\n\n**URL:** {url}\n\n### Summary\n\n{summary}\n\n---\n\n*This summary was generated from the website.*"
            else:
                full_response = f"""## Website Summary

**URL:** {url}

### Unable to Fetch Content
The website could not be accessed. This may be due to:
- Website blocking automated access
- Dynamic content that requires JavaScript
- Rate limiting or firewall protection

### Suggestions
- Copy and paste the main content manually
- Try providing the text directly using the Document Summarizer
- Use the Chat feature to discuss the topic"""
            
            # Persist to database
            if self.db_service:
                try:
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=f"Summarize website: {url}",
                        role="user",
                        message_type="text"
                    )
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=full_response,
                        role="assistant",
                        message_type="text",
                        message_source="summary",
                    )
                except Exception as db_error:
                    print(f"⚠️ Failed to save website summary to DB: {db_error}")
            
            return {
                "response": full_response,
                "chat_id": chat_id,
                "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                "message_type": "summary",
            }
        except Exception as e:
            print(f"❌ Website summarization error: {e}")
            raise
    
    async def _fetch_webpage(self, url: str, timeout: int = 30) -> Optional[str]:
        """Fetch and extract main content from a webpage"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=timeout) as response:
                    if response.status != 200:
                        return None
                    
                    html = await response.text()
                    
                    # Parse HTML
                    soup = BeautifulSoup(html, "lxml")
                    
                    # Remove scripts and styles
                    for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
                        tag.decompose()
                    
                    # Get text content
                    text = soup.get_text(separator=" ", strip=True)
                    
                    # Clean up whitespace
                    text = re.sub(r'\s+', ' ', text).strip()
                    
                    # Limit length
                    max_length = 50000
                    if len(text) > max_length:
                        text = text[:max_length] + "..."
                    
                    return text
                    
        except Exception as e:
            print(f"Web fetch error: {e}")
            return None
    
    async def summarize_document(

        self,

        content: str,
        file_name: str,
        user_id: str,
        chat_id: Optional[str] = None,
        content_encoding: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Summarize document content with DB persistence
        
        Args:
            content: Document text content
            file_name: Name of the document file
            user_id: User ID (for isolation)
            chat_id: Optional existing chat ID to continue
            
        Returns:
            Dictionary with summary and metadata
        """
        try:
            # Validate user_id
            if not user_id or user_id == 'anonymous':
                raise ValueError("Valid user_id is required")
            
            # Use provided chat_id or generate new one with user_id
            if not chat_id:
                chat_id = f"doc_{user_id}_{uuid.uuid4().hex[:12]}"
            
            # Determine document type from filename
            doc_type = self._get_document_type(file_name)

            # Normalize document text for binary formats
            content = await self._normalize_document_text(
                content=content,
                file_name=file_name,
                content_encoding=content_encoding,
            )
            
            # Summarize the content
            summary = await self._summarize_text(
                content=content,
                context=f"{doc_type} document: {file_name}",
                tool="document",
            )

            full_response = f"""## Document Summary


**File:** {file_name}
**Type:** {doc_type}

### Summary

{summary}

---

*This summary was generated from the document content.*"""
            
            # Persist to database
            if self.db_service:
                try:
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=f"Summarize document: {file_name}",
                        role="user",
                        message_type="text"
                    )
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=full_response,
                        role="assistant",
                        message_type="text",
                        message_source="summary",
                    )
                except Exception as db_error:
                    print(f"⚠️ Failed to save document summary to DB: {db_error}")
            
            return {
                "response": full_response,
                "chat_id": chat_id,
                "message_id": f"msg_{uuid.uuid4().hex[:12]}"
            }
        except Exception as e:
            print(f"❌ Document summarization error: {e}")
            raise

    async def answer_question(
        self,
        chat_id: str,
        question: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """Answer a user question using the stored summary or assistant messages for the given chat_id.

        This method will gather assistant messages from the chat history, use them as the knowledge
        source, chunk text, run a map step to extract candidate answers, then a reduce step to
        synthesize a concise final answer. Returns a ChatResponse-shaped dict.
        """
        if not user_id or user_id == "anonymous":
            raise ValueError("Valid user_id is required")

        if not chat_id:
            raise ValueError("chat_id is required for QA")

        # Load chat history messages from DB/memory
        chats = await self.db_service.get_chat_history(user_id=user_id, chat_id=chat_id, limit=200)
        if not chats:
            raise ValueError("No chat found for given chat_id")

        chat = chats[0]
        messages = chat.get("messages", [])

        # Use assistant messages as source material (prefer summaries)
        source_texts = []
        for m in messages:
            if m.get("role") == "assistant" and m.get("content"):
                source_texts.append(m.get("content"))

        if not source_texts:
            raise ValueError("No assistant content available to answer from")

        # Combine into one document
        content = "\n\n".join(source_texts)

        # Build map/reduce prompts specialized for QA
        map_prompt = (
            "You are a helpful assistant. Given the following document chunk, extract any information "
            "that directly answers the user's question. If the chunk does not contain relevant info, "
            "respond with '[NO_ANSWER]'. Return a short answer or '[NO_ANSWER]'.\n\nChunk:\n{chunk}\n"
        )

        reduce_prompt = (
            "You are a careful assistant. You will receive candidate answers from multiple chunks. "
            "If most candidates are '[NO_ANSWER]', state you cannot find the answer. Otherwise combine "
            "the candidate answers into a concise, evidence-backed response and list any short sources.\n\nCandidates:\n{candidates}\n"
        )

        try:
            # run map-reduce using orchestrator with the question embedded in the user messages
            # We'll inject the question into the map prompt so the map step can focus on answering it.
            map_prompt_with_q = map_prompt + f"\nUser question: {question}\n"
            reduce_prompt_with_q = reduce_prompt + f"\nUser question: {question}\n"

            answer = await self.orchestrator.map_reduce_summarize(
                content=content,
                map_prompt=map_prompt_with_q,
                reduce_prompt=reduce_prompt_with_q,
                map_model=self.orchestrator.model_for("fast"),
                reduce_model=self.orchestrator.model_for("reason"),
                map_max_tokens=400,
                reduce_max_tokens=600,
                temperature_map=0.1,
                temperature_reduce=0.1,
                chunk_max_chars=4000,
            )

            # Persist QA interaction
            if self.db_service:
                try:
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=f"Question: {question}",
                        role="user",
                        message_type="text",
                    )
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=answer,
                        role="assistant",
                        message_type="text",
                    )
                except Exception as db_error:
                    print(f"⚠️ Failed to save QA to DB: {db_error}")

            return {"response": answer, "chat_id": chat_id, "message_id": f"msg_{uuid.uuid4().hex[:12]}"}

        except Exception as e:
            print(f"QA error: {e}")
            raise
    
    def _get_document_type(self, file_name: str) -> str:
        """Determine document type from filename"""
        ext = file_name.lower().split(".")[-1] if "." in file_name else ""
        
        type_map = {
            "pdf": "PDF Document",
            "doc": "Word Document",
            "docx": "Word Document",
            "txt": "Text File",
            "md": "Markdown",
            "csv": "Spreadsheet",
            "xlsx": "Spreadsheet",
            "ppt": "Presentation",
            "pptx": "Presentation"
        }
        
        return type_map.get(ext, "Document")

    async def _normalize_document_text(
        self,
        content: str,
        file_name: str,
        content_encoding: Optional[str] = None,
    ) -> str:
        """Convert uploaded document content into plain text."""
        ext = file_name.lower().split('.')[-1] if '.' in file_name else ''

        if ext in {'pdf', 'docx'}:
            if content_encoding != 'base64':
                raise ValueError("Binary documents must be uploaded with base64 encoding.")
            return await self._extract_text_from_binary(content, ext)

        if content_encoding == 'base64':
            try:
                decoded = base64.b64decode(content)
                return decoded.decode('utf-8', errors='replace')
            except Exception as e:
                raise ValueError(f"Unable to decode uploaded text document: {e}")

        return content

    async def _extract_text_from_binary(self, encoded_content: str, ext: str) -> str:
        try:
            binary_data = base64.b64decode(encoded_content)
        except Exception as e:
            raise ValueError(f"Invalid base64 document content: {e}")

        if ext == 'pdf':
            return await asyncio.to_thread(self._extract_text_from_pdf, binary_data)
        if ext == 'docx':
            return await asyncio.to_thread(self._extract_text_from_docx, binary_data)

        raise ValueError(f"Unsupported document format: {ext}")

    def _extract_text_from_pdf(self, binary_data: bytes) -> str:
        try:
            from PyPDF2 import PdfReader
        except ImportError as e:
            raise ValueError(f"PDF support is not installed: {e}")

        reader = PdfReader(io.BytesIO(binary_data))
        pages = []
        for page in reader.pages:
            try:
                text = page.extract_text() or ''
                pages.append(text)
            except Exception:
                continue

        return "\n\n".join(pages).strip()

    def _extract_text_from_docx(self, binary_data: bytes) -> str:
        try:
            import docx
        except ImportError as e:
            raise ValueError(f"DOCX support is not installed: {e}")

        document = docx.Document(io.BytesIO(binary_data))
        paragraphs = [paragraph.text for paragraph in document.paragraphs if paragraph.text]
        return "\n\n".join(paragraphs).strip()

    def _tool_from_chat_id(self, chat_id: str) -> str:
        if not chat_id:
            return ""
        if chat_id.startswith("youtube_"):
            return "youtube"
        if chat_id.startswith("website_"):
            return "website"
        if chat_id.startswith("doc_"):
            return "document"
        return ""

    async def _summarize_text(
        self,
        content: str,
        context: str = "",
        *,
        tool: str = ""
    ) -> str:
        """Summarize text using the AiOrchestrator map-reduce pipeline."""

        # Limit content length for safety; orchestrator will chunk further as needed
        max_content = 250000
        if len(content) > max_content:
            content = content[:max_content] + "..."

        # Select prompts according to tool
        if tool == "youtube":
            map_prompt = self.youtube_map_prompt
            reduce_prompt = self.youtube_reduce_prompt
        elif tool == "website":
            map_prompt = self.website_map_prompt
            reduce_prompt = self.website_reduce_prompt
        elif tool == "document":
            map_prompt = self.document_map_prompt
            reduce_prompt = self.document_reduce_prompt
        else:
            map_prompt = self.summary_prompt
            reduce_prompt = self.summary_prompt

        # Provide context in the prompts where useful
        if context:
            map_prompt = f"{map_prompt}\n\nContext: {context}\n"
            reduce_prompt = f"{reduce_prompt}\n\nContext: {context}\n"

        try:
            map_model = self.orchestrator.model_for("fast")
            reduce_model = self.orchestrator.model_for("reason")
            summary = await self.orchestrator.map_reduce_summarize(
                content=content,
                map_prompt=map_prompt,
                reduce_prompt=reduce_prompt,
                map_model=map_model,
                reduce_model=reduce_model,
                map_max_tokens=800,
                reduce_max_tokens=1200,
                temperature_map=0.1,
                temperature_reduce=0.1,
                chunk_max_chars=12000,
            )
            return summary

        except Exception as e:
            print(f"Summarization error: {e}")
            return f"Error generating summary: {str(e)}"
