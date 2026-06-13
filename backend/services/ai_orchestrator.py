"""OmniMind AI Orchestrator

Shared Groq model routing + chunk/map-reduce utilities.

NOTE:
- Kept intentionally tool-agnostic to support future multimodal
  summarization and export workflows.
- Streaming is implemented as a *compatible shape* for later UI upgrades.
  Current tool endpoints return full text to preserve API contracts.
"""

from __future__ import annotations

import asyncio
import hashlib
import os
import random
import re
import time
from dataclasses import dataclass
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

from groq import AsyncGroq
from dotenv import load_dotenv
from pathlib import Path


env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


MODEL_REASON_SUMMARY = "llama-3.3-70b-versatile"
# NOTE: llama3-8b-8192 has been decommissioned on Groq.
# Keep FAST routing but point it to a supported model.
MODEL_FAST = "llama-3.1-8b-instant"

MODEL_TRANSLATE = "mixtral-8x7b-32768"


@dataclass
class GroqGenerationResult:
    text: str
    raw: Optional[Dict[str, Any]] = None


class AiOrchestrator:
    """Centralized orchestration for Groq-powered tools."""

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY not configured in .env file")

        self.client = AsyncGroq(api_key=api_key)

        # Lightweight prompt guardrails
        self._default_temperature_reason = 0.5
        self._default_temperature_fast = 0.2

    # =====================
    # Model routing
    # =====================

    def model_for(self, task: str) -> str:
        task = (task or "").lower()
        if task in {"translate", "translation"}:
            return MODEL_TRANSLATE
        if task in {"reason", "summarize", "summarization"}:
            return MODEL_REASON_SUMMARY
        if task in {"fast", "chunk", "map", "reduce", "light"}:
            return MODEL_FAST
        # default
        return MODEL_REASON_SUMMARY

    # =====================
    # Utilities
    # =====================

    def cache_key(self, *, task: str, model: str, payload: str) -> str:
        h = hashlib.sha256()
        h.update(task.encode("utf-8"))
        h.update(b"::")
        h.update(model.encode("utf-8"))
        h.update(b"::")
        h.update(payload.encode("utf-8"))
        return h.hexdigest()

    def normalize_whitespace(self, text: str) -> str:
        text = re.sub(r"[\t\r]+", " ", text or "")
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def chunk_text(self, text: str, *, max_chars: int = 12000, overlap: int = 800) -> List[str]:
        """Chunk by paragraphs where possible."""
        text = self.normalize_whitespace(text)
        if not text:
            return []

        # Split into paragraph-like blocks
        parts = re.split(r"\n\s*\n", text)
        chunks: List[str] = []
        buf: List[str] = []
        buf_len = 0

        def flush():
            nonlocal buf, buf_len
            if not buf:
                return
            chunk = "\n\n".join(buf).strip()
            if chunk:
                chunks.append(chunk)
            buf = []
            buf_len = 0

        for p in parts:
            p = p.strip()
            if not p:
                continue
            if buf_len + len(p) + 2 > max_chars and buf:
                flush()
                # overlap: keep last overlap chars from previous chunk
                if chunks and overlap > 0:
                    tail = chunks[-1][-overlap:]
                    buf = [tail]
                    buf_len = len(tail)

            buf.append(p)
            buf_len += len(p) + 2

        flush()
        # Safety: hard cut if any chunk is still too large
        out: List[str] = []
        for c in chunks:
            if len(c) <= max_chars:
                out.append(c)
            else:
                for i in range(0, len(c), max_chars):
                    out.append(c[i : i + max_chars])
        return out

    def extract_markdown_sections(self, markdown: str) -> Dict[str, str]:
        """Best-effort extraction of markdown headings into sections.

        This is used on backend to instruct the model, but UI can still
        render markdown directly.
        """
        markdown = markdown or ""
        sections: Dict[str, str] = {}
        current = None
        buf: List[str] = []
        for line in markdown.splitlines():
            m = re.match(r"^#{1,4}\s+(.+?)\s*$", line)
            if m:
                if current:
                    sections[current] = "\n".join(buf).strip()
                current = m.group(1).strip().lower()
                buf = []
            else:
                if current:
                    buf.append(line)
        if current:
            sections[current] = "\n".join(buf).strip()
        return sections

    # =====================
    # Robust Groq calls
    # =====================

    async def _call_groq_chat(
        self,
        *,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        top_p: float,
        stream: bool,
        request_timeout_s: int = 60,
        max_retries: int = 3,
    ) -> GroqGenerationResult:
        attempt = 0
        last_err: Optional[Exception] = None
        while attempt < max_retries:
            attempt += 1
            try:
                # NOTE: groq python client supports stream; we keep stream=False for now
                # but implement as a flag.
                resp = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        top_p=top_p,
                        stream=stream,
                    ),
                    timeout=request_timeout_s,
                )

                if stream:
                    # If streaming, resp is an iterator; consume into full text.
                    text_parts: List[str] = []
                    async for chunk in resp:  # type: ignore[union-attr]
                        delta = getattr(chunk, "choices", None)
                        if not delta:
                            continue
                        choice0 = chunk.choices[0]
                        if getattr(choice0, "delta", None):
                            tok = choice0.delta.content
                            if tok:
                                text_parts.append(tok)
                    return GroqGenerationResult(text="".join(text_parts), raw=None)

                return GroqGenerationResult(text=resp.choices[0].message.content or "", raw=resp.model_dump() if hasattr(resp, "model_dump") else None)

            except Exception as e:
                last_err = e
                # crude rate-limit handling: jitter + retry
                await asyncio.sleep((2 ** (attempt - 1)) + random.random())

        raise last_err or RuntimeError("Groq call failed")

    # =====================
    # Map-Reduce summarization
    # =====================

    async def map_reduce_summarize(
        self,
        *,
        content: str,
        map_prompt: str,
        reduce_prompt: str,
        map_model: str,
        reduce_model: str,
        map_max_tokens: int = 900,
        reduce_max_tokens: int = 1400,
        temperature_map: float = 0.2,
        temperature_reduce: float = 0.5,
        chunk_max_chars: int = 12000,
    ) -> str:
        chunks = self.chunk_text(content, max_chars=chunk_max_chars)
        if not chunks:
            return ""

        # Map
        mapped: List[str] = []
        for idx, ch in enumerate(chunks):
            msgs = [
                {"role": "system", "content": map_prompt},
                {"role": "user", "content": f"CHUNK {idx+1}/{len(chunks)}\n\n{ch}"},
            ]
            res = await self._call_groq_chat(
                model=map_model,
                messages=msgs,
                temperature=temperature_map,
                max_tokens=map_max_tokens,
                top_p=0.9,
                stream=False,
                request_timeout_s=180,
                max_retries=4,
            )
            mapped.append(res.text.strip())

        # Reduce
        reduce_user = "\n\n---\n\n".join(mapped)
        msgs = [
            {"role": "system", "content": reduce_prompt},
            {"role": "user", "content": f"MAPPED CHUNK SUMMARIES:\n{reduce_user}"},
        ]
        res = await self._call_groq_chat(
            model=reduce_model,
            messages=msgs,
            temperature=temperature_reduce,
            max_tokens=reduce_max_tokens,
            top_p=0.9,
            stream=False,
            request_timeout_s=240,
            max_retries=4,
        )
        return res.text.strip()

