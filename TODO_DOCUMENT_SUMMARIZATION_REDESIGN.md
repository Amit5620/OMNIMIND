# TODO: Document Summarization Tool Redesign (UI + RAG backend)

## Plan (approved)
1. ✅ **Frontend UI (src/pages/Workspace.tsx)**
   - Replace the Summarizer tool’s current “chat textarea + Send” UI with:
     - Document upload button
     - Selected file list
     - **Analyze** button
   - Trigger analysis only via **Analyze** (not Send/Enter).
   - Persist results by calling existing `chatAPI.documentSummarize` endpoint.

2. ⏳ **Backend RAG upgrade (backend/services/summarization_service.py + prompt_templates.py)**
   - Implement `summarize_document_rag` using chunking + retrieval via LLM scoring.
   - Add prompt template(s) needed for chunk relevance scoring.
   - Update existing document summarization endpoint method to use RAG (keep API contract unchanged).

## Progress
- [x] Implement frontend Summarizer UI upload + Analyze button (Workspace.tsx)
- [ ] Implement backend RAG document summarization (prompt_templates.py + summarization_service.py)
- [ ] Run manual verification


3. **Verification**

   - Run backend/frontend and manually test:
     - Switch to **Summarizer** tool
     - Upload 1–3 documents
     - Click **Analyze**
     - Confirm summary renders and headings match expected markdown format


