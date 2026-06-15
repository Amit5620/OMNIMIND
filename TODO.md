- [x] Implement YouTube oEmbed fallback in backend/services/summarization_service.py

- [x] Reorder YouTube fallback chain to: transcript -> yt-dlp subtitles -> yt-dlp metadata -> oEmbed
- [x] Add _youtube_oembed_fetch helper and use its output to generate a minimal summarization input when transcript/yt-dlp fail
- [x] Add explicit network timeout for oEmbed fetch
- [x] Run a quick local smoke check (call youtube summarization endpoint) and verify non-error behavior when transcript extraction is blocked



