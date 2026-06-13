"""
Database Service using Astra DB (Cassandra)

Requirement:
- Keep existing chat tool behavior working as-is.
- For other tools, persist to separate collections (storages) and route save/retrieve/edit/delete accordingly.
- Frontend expects /api/chat/history to return all tool conversations with a unified shape:
  { chat_id, title, tool, created_at, updated_at, messages: [{ message_id, role, content, created_at, type?, image_url?, image_data? }] }

Implementation notes:
- In-memory storage keeps a unified structure for quick access.
- Persistent storage uses tool-specific collections:
    chats, coding_chats, youtube_chats, website_chats, document_chats, image_generations, translation_chats
- Tool inference is done from chat_id prefixes:
    chat_      -> chat
    coding_    -> coding
    youtube_   -> youtube
    website_   -> website
    doc_       -> document
    image_     -> image
    translate_ -> translation
"""

from __future__ import annotations

import os
import uuid
from typing import Optional, Dict, Any, List, Literal

from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

try:
    from astrapy import DataAPIClient  # type: ignore
    ASTRA_AVAILABLE = True
except ImportError:
    ASTRA_AVAILABLE = False
    print("Warning: astrapy not installed. Using in-memory storage.")

# Load environment from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Astra DB Configuration
ASTRA_DB_APPLICATION_TOKEN = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
ASTRA_DB_API_ENDPOINT = os.getenv("ASTRA_DB_API_ENDPOINT")


ToolName = Literal[
    "chat",
    "coding",
    "youtube",
    "website",
    "document",
    "image",
    "translation",
]

DEFAULT_TOOL: ToolName = "chat"

COLLECTION_BY_TOOL: Dict[ToolName, str] = {
    "chat": "chats",
    "coding": "coding_chats",
    "youtube": "youtube_chats",
    "website": "website_chats",
    "document": "document_chats",
    "image": "image_generations",
    "translation": "translation_chats",
}


