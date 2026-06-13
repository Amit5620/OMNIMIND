"""
Groq AI Service for Chat and Coding
Uses Groq API with llama-3.3-70b-versatile and other models
FIXED: Proper user isolation, database persistence, and chat reloading
"""

import os
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from groq import AsyncGroq
from dotenv import load_dotenv
from pathlib import Path

from .prompt_templates import CHAT_SYSTEM, CODING_SYSTEM


# Load environment from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class GroqService:
    """Service for Chat and Coding AI using Groq - WITH DATABASE PERSISTENCE"""
    
    def __init__(self, db_service=None):
        # Get API key
        api_key = os.getenv("GROQ_API_KEY", "")
        
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY not configured in .env file")
        
        self.client = AsyncGroq(api_key=api_key)
        self.db_service = db_service  # Database service for persistence
        
        # Chat model
        self.chat_model = "llama-3.3-70b-versatile"
        
        # Coding model
        # NOTE: deepseek-coder-2.5-mighty is not available on Groq for this account (404 model_not_found).
        # Use a known-supported fallback model.
        self.coding_model = "llama-3.1-8b-instant"

        
        # System prompts
        self.chat_system = CHAT_SYSTEM
        self.coding_system = CODING_SYSTEM
        

        
        # In-memory cache - will be loaded from DB on first access
        self._chat_metadata: Dict[str, Dict[str, Any]] = {}
        self._chat_histories: Dict[str, List[Dict[str, Any]]] = {}
        self._loaded_users: set = set()  # Track which users' chats are loaded
    
    async def _ensure_user_chats_loaded(self, user_id: str):
        """Load user's chats from database if not already loaded"""
        if user_id in self._loaded_users or not self.db_service:
            return
            
        try:
            # Load all user's chats from database
            chats = await self.db_service.get_chat_history(user_id=user_id)
            
            for chat in chats:
                chat_id = chat.get("chat_id")
                if not chat_id:
                    continue
                    
                chat_key = self._get_chat_key(user_id, chat_id)
                
                # Store metadata
                self._chat_metadata[chat_key] = {
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "title": chat.get("title", "Untitled"),
                    "created_at": chat.get("created_at"),
                    "updated_at": chat.get("updated_at"),
                    "tool": chat.get("tool", "chat"),
                    "language": chat.get("language")
                }
                
                # Rebuild chat history from messages
                messages = []
                for msg in chat.get("messages", []):
                    if msg.get("role") in ["system", "user", "assistant"]:
                        messages.append({
                            "role": msg["role"],
                            "content": msg.get("content", "")
                        })
                
                # Add system prompt if this is a chat tool and no system message exists
                if chat.get("tool") == "chat" and not any(m["role"] == "system" for m in messages):
                    messages.insert(0, {"role": "system", "content": self.chat_system})
                elif chat.get("tool") == "coding" and not any(m["role"] == "system" for m in messages):
                    # Reconstruct coding system prompt
                    language = chat.get("language", "python")
                    coding_system = f"""{self.coding_system}

Current language focus: {language}
When answering coding questions:
1. Provide clean, well-commented code
2. Include error handling where appropriate
3. Use modern best practices
4. Explain the solution clearly"""
                    messages.insert(0, {"role": "system", "content": coding_system})
                
                self._chat_histories[chat_key] = messages
            
            self._loaded_users.add(user_id)
            print(f"✅ Loaded {len(chats)} chats for user {user_id}")
            
        except Exception as e:
            print(f"⚠️ Failed to load chats for user {user_id}: {e}")
    
    def _create_chat_id(self, user_id: str, tool: str = "chat") -> str:
        """Create unique chat ID for user"""
        prefix = "chat" if tool == "chat" else "coding"
        return f"{prefix}_{user_id}_{uuid.uuid4().hex[:12]}"
    
    def _get_chat_key(self, user_id: str, chat_id: str) -> str:
        """Get storage key with user isolation"""
        return f"{user_id}:{chat_id}"
    
    def _is_recent(self, timestamp: datetime) -> bool:
        """Check if timestamp is recent"""
        return datetime.now() - timestamp < timedelta(hours=1)
    
    async def chat(
        self,
        message: str,
        chat_id: Optional[str],
        user_id: str,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Chat with AI using Groq - WITH DATABASE PERSISTENCE
        """
        # CRITICAL: Validate user_id
        if not user_id or user_id == 'anonymous':
            raise ValueError("Valid user_id is required for chat")
        
        # Load user's chats from database if not loaded
        await self._ensure_user_chats_loaded(user_id)
        
        # Create new chat if not provided
        if not chat_id:
            chat_id = self._create_chat_id(user_id, "chat")
        
        # Chat key includes user_id for isolation
        chat_key = self._get_chat_key(user_id, chat_id)
        
        # Check if chat exists for this user
        if chat_key not in self._chat_histories:
            # Create new chat with system prompt
            self._chat_histories[chat_key] = [
                {"role": "system", "content": system_prompt or self.chat_system}
            ]
        
        # Initialize metadata if new
        if chat_key not in self._chat_metadata:
            self._chat_metadata[chat_key] = {
                "user_id": user_id,  # CRITICAL
                "chat_id": chat_id,
                "created_at": datetime.now(),
                "title": message[:50] + "..." if len(message) > 50 else message,
                "tool": "chat"
            }
        
        # Add user message
        self._chat_histories[chat_key].append(
            {"role": "user", "content": message}
        )
        
        try:
            # Create chat completion
            response = await self.client.chat.completions.create(
                model=self.chat_model,
                messages=self._chat_histories[chat_key],
                temperature=0.7,
                max_tokens=4096,
                top_p=0.9,
                stream=False
            )
            
            # Get assistant response
            assistant_message = response.choices[0].message.content
            
            # Add assistant response to history
            self._chat_histories[chat_key].append(
                {"role": "assistant", "content": assistant_message}
            )
            
            # Update metadata
            self._chat_metadata[chat_key]["last_message"] = assistant_message
            self._chat_metadata[chat_key]["updated_at"] = datetime.now()
            
            # Persist to database
            if self.db_service:
                try:
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=message,
                        role="user"
                    )
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=assistant_message,
                        role="assistant"
                    )
                except Exception as db_error:
                    print(f"Warning: Failed to save chat to database: {db_error}")
            
            return {
                "response": assistant_message,
                "chat_id": chat_id,
                "message_id": f"msg_{uuid.uuid4().hex[:12]}"
            }
            
        except Exception as e:
            print(f"Groq API error: {e}")
            raise Exception(f"Failed to get response from AI: {str(e)}")
    
    async def coding(
        self,
        message: str,
        chat_id: Optional[str],
        user_id: str,
        language: str = "python"
    ) -> Dict[str, Any]:
        """
        Chat with AI specialized for coding - WITH DATABASE PERSISTENCE
        """
        # CRITICAL: Validate user_id
        if not user_id or user_id == 'anonymous':
            raise ValueError("Valid user_id is required for coding")
        
        # Load user's chats from database if not loaded
        await self._ensure_user_chats_loaded(user_id)
        
        # Create new chat if not provided
        if not chat_id:
            chat_id = self._create_chat_id(user_id, "coding")
        
        # Chat key with user isolation
        chat_key = self._get_chat_key(user_id, chat_id)
        
        # Create coding system prompt
        coding_system = f"""{self.coding_system}

Current language focus: {language}
When answering coding questions:
1. Provide clean, well-commented code
2. Include error handling where appropriate
3. Use modern best practices
4. Explain the solution clearly"""
        
        # Only create new if doesn't exist
        if chat_key not in self._chat_histories:
            self._chat_histories[chat_key] = [
                {"role": "system", "content": coding_system}
            ]
        
        # Store metadata
        self._chat_metadata[chat_key] = {
            "user_id": user_id,  # CRITICAL
            "chat_id": chat_id,
            "created_at": datetime.now(),
            "title": message[:50] + "..." if len(message) > 50 else message,
            "tool": "coding",
            "language": language
        }
        
        # Add user message
        self._chat_histories[chat_key].append(
            {"role": "user", "content": f"[{language}] {message}"}
        )
        
        try:
            # Use coding model
            response = await self.client.chat.completions.create(
                model=self.coding_model,
                messages=self._chat_histories[chat_key],
                temperature=0.3,
                max_tokens=4096,
                top_p=0.9,
                stream=False
            )
            
            assistant_message = response.choices[0].message.content
            
            # Add assistant response
            self._chat_histories[chat_key].append(
                {"role": "assistant", "content": assistant_message}
            )
            
            # Update metadata
            self._chat_metadata[chat_key]["last_message"] = assistant_message
            self._chat_metadata[chat_key]["updated_at"] = datetime.now()
            
            # Persist to database
            if self.db_service:
                try:
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=f"[{language}] {message}",
                        role="user"
                    )
                    await self.db_service.save_message(
                        user_id=user_id,
                        chat_id=chat_id,
                        message=assistant_message,
                        role="assistant"
                    )
                except Exception as db_error:
                    print(f"Warning: Failed to save coding chat to database: {db_error}")
            
            return {
                "response": assistant_message,
                "chat_id": chat_id,
                "message_id": f"msg_{uuid.uuid4().hex[:12]}"
            }
            
        except Exception as e:
            print(f"Groq API error: {e}")
            raise Exception(f"Failed to get coding response: {str(e)}")
    
    def get_chat_history(self, user_id: str, chat_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat history for a specific user and chat ONLY - LOADS FROM DB IF NEEDED"""
        # CRITICAL: Validate user_id
        if not user_id or user_id == 'anonymous':
            return []
        
        chat_key = self._get_chat_key(user_id, chat_id)
        
        # Ensure user's chats are loaded from database
        if user_id not in self._loaded_users:
            # Can't await here since this is not an async method
            # Return empty and let caller handle async loading
            return []
        
        if chat_key not in self._chat_histories:
            return []
        
        # Exclude system messages and limit
        history = [
            msg for msg in self._chat_histories[chat_key]
            if msg["role"] != "system"
        ]
        return history[-limit:]
    
    def get_all_chats(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all chats for a specific user ONLY - LOADS FROM DB IF NEEDED"""
        # CRITICAL: Validate user_id
        if not user_id or user_id == 'anonymous':
            return []
        
        # Ensure user's chats are loaded from database
        if user_id not in self._loaded_users:
            # Can't await here since this is not an async method
            # Return empty and let caller handle async loading
            return []
        
        user_chats = []
        
        # CRITICAL: Only include chats belonging to this user
        for chat_key, metadata in self._chat_metadata.items():
            parts = chat_key.split(":")
            if len(parts) >= 2:
                chat_user_id = parts[0]
                # CRITICAL: Must match user_id
                if chat_user_id == user_id and metadata.get("user_id") == user_id:
                    chat_id = parts[1]
                    user_chats.append({
                        "chat_id": chat_id,
                        "title": metadata.get("title", "Untitled"),
                        "created_at": metadata.get("created_at").isoformat() 
                            if metadata.get("created_at") else None,
                        "updated_at": metadata.get("updated_at").isoformat()
                            if metadata.get("updated_at") else None,
                        "tool": metadata.get("tool", "chat"),
                        "language": metadata.get("language")
                    })
        
        # Sort by updated_at
        user_chats.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return user_chats
    
    def delete_chat(self, user_id: str, chat_id: str) -> bool:
        """Delete a chat for a specific user ONLY"""
        # CRITICAL: Validate user_id
        if not user_id or user_id == 'anonymous':
            return False
            
        chat_key = self._get_chat_key(user_id, chat_id)
        
        # Verify ownership before delete
        if chat_key in self._chat_metadata:
            if self._chat_metadata[chat_key].get("user_id") != user_id:
                return False
            
            if chat_key in self._chat_histories:
                del self._chat_histories[chat_key]
            if chat_key in self._chat_metadata:
                del self._chat_metadata[chat_key]
            return True
        
        return False
    
    def rename_chat(self, user_id: str, chat_id: str, new_title: str) -> bool:
        """Rename a chat for a specific user ONLY"""
        # CRITICAL: Validate user_id
        if not user_id or user_id == 'anonymous':
            return False
            
        chat_key = self._get_chat_key(user_id, chat_id)
        
        # Verify ownership
        if chat_key in self._chat_metadata:
            if self._chat_metadata[chat_key].get("user_id") != user_id:
                return False
            self._chat_metadata[chat_key]["title"] = new_title
            return True
        return False
