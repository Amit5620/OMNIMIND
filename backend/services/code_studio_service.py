"""OmniMind Code Studio service.

Implements multi-agent workflow:
- Planner (JSON-only): roadmap + file structure
- Coding agent: generate ONE file at a time (production-ready full file)
- Testing agent: review and return corrected full code for that file
- Memory agent: maintain session context

All model calls use Groq.
"""

from __future__ import annotations

import os
import json
import re
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

from groq import AsyncGroq

from .code_storage_service import CodeStorageService


env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


SYSTEM_CODING_AGENT = "You are OmniMind Code Engine, a senior software engineer and autonomous coding agent.\n\nRules:\n* Never apologize\n* Never refuse unless unsafe\n* Always generate complete working code\n* Always include imports\n* Never shorten code\n* Never use placeholders\n* Maintain project consistency\n* Return only code unless explanation requested\n* If task is large, split into files and continue sequentially"


SYSTEM_TESTER_AGENT = "Review this code carefully.\n\nCheck:\n* syntax issues\n* TypeScript issues\n* missing imports\n* React issues\n* FastAPI issues\n* dependency issues\n\nReturn corrected full code only."


@dataclass
class PlanResult:
    project_title: str
    language: str
    platform: str
    file_structure: List[str]
    roadmap: List[Dict[str, Any]]
    dependencies: Dict[str, Any]
    entrypoints: Dict[str, Any]


