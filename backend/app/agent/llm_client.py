from __future__ import annotations

import json
import os
from typing import Any

import requests


class GeminiClient:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    def generate_agent_report(self, system_prompt: str, user_payload: dict, timeout_s: int = 5) -> dict:
        headers = {
            "Content-Type": "application/json; charset=utf-8",
        }
        params = {"key": self.api_key}
        # Compose contents with a system part and a user JSON part
        contents = [
            {"role": "user", "parts": [{"text": system_prompt.strip()}]},
            {"role": "user", "parts": [{"text": json.dumps(user_payload, sort_keys=True)}]},
        ]
        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.0,
                "topK": 1,
                "topP": 0.0,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json",
            },
        }
        resp = requests.post(self.base_url, headers=headers, params=params, data=json.dumps(body), timeout=timeout_s)
        resp.raise_for_status()
        data = resp.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            raise RuntimeError(f"Invalid Gemini response: {e}")
        try:
            return json.loads(text)
        except Exception as e:
            raise RuntimeError(f"Gemini JSON parse error: {e}")


def build_client_from_env() -> GeminiClient | None:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    if not api_key:
        return None
    return GeminiClient(api_key=api_key, model=model)


