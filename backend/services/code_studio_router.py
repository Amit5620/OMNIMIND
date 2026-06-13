from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .code_storage_service import CodeStorageService
from .code_studio_service import CodeStudioService


def build_code_studio_router(storage: CodeStorageService, studio: CodeStudioService) -> APIRouter:
    router = APIRouter(prefix="/api/code", tags=["code-studio"])

    class CodeCreateRequest(BaseModel):
        user_id: str = Field(...)
        title: str = Field(...)
        language: str = Field(..., default="TypeScript")
        platform: str = Field(..., default="fullstack")
        initial_request: str = Field(...)

    class CodeGenerateRequest(BaseModel):
        user_id: str
        project_id: str
        session_id: str

    class CodeTestRequest(BaseModel):
        user_id: str
        project_id: str
        session_id: str
        path: str

    class CodeSaveRequest(BaseModel):
        user_id: str
        project_id: str
        session_id: str
        message: str

    class CodeLoadRequest(BaseModel):
        user_id: str
        project_id: str

    class CodeRunRequest(BaseModel):
        user_id: str
        project_id: str
        session_id: str

    @router.post('/create')
    async def create(req: CodeCreateRequest):
        if not req.user_id or req.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail='Valid user_id is required')

        project_id = await storage.create_project(
            user_id=req.user_id,
            title=req.title,
            language=req.language,
            platform=req.platform,
            initial_request=req.initial_request,
        )
        # Create session
        session_id = await storage.create_session(project_id=project_id, user_id=req.user_id, context={})
        await storage.update_project_status(project_id, req.user_id, 'generating')

        # Start generation flow for first file
        res = await studio.start_generation_flow(
            user_id=req.user_id,
            initial_request=req.initial_request,
            session_id=session_id,
            project_id=project_id,
        )
        # Load project state
        loaded = await studio.load_project(user_id=req.user_id, project_id=project_id)
        return {
            'project': loaded['project'],
            'session': {'session_id': session_id, 'project_id': project_id},
            'files': loaded['files'],
            'generation': res,
        }

    @router.post('/generate')
    async def generate(req: CodeGenerateRequest):
        if not req.user_id or req.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail='Valid user_id is required')

        res = await studio.start_generation_flow(
            user_id=req.user_id,
            initial_request=(await storage.get_project(req.project_id, req.user_id) or {}).get('initial_request', ''),
            session_id=req.session_id,
            project_id=req.project_id,
        )
        return res

    @router.post('/test')
    async def test(req: CodeTestRequest):
        # Basic placeholder: in the full version, we would test the file contents.
        # For now we rely on the Testing agent during generation.
        if not req.user_id or req.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail='Valid user_id is required')

        files = await storage.get_files(req.project_id, req.user_id)
        code = files.get(req.path)
        if code is None:
            raise HTTPException(status_code=404, detail='File not found')
        corrected = await studio.test_file(code=code, target_path=req.path)
        await storage.upsert_file(req.project_id, req.user_id, req.path, corrected)
        return {'status': 'tested', 'path': req.path}

    @router.post('/save')
    async def save(req: CodeSaveRequest):
        # Store assistant prompt into session context (memory agent uses it later)
        if not req.user_id or req.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail='Valid user_id is required')

        session = await storage.get_session(project_id=req.project_id, user_id=req.user_id, session_id=req.session_id)
        context = (session or {}).get('context', {})
        context['assistant_message'] = req.message
        await storage.update_session_context(project_id=req.project_id, user_id=req.user_id, session_id=req.session_id, context=context)
        return {'status': 'saved'}

    @router.post('/load')
    async def load(req: CodeLoadRequest):
        if not req.user_id or req.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail='Valid user_id is required')

        loaded = await studio.load_project(user_id=req.user_id, project_id=req.project_id)
        return {'project': loaded['project'], 'files': loaded['files']}

    @router.post('/run')
    async def run(req: CodeRunRequest):
        # Runtime is executed in the browser (WebContainers). Backend returns a run recipe.
        if not req.user_id or req.user_id == 'anonymous':
            raise HTTPException(status_code=400, detail='Valid user_id is required')

        project = await storage.get_project(req.project_id, req.user_id)
        # Minimal recipe; frontend can render/execute.
        return {
            'status': 'recipe_ready',
            'command': 'npm install && npm run dev',
            'output': f"Run recipe ready for project: {project.get('title') if project else req.project_id}",
            'logs': [],
            'recipe': {
                'install': 'npm install',
                'start': 'npm run dev',
            },
        }

    return router

