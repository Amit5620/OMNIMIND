"""Code Studio storage service.

Adds a structured persistence layer for:
- code_projects
- code_files
- code_sessions

This module is intentionally separated from DatabaseService to avoid impacting existing chat/image tools.
"""

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path

from dotenv import load_dotenv

try:
    from astrapy import DataAPIClient  # type: ignore
    ASTRA_AVAILABLE = True
except ImportError:
    ASTRA_AVAILABLE = False


env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


@dataclass
class CodeStorageConfig:
    api_endpoint: Optional[str]
    token: Optional[str]


CODE_PROJECTS_COLLECTION = "code_projects"
CODE_FILES_COLLECTION = "code_files"
CODE_SESSIONS_COLLECTION = "code_sessions"


class CodeStorageService:
    def __init__(self, api_endpoint: Optional[str] = None, token: Optional[str] = None):
        self._api_endpoint = api_endpoint or os.getenv("ASTRA_DB_API_ENDPOINT")
        self._token = token or os.getenv("ASTRA_DB_APPLICATION_TOKEN")

        self._client = None
        self._database = None
        self.is_connected = False

        # in-memory fallback
        self._projects: Dict[str, Dict[str, Any]] = {}
        self._files: Dict[str, Dict[str, str]] = {}  # project_id -> {path -> content}
        self._sessions: Dict[str, Dict[str, Any]] = {}

    async def connect(self):
        if not ASTRA_AVAILABLE:
            self.is_connected = False
            return

        if not self._api_endpoint or not self._token or "your" in str(self._api_endpoint):
            self.is_connected = False
            return

        try:
            self._client = DataAPIClient()
            self._database = self._client.get_database(
                api_endpoint=self._api_endpoint,
                token=self._token,
            )
            self.is_connected = True
            await self._ensure_collections()
        except Exception:
            self.is_connected = False

    async def disconnect(self):
        self._client = None
        self._database = None
        self.is_connected = False

    async def _ensure_collections(self):
        if not self.is_connected or not self._database:
            return
        try:
            existing = set(self._database.list_collection_names())
            for name in [CODE_PROJECTS_COLLECTION, CODE_FILES_COLLECTION, CODE_SESSIONS_COLLECTION]:
                if name not in existing:
                    self._database.create_collection(name)
        except Exception:
            # safe: collections will be created on first upsert in practice (Astra)
            pass

    # ----------------------------
    # Projects
    # ----------------------------

    async def create_project(
        self,
        user_id: str,
        title: str,
        language: str,
        platform: str,
        initial_request: str,
    ) -> str:
        project_id = f"codeproj_{user_id}_{uuid.uuid4().hex[:12]}"
        now = datetime.now().isoformat()

        project_doc: Dict[str, Any] = {
            "project_id": project_id,
            "user_id": user_id,
            "title": title,
            "language": language,
            "platform": platform,
            "initial_request": initial_request,
            "created_at": now,
            "updated_at": now,
            "status": "planning",
            "dependency_manifest": None,
            "entrypoints": None,
        }

        self._projects[project_id] = project_doc
        self._files[project_id] = {}

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_PROJECTS_COLLECTION)
                collection.update_one(
                    {"project_id": project_id, "user_id": user_id},
                    {"$set": project_doc},
                    upsert=True,
                )
            except Exception:
                pass

        return project_id

    async def update_project_status(self, project_id: str, user_id: str, status: str) -> None:
        now = datetime.now().isoformat()
        if project_id in self._projects:
            self._projects[project_id]["status"] = status
            self._projects[project_id]["updated_at"] = now

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_PROJECTS_COLLECTION)
                collection.update_one(
                    {"project_id": project_id, "user_id": user_id},
                    {"$set": {"status": status, "updated_at": now}},
                    upsert=True,
                )
            except Exception:
                pass

    async def set_dependency_manifest(
        self,
        project_id: str,
        user_id: str,
        dependency_manifest: Dict[str, Any],
        entrypoints: Optional[Dict[str, Any]] = None,
    ) -> None:
        now = datetime.now().isoformat()

        if project_id in self._projects:
            self._projects[project_id]["dependency_manifest"] = dependency_manifest
            if entrypoints is not None:
                self._projects[project_id]["entrypoints"] = entrypoints
            self._projects[project_id]["updated_at"] = now

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_PROJECTS_COLLECTION)
                payload: Dict[str, Any] = {
                    "dependency_manifest": dependency_manifest,
                    "updated_at": now,
                }
                if entrypoints is not None:
                    payload["entrypoints"] = entrypoints
                collection.update_one(
                    {"project_id": project_id, "user_id": user_id},
                    {"$set": payload},
                    upsert=True,
                )
            except Exception:
                pass

    async def get_project(self, project_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if project_id in self._projects and self._projects[project_id].get("user_id") == user_id:
            return self._projects[project_id]

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_PROJECTS_COLLECTION)
                doc = collection.find_one({"project_id": project_id, "user_id": user_id})
                if doc:
                    self._projects[project_id] = doc
                    if project_id not in self._files:
                        self._files[project_id] = {}
                    return doc
            except Exception:
                pass

        return None

    # ----------------------------
    # Files
    # ----------------------------

    async def upsert_file(self, project_id: str, user_id: str, path: str, content: str) -> None:
        if project_id not in self._files:
            self._files[project_id] = {}
        self._files[project_id][path] = content

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_FILES_COLLECTION)
                doc = {
                    "project_id": project_id,
                    "user_id": user_id,
                    "path": path,
                    "content": content,
                    "updated_at": datetime.now().isoformat(),
                }
                collection.update_one(
                    {"project_id": project_id, "user_id": user_id, "path": path},
                    {"$set": doc},
                    upsert=True,
                )
            except Exception:
                pass

    async def get_files(self, project_id: str, user_id: str) -> Dict[str, str]:
        if project_id in self._files and self._projects.get(project_id, {}).get("user_id") == user_id:
            return dict(self._files[project_id])

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_FILES_COLLECTION)
                docs = list(collection.find({"project_id": project_id, "user_id": user_id}))
                files = {d.get("path"): d.get("content", "") for d in docs if d.get("path")}
                self._files[project_id] = files
                return files
            except Exception:
                pass

        return {}

    # ----------------------------
    # Sessions
    # ----------------------------

    async def create_session(
        self,
        project_id: str,
        user_id: str,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        session_id = session_id or f"codesess_{uuid.uuid4().hex[:12]}"
        now = datetime.now().isoformat()
        doc: Dict[str, Any] = {
            "session_id": session_id,
            "project_id": project_id,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
            "context": context or {},
        }
        self._sessions[session_id] = doc

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_SESSIONS_COLLECTION)
                collection.update_one(
                    {"session_id": session_id, "project_id": project_id, "user_id": user_id},
                    {"$set": doc},
                    upsert=True,
                )
            except Exception:
                pass

        return session_id

    async def update_session_context(self, project_id: str, user_id: str, session_id: str, context: Dict[str, Any]) -> None:
        now = datetime.now().isoformat()
        if session_id in self._sessions:
            self._sessions[session_id]["context"] = context
            self._sessions[session_id]["updated_at"] = now

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_SESSIONS_COLLECTION)
                collection.update_one(
                    {"session_id": session_id, "project_id": project_id, "user_id": user_id},
                    {"$set": {"context": context, "updated_at": now}},
                    upsert=True,
                )
            except Exception:
                pass

    async def get_session(self, project_id: str, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        s = self._sessions.get(session_id)
        if s and s.get("project_id") == project_id and s.get("user_id") == user_id:
            return s

        if self.is_connected and self._database:
            try:
                collection = self._database.get_collection(CODE_SESSIONS_COLLECTION)
                doc = collection.find_one({
                    "session_id": session_id,
                    "project_id": project_id,
                    "user_id": user_id,
                })
                if doc:
                    self._sessions[session_id] = doc
                    return doc
            except Exception:
                pass

        return None

