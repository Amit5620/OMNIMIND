# TODO: Deploy backend to Render (after frontend deployed)

## Prereqs
- [ ] Have a Render account
- [ ] Repo pushed to GitHub (Render can auto-build)
- [ ] Have `GROQ_API_KEY`
- [ ] Decide whether to use Astra DB (optional)

## Steps
1. [ ] Create Render “Web Service” for backend
2. [ ] Set Render settings:
   - Root dir: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port 8000`
3. [ ] Configure Environment/Secrets in Render:
   - `GROQ_API_KEY`
   - `FRONTEND_URL` = your deployed Vercel frontend origin (e.g. `https://omnimindv1.vercel.app`)
   - `HOST=0.0.0.0` and `PORT=8000`
   - Optional Astra: `ASTRA_DB_API_ENDPOINT`, `ASTRA_DB_APPLICATION_TOKEN`
4. [ ] Deploy
5. [ ] Verify endpoints:
   - [ ] `https://YOUR_BACKEND_DOMAIN/api/health`
   - [ ] Load frontend and ensure no CORS errors
6. [ ] If Code Studio 404 occurs:
   - [ ] Ensure `app.include_router(build_code_studio_router(...))` is actually mounted in `backend/main.py`