class DatabaseService:
    """Service for storing data in Astra DB / Cassandra - PROPER NESTED STRUCTURE"""

    def __init__(self):
        self.db_token = ASTRA_DB_APPLICATION_TOKEN
        self.api_endpoint = ASTRA_DB_API_ENDPOINT

        self.is_connected = False
        self.client = None
        self.database = None

        # In-memory storage with proper nested structure:
        # {user_id: {chat_id: {chat_data with messages array}}}
        self._chats: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._contact_store: List[Dict[str, Any]] = []

    def _get_user_chats(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Get or create user chats storage"""
        if user_id not in self._chats:
            self._chats[user_id] = {}
        return self._chats[user_id]

    def _infer_tool_from_chat_id(self, chat_id: str) -> ToolName:
        if not chat_id:
            return DEFAULT_TOOL

        if chat_id.startswith("chat_"):
            return "chat"
        if chat_id.startswith("coding_"):
            return "coding"
        if chat_id.startswith("youtube_"):
            return "youtube"
        if chat_id.startswith("website_"):
            return "website"
        if chat_id.startswith("doc_"):
            return "document"
        if chat_id.startswith("image_"):
            return "image"
        if chat_id.startswith("translate_"):
            return "translation"

        return DEFAULT_TOOL

    def _collection_for_chat_id(self, chat_id: str) -> str:
        tool = self._infer_tool_from_chat_id(chat_id)
        return COLLECTION_BY_TOOL[tool]

    def _normalize_tool_name(self, tool: str) -> str:
        if tool == "translate":
            return "translation"
        return tool

    def _collection_for_tool(self, tool: str) -> str:
        normalized_tool = self._normalize_tool_name(tool)
        return COLLECTION_BY_TOOL[normalized_tool]  # type: ignore[index]

    async def connect(self):
        """Connect to Astra DB"""
        if not ASTRA_AVAILABLE:
            print("⚠️ astrapy not available. Using in-memory storage.")
            self.is_connected = False
            return

        if not self.api_endpoint or not self.db_token or "your" in self.api_endpoint:
            print("⚠️ Astra DB not configured. Using in-memory storage.")
            self.is_connected = False
            return

        try:
            self.client = DataAPIClient()
            self.database = self.client.get_database(
                api_endpoint=self.api_endpoint,
                token=self.db_token,
            )
            self.is_connected = True
            await self._create_collections()
            print("✅ Connected to Astra DB")
        except Exception as e:
            print(f"⚠️ Failed to connect to Astra DB: {e}")
            self.is_connected = False

    async def _create_collections(self):
        """Create collections for each tool"""
        if not self.is_connected or not self.database:
            return

        try:
            collections = set(self.database.list_collection_names())

            for tool, name in COLLECTION_BY_TOOL.items():
                if name not in collections:
                    self.database.create_collection(name)

            if "contacts" not in collections:
                self.database.create_collection("contacts")
        except Exception as e:
            print(f"Collection error: {e}")

    async def disconnect(self):
        """Disconnect"""
        self.client = None
        self.database = None
        self.is_connected = False

    # ===================
    # Chat Operations - NESTED STRUCTURE
    # ===================

    async def create_chat(
        self,
        user_id: str,
        tool: ToolName = "chat",
        chat_id: Optional[str] = None,
        title: Optional[str] = None,
    ) -> str:
        """Create new chat with nested messages array (in-memory + DB upsert)."""
        if not user_id or user_id == "anonymous":
            raise ValueError("Valid user_id required")

        if not chat_id:
            prefix = {
                "chat": "chat",
                "coding": "coding",
                "youtube": "youtube",
                "website": "website",
                "document": "doc",
                "image": "image",
                "translation": "translate",
            }[tool]
            chat_id = f"{prefix}_{user_id}_{uuid.uuid4().hex[:12]}"

        if not title:
            title = "New Chat"

        now = datetime.now().isoformat()
        chat_data: Dict[str, Any] = {
            "chat_id": chat_id,
            "user_id": user_id,
            "title": title,
            "tool": tool,
            "created_at": now,
            "updated_at": now,
            "messages": [],
        }

        user_chats = self._get_user_chats(user_id)
        user_chats[chat_id] = chat_data

        if self.is_connected and self.database:
            try:
                collection_name = self._collection_for_tool(tool)
                collection = self.database.get_collection(collection_name)
                collection.update_one(
                    {"chat_id": chat_id, "user_id": user_id},
                    {"$set": chat_data},
                    upsert=True,
                )
            except Exception as e:
                print(f"Error creating chat in DB: {e}")

        print(f"✅ Created chat: {chat_id} for user: {user_id} (tool={tool})")
        return chat_id

    async def save_message(
        self,
        user_id: str,
        chat_id: str,
        message: str,
        role: str = "user",
        create_chat_if_not_exists: bool = True,
        message_type: Optional[Literal["text", "image", "file"]] = None,
        message_source: Optional[Literal["summary", "qa", "plain"]] = None,
        image_url: Optional[str] = None,
        image_data: Optional[str] = None,
    ) -> Optional[str]:
        """Save message to existing chat's messages array - FIXED with upsert."""
        if not user_id or user_id == "anonymous":
            return None

        tool = self._infer_tool_from_chat_id(chat_id)
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        now = datetime.now().isoformat()

        # Get chat from memory or DB
        user_chats = self._get_user_chats(user_id)
        chat = user_chats.get(chat_id)

        # Try DB if not in memory
        if chat is None and self.is_connected and self.database:
            try:
                collection_name = self._collection_for_chat_id(chat_id)
                collection = self.database.get_collection(collection_name)
                db_chat = collection.find_one({"chat_id": chat_id, "user_id": user_id})
                if db_chat:
                    chat = db_chat
                    user_chats[chat_id] = chat
            except Exception as e:
                print(f"Error getting chat from DB: {e}")

        # Auto-create chat if doesn't exist
        if chat is None:
            if not create_chat_if_not_exists:
                print(f"⚠️ Chat not found and create_chat_if_not_exists=False: {chat_id}")
                return None

            now = datetime.now().isoformat()
            title = message[:50] + "..." if len(message) > 50 else message

            # IMPORTANT: persist a correctly tool-routed chat document.
            # tool must match the chat_id prefix so /api/chat/history can find it.
            chat_data = {
                "chat_id": chat_id,
                "user_id": user_id,
                "title": title,
                "tool": tool,
                "created_at": now,
                "updated_at": now,
                "messages": [],
            }
            user_chats[chat_id] = chat_data
            chat = chat_data

            if self.is_connected and self.database:
                try:
                    collection_name = self._collection_for_tool(tool)
                    collection = self.database.get_collection(collection_name)
                    # $setOnInsert ensures we don't accidentally overwrite fields if an older doc exists
                    collection.update_one(
                        {"chat_id": chat_id, "user_id": user_id},
                        {"$set": chat_data},
                        upsert=True,
                    )
                    print(f"✅ Created chat in DB via upsert: {chat_id} (tool={tool})")
                except Exception as e:
                    print(f"Error creating chat in DB: {e}")

        message_data: Dict[str, Any] = {
            "message_id": message_id,
            "role": role,
            "content": message,
            "created_at": now,
        }
        if message_type:
            message_data["type"] = message_type
        if message_source:
            message_data["message_source"] = message_source
        if image_url:
            message_data["image_url"] = image_url
        if image_data:
            message_data["image_data"] = image_data

        messages = chat.get("messages", [])
        messages.append(message_data)
        chat["messages"] = messages
        chat["updated_at"] = now

        user_chats[chat_id] = chat

        if self.is_connected and self.database:
            try:
                collection_name = self._collection_for_tool(tool)
                collection = self.database.get_collection(collection_name)
                collection.update_one(
                    {"chat_id": chat_id, "user_id": user_id},
                    {"$set": {"messages": messages, "updated_at": now}},
                    upsert=True,
                )
            except Exception as e:
                print(f"Error saving to DB: {e}")

        print(f"✅ Saved message to chat: {chat_id}, role: {role}, tool={tool}")
        return message_id

    async def save_image(
        self,
        user_id: str,
        chat_id: str,
        image_urls: List[str],
        prompt: str,
    ) -> None:
        """
        Persist image generation result as chat messages in the 'image' tool storage.
        Frontend expects message fields:
          - type === 'image'
          - image_url or image_data
        """
        if not image_urls:
            image_urls = []

        # Save user prompt
        if prompt:
            await self.save_message(
                user_id=user_id,
                chat_id=chat_id,
                message=prompt,
                role="user",
                message_type="text",
            )

        # Save assistant image (use first image URL for UI; keep all as extra metadata)
        assistant_image_url = image_urls[0] if image_urls else None
        image_message_content = "Here's your generated image:" if assistant_image_url else "Image generated."

        # Note: database_service.save_message doesn't store arbitrary fields like image_urls array.
        # We embed the first image URL via image_url, and rely on imageUrls for future improvements.
        await self.save_message(
            user_id=user_id,
            chat_id=chat_id,
            message=image_message_content,
            role="assistant",
            message_type="image",
            image_url=assistant_image_url,
        )

    async def get_chat(
        self,
        user_id: str,
        chat_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get single chat with all its messages."""
        if not user_id or user_id == "anonymous":
            return None

        user_chats = self._get_user_chats(user_id)
        chat = user_chats.get(chat_id)
        if chat:
            return chat

        if self.is_connected and self.database:
            try:
                collection_name = self._collection_for_chat_id(chat_id)
                collection = self.database.get_collection(collection_name)
                chat = collection.find_one({"chat_id": chat_id, "user_id": user_id})
                if chat:
                    user_chats[chat_id] = chat
                    return chat
            except Exception as e:
                print(f"Error getting chat from DB: {e}")

        return None

    async def update_chat_title(self, chat_id: str, title: str, user_id: str) -> bool:
        """Update chat title (tool-routed)."""
        if not user_id or user_id == "anonymous":
            return False

        now = datetime.now().isoformat()
        tool = self._infer_tool_from_chat_id(chat_id)

        user_chats = self._get_user_chats(user_id)
        if chat_id in user_chats:
            user_chats[chat_id]["title"] = title
            user_chats[chat_id]["updated_at"] = now
        else:
            if self.is_connected and self.database:
                try:
                    collection_name = self._collection_for_tool(tool)
                    collection = self.database.get_collection(collection_name)
                    result = collection.update_one(
                        {"chat_id": chat_id, "user_id": user_id},
                        {"$set": {"title": title, "updated_at": now}},
                        upsert=True,
                    )
                    if result.modified_count > 0:
                        return True
                except Exception as e:
                    print(f"Error updating chat title in DB: {e}")
                    return False

        if self.is_connected and self.database:
            try:
                collection_name = self._collection_for_tool(tool)
                collection = self.database.get_collection(collection_name)
                collection.update_one(
                    {"chat_id": chat_id, "user_id": user_id},
                    {"$set": {"title": title, "updated_at": now}},
                    upsert=True,
                )
            except Exception as e:
                print(f"Error updating chat title in DB: {e}")

        return True

    async def delete_chat(self, user_id: str, chat_id: str) -> bool:
        """Delete entire chat with all its messages (tool-routed)."""
        if not user_id or user_id == "anonymous":
            return False

        deleted = False

        tool = self._infer_tool_from_chat_id(chat_id)

        # Delete from memory
        user_chats = self._get_user_chats(user_id)
        if chat_id in user_chats:
            del user_chats[chat_id]
            deleted = True

        # Delete from DB
        if self.is_connected and self.database:
            try:
                collection_name = self._collection_for_tool(tool)
                collection = self.database.get_collection(collection_name)
                result = collection.delete_one({"chat_id": chat_id, "user_id": user_id})
                if result.deleted_count > 0:
                    deleted = True
            except Exception as e:
                print(f"Error deleting chat from DB: {e}")

        return deleted

    async def get_chat_history(
        self,
        user_id: str,
        tool: Optional[str] = None,
        chat_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Get user's chats (across all tool collections, tool-filtered if specified)."""
        if not user_id or user_id == "anonymous":
            return []

        result: List[Dict[str, Any]] = []

        # Get from memory first
        user_chats = self._get_user_chats(user_id)

        def add_chat_doc(cid: str, chat: Dict[str, Any]) -> None:
            messages = chat.get("messages", [])
            result.append(
                {
                    "chat_id": cid,
                    "title": chat.get("title", "Untitled"),
                    "tool": chat.get("tool", self._infer_tool_from_chat_id(cid)),
                    "created_at": chat.get("created_at"),
                    "updated_at": chat.get("updated_at"),
                    "messages": messages[-limit:] if limit else messages,
                }
            )

        if chat_id:
            # Specific chat requested
            chat = user_chats.get(chat_id)
            if chat and chat.get("user_id") == user_id:
                add_chat_doc(chat_id, chat)
        elif tool:
            normalized_tool = self._normalize_tool_name(tool)
            # Filter by specific tool
            prefix_map = {
                "chat": "chat_",
                "coding": "coding_",
                "youtube": "youtube_",
                "website": "website_",
                "document": "doc_",
                "image": "image_",
                "generate": "image_",
                "translate": "translate_",
                "translation": "translate_",
            }
            prefix = prefix_map.get(tool, "")
            for cid, chat in user_chats.items():
                if (
                    chat.get("user_id") == user_id
                    and (
                        (prefix and cid.startswith(prefix))
                        or (not prefix and chat.get("tool") == normalized_tool)
                    )
                ):
                    add_chat_doc(cid, chat)

        else:
            # No tool specified - return all user's chats (but this should be rare)
            for cid, chat in user_chats.items():
                if chat.get("user_id") == user_id:
                    add_chat_doc(cid, chat)

        # Also get from DB (tool-filtered if specified)
        if self.is_connected and self.database:
            try:
                if chat_id:
                    collection_name = self._collection_for_chat_id(chat_id)
                    collection = self.database.get_collection(collection_name)
                    docs = list(collection.find({"user_id": user_id, "chat_id": chat_id}))
                    for doc in docs:
                        add_chat_doc(doc.get("chat_id"), doc)
                elif tool:
                    normalized_tool = self._normalize_tool_name(tool)
                    # Tool-specific collection
                    collection_name = self._collection_for_tool(normalized_tool)
                    collection = self.database.get_collection(collection_name)
                    docs = list(collection.find({"user_id": user_id}))
                    for doc in docs:
                        add_chat_doc(doc.get("chat_id"), doc)
                else:
                    # No tool specified - get from all collections but mark tool properly
                    for collection_name in COLLECTION_BY_TOOL.values():
                        collection = self.database.get_collection(collection_name)
                        docs = list(collection.find({"user_id": user_id}))
                        for doc in docs:
                            add_chat_doc(doc.get("chat_id"), doc)
            except Exception as e:
                print(f"Error getting chat history from DB: {e}")

        # Sort by updated_at descending
        result.sort(key=lambda x: x.get("updated_at", ""), reverse=True)

        # De-dupe by chat_id (can occur if memory + db both have the same chat)
        deduped: List[Dict[str, Any]] = []
        seen = set()
        for item in result:
            cid = item.get("chat_id")
            if cid in seen:
                continue
            seen.add(cid)
            deduped.append(item)

        return deduped

    # ===================
    # Contact Operations
    # ===================

    async def save_contact(
        self,
        name: str,
        email: str,
        message: str,
        user_id: Optional[str] = None,
    ):
        """Save contact form"""
        contact_id = f"contact_{uuid.uuid4().hex[:12]}"

        contact_data = {
            "contact_id": contact_id,
            "name": name,
            "email": email,
            "message": message,
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
        }

        if self.is_connected and self.database:
            try:
                collection = self.database.get_collection("contacts")
                collection.insert_one(contact_data)
            except Exception:
                self._contact_store.append(contact_data)
        else:
            self._contact_store.append(contact_data)

        return contact_id

    async def get_contacts(self, user_id: str) -> List[Dict[str, Any]]:
        """Get contacts"""
        if self.is_connected and self.database:
            try:
                collection = self.database.get_collection("contacts")
                return list(collection.find())
            except Exception:
                return self._contact_store
        return self._contact_store
