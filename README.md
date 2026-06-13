# OmniMind

OmniMind is a full-stack AI productivity platform that combines a React workspace with a FastAPI backend for conversational AI, coding help, summarization, image generation, translation, chat history, contact submissions, and an experimental Code Studio workflow.

The application is split into a Vite/React frontend and a Python backend. Firebase handles browser-side authentication and profile/admin lookup, while the backend stores AI conversations and generated assets through Astra DB and Cloudinary when those services are configured.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Frontend Routes](#frontend-routes)
- [Backend API](#backend-api)
- [Data Storage](#data-storage)
- [Security Model](#security-model)
- [Code Studio](#code-studio)
- [Streamlit Utility App](#streamlit-utility-app)
- [Build and Deployment](#build-and-deployment)
- [Known Integration Notes](#known-integration-notes)
- [Troubleshooting](#troubleshooting)

## Features

### AI Workspace

- General AI chat powered by Groq.
- Coding assistant with code-focused prompting and markdown code rendering.
- YouTube summarization using transcript extraction.
- Website summarization using fetched page content.
- Document summarization for text, markdown, PDF, and DOCX content.
- Follow-up Q&A against previously summarized content.
- Image generation through Hugging Face inference, with generated assets uploaded to Cloudinary when configured.
- Image edit flow using an existing image URL and edit prompt.
- Translation workflow with language selection and preserved markdown/code formatting.
- Persistent tool-specific chat history with create, rename, delete, and reload flows.

### Application Pages

- Public pages: Home, About, Services, Blog, Contact, How To Use, Privacy, Terms.
- Auth pages: Login, Register, Forgot Password.
- User pages: Profile and Settings.
- Admin pages: Admin Dashboard and Admin Blog.
- Code Studio page for AI-assisted project generation.
- Floating coding chatbot for quick code help.

### Backend Capabilities

- FastAPI application with typed Pydantic request/response models.
- CORS configuration for local frontend development.
- Centralized Groq orchestration for chat, coding, translation, and summarization.
- Tool-specific prompt templates in `backend/services/prompt_templates.py`.
- Astra DB-backed chat storage with in-memory fallback.
- Cloudinary image upload helper with placeholder fallback behavior.
- Contact message persistence.

## Architecture

```text
Browser
  |
  | React + Vite + Tailwind CSS
  | Firebase Auth / Firestore profile lookup
  v
Frontend API client
  src/lib/api.ts
  |
  | HTTP JSON requests
  v
FastAPI backend
  backend/main.py
  |
  +-- GroqService              -> chat and coding
  +-- SummarizationService     -> YouTube, website, document summaries, QA
  +-- TranslationService       -> text translation
  +-- ImageGenerationService   -> Hugging Face image generation/editing
  +-- CloudinaryService        -> generated image hosting
  +-- DatabaseService          -> Astra DB or in-memory fallback
  +-- CodeStudioService        -> experimental code project generation
```

The frontend talks to the backend through `src/lib/api.ts`. The backend exposes `/api/...` routes from `backend/main.py`, with the Code Studio routes implemented separately in `backend/services/code_studio_router.py`.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite 6
- React Router
- Tailwind CSS 4 via `@tailwindcss/vite`
- Firebase Auth and Firestore
- Axios
- Monaco Editor
- Lucide React icons
- Motion / Framer Motion
- React Markdown, KaTeX, remark-math, rehype-katex
- Recharts

### Backend

- Python 3.10+
- FastAPI
- Uvicorn
- Pydantic 2
- Groq Python SDK
- OpenAI SDK dependency available
- Hugging Face Hub
- Astra DB / Cassandra through `astrapy`
- Cloudinary
- BeautifulSoup, aiohttp, requests
- PyPDF2 and python-docx
- YouTube Transcript API
- Optional Streamlit/LangChain summarization utility

## Project Structure

```text
.
|-- src/
|   |-- App.tsx                    # Main React router
|   |-- main.tsx                   # React entry point
|   |-- index.css                  # Global styles
|   |-- components/
|   |   |-- FirebaseProvider.tsx    # Auth/profile context
|   |   |-- MarkdownMessage.tsx     # Markdown rendering
|   |   |-- layout/                 # Header and footer
|   |   `-- shared/                 # Chatbot and code block components
|   |-- lib/
|   |   |-- api.ts                  # Backend API client
|   |   |-- firebase.ts             # Firebase initialization
|   |   |-- gemini.ts               # Gemini client helper
|   |   `-- utils.ts
|   `-- pages/
|       |-- Workspace.tsx           # Main AI workspace
|       |-- CodeStudio.tsx          # AI code generation interface
|       |-- Auth/                   # Login/register/password reset
|       |-- Blog/                   # Blog pages and admin blog
|       |-- Admin/                  # Admin dashboard
|       `-- ...                     # Public and user pages
|
|-- backend/
|   |-- main.py                     # FastAPI app and primary API routes
|   |-- requirements.txt            # Python dependencies
|   |-- streamlit_app.py            # Optional Streamlit summarization app
|   `-- services/
|       |-- ai_orchestrator.py
|       |-- cloudinary_service.py
|       |-- code_storage_service.py
|       |-- code_studio_router.py
|       |-- code_studio_service.py
|       |-- database_service.py
|       |-- groq_service.py
|       |-- image_service.py
|       |-- prompt_templates.py
|       |-- summarization_service.py
|       `-- translation_service.py
|
|-- firebase-applet-config.json     # Firebase client config
|-- firestore.rules                 # Firestore security rules
|-- security_spec.md                # Security invariants and abuse cases
|-- server.ts                       # Optional Express/Vite development server
|-- vite.config.ts
|-- tsconfig.json
|-- package.json
`-- README.md
```

## Prerequisites

- Node.js 20+ recommended.
- npm.
- Python 3.10+ recommended.
- A Firebase project with Authentication and Firestore configured.
- A Groq API key.
- Optional Astra DB credentials for persistence.
- Optional Hugging Face API key for image generation.
- Optional Cloudinary credentials for hosted generated images.

## Environment Variables

### Frontend

Create a frontend environment file such as `.env.local` in the project root:

```env
VITE_API_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:5173
```

The current `.env.example` contains a Gemini/API Studio oriented template. Do not commit real secrets to source control.

Firebase client configuration is currently loaded from:

```text
firebase-applet-config.json
```

### Backend

Create `backend/.env`:

```env
HOST=0.0.0.0
PORT=8000
DEBUG=true
FRONTEND_URL=http://localhost:5173

GROQ_API_KEY=your_groq_api_key

ASTRA_DB_API_ENDPOINT=your_astra_db_api_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_astra_db_application_token

HUGGING_FACE_API_KEY=your_hugging_face_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Notes:

- `GROQ_API_KEY` is required because several backend services initialize Groq clients at import/startup.
- Astra DB is optional. If it is missing or invalid, `DatabaseService` falls back to in-memory storage.
- Cloudinary is optional for local testing, but generated images will not be permanently hosted without it.
- Hugging Face is required for real image generation through `ImageGenerationService`.

## Local Development

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment files

- Add frontend variables to `.env.local`.
- Add backend variables to `backend/.env`.
- Confirm `firebase-applet-config.json` points to the correct Firebase project.

### 4. Start the backend

From `backend/`:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend docs are available at:

```text
http://localhost:8000/docs
```

### 5. Start the frontend

From the project root:

```bash
npm run dev
```

The Vite app normally runs at:

```text
http://localhost:5173
```

## Available Scripts

```bash
npm run dev      # Start Vite development server
npm run build    # Build frontend into dist/
npm run preview  # Preview production build
npm run lint     # TypeScript no-emit check
```

`package.json` also includes a `clean` script using `rm -rf dist`, which is Unix-style. On Windows PowerShell, use:

```powershell
Remove-Item -Recurse -Force dist
```

## Frontend Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/about` | Product/company overview |
| `/services` | AI services catalogue |
| `/services/code-studio` | Code Studio interface |
| `/workspace` | Main AI workspace |
| `/blog` | Blog list |
| `/blog/:id` | Blog detail |
| `/admin/blog` | Blog administration |
| `/contact` | Contact form |
| `/how-to-use` | Usage guides |
| `/login` | User login |
| `/register` | User registration |
| `/forgot-password` | Password reset |
| `/profile` | User profile |
| `/settings` | User settings |
| `/privacy` | Privacy page |
| `/terms` | Terms page |
| `/admin` | Admin dashboard |

## Backend API

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Root status and docs link |
| `GET` | `/api/health` | Service health summary |

### AI Tools

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/ai/chat` | General AI chat |
| `POST` | `/api/ai/coding` | Coding assistant |
| `POST` | `/api/ai/youtube-summarize` | YouTube transcript summarization |
| `POST` | `/api/ai/website-summarize` | Website content summarization |
| `POST` | `/api/ai/document-summarize` | Uploaded document summarization |
| `POST` | `/api/ai/qa` | Ask questions against an existing chat summary |
| `POST` | `/api/ai/image-generate` | Generate images |
| `POST` | `/api/ai/image-edit` | Edit generated/existing image context |
| `POST` | `/api/ai/translate` | Translate text |

Most AI endpoints require:

```json
{
  "user_id": "firebase-user-id",
  "chat_id": "optional-existing-chat-id"
}
```

Anonymous users are rejected by backend AI endpoints.

### Chat History

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/chat/history` | Load chat history, optionally filtered by tool/chat |
| `POST` | `/api/chat/create` | Create a new chat |
| `POST` | `/api/chat/edit-title` | Rename a chat |
| `POST` | `/api/chat/delete` | Delete a chat owned by the user |

### Contact

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/contact` | Submit contact form data |

### Code Studio API

The router in `backend/services/code_studio_router.py` defines:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/code/create` | Create a code project and generation session |
| `POST` | `/api/code/generate` | Generate the next project file |
| `POST` | `/api/code/test` | Ask the backend service to review/fix one file |
| `POST` | `/api/code/save` | Save assistant context into a session |
| `POST` | `/api/code/load` | Load project files |
| `POST` | `/api/code/run` | Return a browser-side run recipe |

See [Known Integration Notes](#known-integration-notes) before relying on these routes.

## Data Storage

`DatabaseService` stores chats in separate tool collections when Astra DB is configured:

| Tool | Collection |
| --- | --- |
| General chat | `chats` |
| Coding | `coding_chats` |
| YouTube summaries | `youtube_chats` |
| Website summaries | `website_chats` |
| Documents | `document_chats` |
| Images | `image_generations` |
| Translation | `translation_chats` |
| Contact forms | `contacts` |

Chat documents follow a unified shape:

```json
{
  "chat_id": "chat_user_abc123",
  "user_id": "firebase-user-id",
  "title": "New Chat",
  "tool": "chat",
  "created_at": "2026-06-13T10:00:00",
  "updated_at": "2026-06-13T10:05:00",
  "messages": [
    {
      "message_id": "msg_abc123",
      "role": "user",
      "content": "Hello",
      "created_at": "2026-06-13T10:00:00",
      "type": "text"
    }
  ]
}
```

When Astra DB is unavailable, the backend keeps data in memory. In-memory data resets when the backend process restarts.

## Security Model

Security expectations are documented in `security_spec.md` and enforced in multiple places:

- Firebase Auth identifies users in the browser.
- Firestore rules define access to profiles, admin resources, blogs, contact messages, and chats.
- Backend endpoints reject missing or `anonymous` user IDs for private AI operations.
- Chat operations include `user_id` checks so users can only load, rename, or delete their own chats.
- Admin UI visibility is based on either `profile.role === "admin"` or membership in the `admins` collection.

Important: the backend currently trusts the `user_id` sent by the frontend. For production, verify Firebase ID tokens server-side instead of trusting a plain user ID in the request body.

## Code Studio

Code Studio is an experimental AI-assisted project builder exposed at:

```text
/services/code-studio
```

The frontend supports:

- Project prompt and title entry.
- AI-generated project planning.
- Monaco-based file viewing/editing.
- File tabs and project file list.
- Continue generation flow.
- Assistant feedback prompt.
- Run recipe display for browser/WebContainer execution.

The backend implementation includes:

- `CodeStorageService` for Astra-backed project, session, and file records.
- `CodeStudioService` for planning and file generation through Groq.
- `code_studio_router.py` for `/api/code/*` routes.

## Streamlit Utility App

`backend/streamlit_app.py` is a separate Streamlit/LangChain utility for summarization and Q&A over websites, YouTube videos, and uploaded documents.

Run it from `backend/`:

```bash
streamlit run streamlit_app.py
```

This app asks for a Groq API key in its sidebar and builds a temporary FAISS vector store for Q&A.

## Build and Deployment

### Frontend build

```bash
npm run build
```

Output is written to:

```text
dist/
```

### Frontend preview

```bash
npm run preview
```

### Backend production run

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Production recommendations:

- Set `DEBUG=false`.
- Configure a fixed `FRONTEND_URL`.
- Use a production ASGI server/process manager.
- Verify Firebase ID tokens server-side.
- Store secrets in the hosting provider secret manager.
- Configure Astra DB and Cloudinary for durable storage.
- Review CORS before exposing the API publicly.

## Known Integration Notes

- `backend/main.py` imports `build_code_studio_router`, creates `code_storage_service`, and creates `code_studio_service`, but the scan did not find an `app.include_router(...)` call. Add the router mount before relying on frontend Code Studio API calls:

```python
app.include_router(build_code_studio_router(code_storage_service, code_studio_service))
```

- The backend requires `GROQ_API_KEY` during service initialization. If it is missing, the app can fail before serving routes.
- `server.ts` provides an alternate Express/Vite development server with placeholder API routes. The main AI backend is `backend/main.py`.
- There are duplicate or oddly named workspace files in `src/pages/`, including names with leading spaces. Confirm which files are active before deleting or refactoring them.
- Some console strings in backend files appear to contain mojibake from emoji encoding. This does not usually affect behavior, but cleaning them would improve logs.
- The frontend `npm run lint` script runs TypeScript checking through `tsc --noEmit`; it is not an ESLint run despite the script name.

## Troubleshooting

### Backend fails on startup

Check `backend/.env` and confirm:

- `GROQ_API_KEY` is present.
- Dependencies from `backend/requirements.txt` are installed in the active Python environment.
- You are running the command from `backend/` or using the correct module path.

### Frontend cannot reach the backend

Check:

- Backend is running on `http://localhost:8000`.
- `VITE_API_URL=http://localhost:8000` is set in `.env.local`.
- `FRONTEND_URL=http://localhost:5173` is set in `backend/.env`.
- Browser console does not show CORS errors.

### Chat history disappears after restart

Astra DB is not configured or not connected. Add:

```env
ASTRA_DB_API_ENDPOINT=...
ASTRA_DB_APPLICATION_TOKEN=...
```

Then restart the backend.

### Image generation does not produce real hosted images

Check:

- `HUGGING_FACE_API_KEY` is configured.
- Cloudinary variables are configured if you want hosted URLs.
- Backend logs for Hugging Face or Cloudinary upload errors.

### YouTube summaries fail

Some videos do not expose transcripts or may block automated transcript retrieval. Try another video, provide transcript content manually, or use the follow-up chat/QA flow with available context.

## License

The source headers include Apache-2.0 SPDX metadata in parts of the frontend. Confirm the intended repository-wide license before publishing.
