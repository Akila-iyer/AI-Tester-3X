"""AI Provider Handshake -- Verify connectivity to OpenAI and/or Ollama."""

import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

load_dotenv()


def check_openai() -> dict:
    """Test OpenAI API connectivity with a minimal chat completion."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return {"provider": "openai", "status": "SKIP", "reason": "OPENAI_API_KEY not set in .env"}

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key, timeout=15)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Reply with exactly one word: OK"}],
            max_tokens=10,
        )
        reply = resp.choices[0].message.content.strip()
        return {
            "provider": "openai",
            "status": "OK",
            "model": "gpt-4o-mini",
            "response": reply,
            "usage": {
                "prompt_tokens": resp.usage.prompt_tokens if resp.usage else 0,
                "completion_tokens": resp.usage.completion_tokens if resp.usage else 0,
            },
        }
    except Exception as e:
        return {"provider": "openai", "status": "FAIL", "error": str(e)}


def check_ollama() -> dict:
    """Test Ollama local LLM connectivity."""
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip()
    model = os.getenv("OLLAMA_MODEL", "llama3.2").strip()

    if not base_url:
        return {"provider": "ollama", "status": "SKIP", "reason": "OLLAMA_BASE_URL not set"}

    try:
        import requests

        url = f"{base_url}/api/chat"
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "Reply with exactly one word: OK"}],
            "stream": False,
        }
        resp = requests.post(url, json=payload, timeout=30)
        if resp.status_code == 200:
            reply = resp.json().get("message", {}).get("content", "").strip()
            return {
                "provider": "ollama",
                "status": "OK",
                "model": model,
                "response": reply,
            }
        elif resp.status_code == 404:
            return {
                "provider": "ollama",
                "status": "SKIP",
                "reason": f"Model '{model}' not found on Ollama server at {base_url}. Run: ollama pull {model}",
            }
        else:
            return {
                "provider": "ollama",
                "status": "FAIL",
                "error": f"HTTP {resp.status_code}: {resp.text[:200]}",
            }
    except requests.ConnectionError:
        return {
            "provider": "ollama",
            "status": "SKIP",
            "reason": f"Ollama not reachable at {base_url}",
        }
    except Exception as e:
        return {"provider": "ollama", "status": "FAIL", "error": str(e)}


def main():
    print("[AI Handshake] testing connections...")
    results = [check_openai(), check_ollama()]
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