class CodeStudioService:
    def __init__(self, storage: CodeStorageService):
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY not configured in .env file")

        self.client = AsyncGroq(api_key=api_key)
        self.storage = storage

        # Model routing per requirements
        self.planner_model = "llama-3.3-70b-versatile"  # id 2h98jg
        self.coding_model = "deepseek-r1-distill-llama-70b"  # id 0tqtkv
        self.testing_model = "llama-3.3-70b-versatile"  # id 0ghg9z
        self.suggest_model = "llama3-8b-8192"  # id nnc47e

    async def plan(self, user_id: str, initial_request: str, session_id: str) -> PlanResult:
        # Planner agent: JSON only
        planner_system = (
            "You are OmniMind Code Planner.\n"
            "Generate a structured plan for creating a working full-stack project.\n"
            "Return JSON only with the exact schema. No markdown. No extra keys."
        )

        schema_prompt = (
            "Return JSON only with this schema:\n"
            "{\n"
            "  \"project_title\": string,\n"
            "  \"language\": string,\n"
            "  \"platform\": string,\n"
            "  \"file_structure\": string[],\n"
            "  \"roadmap\": [{\"step\": number, \"goal\": string, \"file_paths\": string[] }],\n"
            "  \"dependencies\": {\"frontend\": object, \"backend\": object},\n"
            "  \"entrypoints\": object\n"
            "}\n"
            "Constraints:\n"
            "- Must be executable when combined by the frontend WebContainer recipe.\n"
            "- Must include a package.json for frontend (Vite/React TS).\n"
            "- If backend is included, provide a FastAPI app structure with requirements.txt.\n"
        )

        resp = await self.client.chat.completions.create(
            model=self.planner_model,
            messages=[
                {"role": "system", "content": planner_system},
                {"role": "user", "content": schema_prompt + "\nUser request:\n" + initial_request},
            ],
            temperature=0.2,
            max_tokens=3072,
            top_p=0.9,
            stream=False,
        )

        raw = resp.choices[0].message.content or "{}"
        raw = raw.strip()
        # attempt to extract JSON if model wrapped it
        if not raw.startswith("{"):
            match = re.search(r"\{[\s\S]*\}", raw)
            if match:
                raw = match.group(0)

        data = json.loads(raw)
        return PlanResult(
            project_title=data.get("project_title", "Code Studio Project"),
            language=data.get("language", "TypeScript"),
            platform=data.get("platform", "fullstack"),
            file_structure=data.get("file_structure", []),
            roadmap=data.get("roadmap", []),
            dependencies=data.get("dependencies", {"frontend": {}, "backend": {}}),
            entrypoints=data.get("entrypoints", {}),
        )

    def _build_context_for_file(
        self,
        session_context: Dict[str, Any],
        project_files: Dict[str, str],
        target_path: str,
        user_request: str,
        error_feedback: Optional[str] = None,
    ) -> str:
        # Keep prompt manageable: include file paths + relevant existing contents
        existing_paths = sorted(project_files.keys())
        existing_preview = []
        for p in existing_paths:
            # include full only for small-ish files; otherwise include a snippet
            content = project_files[p]
            if len(content) <= 6000:
                existing_preview.append(f"--- FILE: {p} ---\n{content}")
            else:
                existing_preview.append(
                    f"--- FILE: {p} ---\n{content[:6000]}\n/* (truncated for prompt) */"
                )

        err_block = f"\n\nTesting feedback (must fix):\n{error_feedback}\n" if error_feedback else ""

        return (
            f"User request:\n{user_request}\n\n"
            f"Project session context:\n{json.dumps(session_context, indent=2)}\n\n"
            f"Target file path: {target_path}\n\n"
            "Existing project files:\n"
            + "\n".join(existing_preview)
            + err_block
            + "\n\nGenerate the complete corrected contents ONLY for the target file."
        )

    async def generate_file(
        self,
        user_id: str,
        session_id: str,
        project_id: str,
        user_request: str,
        target_path: str,
        project_files: Dict[str, str],
        session_context: Dict[str, Any],
        error_feedback: Optional[str] = None,
    ) -> str:
        # Coding agent: return only code for the target file.
        prompt = self._build_context_for_file(
            session_context=session_context,
            project_files=project_files,
            target_path=target_path,
            user_request=user_request,
            error_feedback=error_feedback,
        )

        resp = await self.client.chat.completions.create(
            model=self.coding_model,
            messages=[
                {"role": "system", "content": SYSTEM_CODING_AGENT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=8192,
            top_p=0.9,
            stream=False,
        )

        code = resp.choices[0].message.content or ""
        # strip possible fences but DO NOT shorten content
        code = code.strip()
        if code.startswith("```"):
            code = re.sub(r"^```[a-zA-Z0-9_-]*\n", "", code)
            code = re.sub(r"\n```$", "", code)
        return code

    async def test_file(self, code: str, target_path: str) -> str:
        tester_user = (
            f"Target path: {target_path}\n\n"
            "Code:\n" + code
        )

        resp = await self.client.chat.completions.create(
            model=self.testing_model,
            messages=[
                {"role": "system", "content": SYSTEM_TESTER_AGENT},
                {"role": "user", "content": tester_user},
            ],
            temperature=0.1,
            max_tokens=8192,
            top_p=0.9,
            stream=False,
        )

        out = (resp.choices[0].message.content or "").strip()
        if out.startswith("```"):
            out = re.sub(r"^```[a-zA-Z0-9_-]*\n", "", out)
            out = re.sub(r"\n```$", "", out)
        return out

    async def start_generation_flow(
        self,
        user_id: str,
        initial_request: str,
        session_id: str,
        project_id: str,
    ) -> Dict[str, Any]:
        # Load session context
        session = await self.storage.get_session(project_id=project_id, user_id=user_id, session_id=session_id)
        session_context = (session or {}).get("context", {})

        # If already planned, continue
        plan_obj = session_context.get("plan")
        if not plan_obj:
            plan = await self.plan(user_id, initial_request, session_id)
            session_context["plan"] = plan.__dict__
            session_context["pending_files"] = list(plan.file_structure)
            session_context["generated_files"] = []
            session_context["user_request"] = initial_request
            await self.storage.update_session_context(project_id, user_id, session_id, session_context)

            await self.storage.set_dependency_manifest(
                project_id=project_id,
                user_id=user_id,
                dependency_manifest=session_context["plan"].get("dependencies", {}),
                entrypoints=session_context["plan"].get("entrypoints", {}),
            )
            await self.storage.update_project_status(project_id, user_id, "generating")

        # Determine next file
        pending = session_context.get("pending_files", [])
        generated = set(session_context.get("generated_files", []))

        next_file = None
        for p in pending:
            if p not in generated:
                next_file = p
                break

        if not next_file:
            await self.storage.update_project_status(project_id, user_id, "ready")
            return {"status": "ready", "project_id": project_id}

        # Load current project files
        project_files = await self.storage.get_files(project_id, user_id)

        generated_code = await self.generate_file(
            user_id=user_id,
            session_id=session_id,
            project_id=project_id,
            user_request=initial_request,
            target_path=next_file,
            project_files=project_files,
            session_context=session_context,
        )

        # Test/correct
        corrected_code = await self.test_file(generated_code, next_file)

        # Save
        await self.storage.upsert_file(project_id, user_id, next_file, corrected_code)

        # Update session context
        session_context.setdefault("generated_files", [])
        if next_file not in session_context["generated_files"]:
            session_context["generated_files"].append(next_file)

        await self.storage.update_session_context(project_id, user_id, session_id, session_context)
        await self.storage.update_project_status(project_id, user_id, "generating")

        return {
            "status": "file_generated",
            "project_id": project_id,
            "session_id": session_id,
            "file_path": next_file,
        }

    async def save_file(
        self,
        user_id: str,
        project_id: str,
        path: str,
        content: str,
    ) -> None:
        await self.storage.upsert_file(project_id, user_id, path, content)

    async def load_project(self, user_id: str, project_id: str) -> Dict[str, Any]:
        project = await self.storage.get_project(project_id, user_id)
        files = await self.storage.get_files(project_id, user_id)
        return {
            "project": project,
            "files": files,
        }

