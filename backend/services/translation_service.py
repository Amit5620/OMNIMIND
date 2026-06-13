"""
Translation Service
Uses Groq for high-quality translations between languages
"""

import os
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from pathlib import Path


# Load environment from backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


from groq import AsyncGroq


class TranslationService:

    """Service for translating text between languages"""
    
    # Language codes mapping
    LANGUAGES = {
        "en": "English",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "ru": "Russian",
        "zh": "Chinese",
        "ja": "Japanese",
        "ko": "Korean",
        "ar": "Arabic",
        "hi": "Hindi",
        "bn": "Bengali",
        "ur": "Urdu",
        "fa": "Persian",
        "tr": "Turkish",
        "nl": "Dutch",
        "sv": "Swedish",
        "da": "Danish",
        "no": "Norwegian",
        "fi": "Finnish",
        "pl": "Polish",
        "ro": "Romanian",
        "cs": "Czech",
        "el": "Greek",
        "he": "Hebrew",
        "vi": "Vietnamese",
        "th": "Thai",
        "id": "Indonesian",
        "ms": "Malay",
        "hu": "Hungarian",
        "sr": "Serbian",
        "hr": "Croatian",
        "bg": "Bulgarian",
        "sk": "Slovak",
        "sl": "Slovenian",
        "sw": "Swahili",
        "tl": "Filipino",
        "ca": "Catalan",
        "uk": "Ukrainian"
    }
    
    def __init__(self):
        self.client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        
        # System prompt for translation
        self.system_prompt = """You are a professional translator. 
Your task is to accurately translate text from one language to another while:
1. Preserving the original meaning and tone
2. Maintaining cultural context where appropriate
3. Using natural, fluent language in the target language
4. Not adding or removing content beyond what's necessary for accurate translation
5. Keeping proper names, technical terms, and titles in their original form when appropriate"""
    
    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Translate text between languages
        
        Args:
            text: Text to translate
            source_language: Source language code (or "auto" for detection)
            target_language: Target language code
            user_id: User ID
            
        Returns:
            Dictionary with translated text and detected language
        """
        # Validate target language
        if target_language not in self.LANGUAGES:
            raise ValueError(f"Unsupported target language: {target_language}")
        
        # Build the translation prompt
        if source_language == "auto":
            prompt = f"""Translate the following text to {self.LANGUAGES.get(target_language, target_language)}:

{text}

Provide only the translation, without any explanations or notes."""
        else:
            # Validate source language
            if source_language not in self.LANGUAGES:
                raise ValueError(f"Unsupported source language: {source_language}")
            
            prompt = f"""Translate the following text from {self.LANGUAGES.get(source_language, source_language)} to {self.LANGUAGES.get(target_language, target_language)}:

{text}

Provide only the translation, without any explanations or notes."""
        
        try:
            # Make translation request to Groq
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=4096,
                top_p=0.9,
                stream=False
            )
            
            translated_text = response.choices[0].message.content
            
            # Detect language if source was auto
            detected = None
            if source_language == "auto":
                detected = await self._detect_language(text)
            
            return {
                "translated_text": translated_text,
                "detected_language": detected or source_language
            }
            
        except Exception as e:
            print(f"Translation error: {e}")
            raise Exception(f"Failed to translate: {str(e)}")
    
    async def _detect_language(self, text: str) -> str:
        """Detect the language of the given text"""
        try:
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a language detection assistant. Respond with only the 2-letter ISO 639-1 language code."},
                    {"role": "user", "content": f"What language is this text? Just give me the language code: {text[:200]}"}
                ],
                temperature=0.1,
                max_tokens=10
            )
            
            detected = response.choices[0].message.content.strip().lower()
            
            # Map to our supported languages
            for code, name in self.LANGUAGES.items():
                if detected.startswith(code):
                    return code
            
            return detected[:2] if detected else "en"
            
        except Exception as e:
            print(f"Language detection error: {e}")
            return "en"
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return self.LANGUAGES.copy()
