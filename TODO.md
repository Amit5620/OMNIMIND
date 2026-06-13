# TODO

## Task: Markdown rendering + message source tracking + backend response type

- [ ] Create `src/components/MarkdownMessage.tsx`
- [ ] Update `src/pages/Workspace.tsx`
  - [ ] Add `MarkdownMessage` import
  - [ ] Extend `Message` type with `messageSource`
  - [ ] In `handleFileUpload`, set `messageSource: 'summary'` for document summaries
  - [ ] In `handleSend`, compute `messageSource` before creating assistant message
  - [ ] Set `assistantMsg.messageSource`
  - [ ] Replace legacy message rendering with conditional `MarkdownMessage` usage for summary markdown
- [ ] Update `backend/services/summarization_service.py`
  - [ ] Add `message_type: 'summary'` to YouTube return
  - [ ] Add `message_type: 'summary'` to Website return
  - [ ] Add `message_type: 'summary'` to Document return
- [ ] Update `backend/services/prompt_templates.py`
  - [ ] Replace `YOUTUBE_REDUCE_PROMPT`
  - [ ] Replace `WEBSITE_REDUCE_PROMPT`
  - [ ] Replace `DOCUMENT_REDUCE_PROMPT`
- [ ] Run typecheck/lint/build if available (optional)

