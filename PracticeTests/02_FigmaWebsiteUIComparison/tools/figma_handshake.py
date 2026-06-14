"""Figma API Handshake -- Verify connectivity to Figma REST API."""

import os
import sys
import json
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

load_dotenv()


def check_figma_api(token: str) -> dict:
    """Test Figma API connectivity via GET /v1/me endpoint."""
    url = "https://api.figma.com/v1/me"
    headers = {"X-Figma-Token": token}

    resp = requests.get(url, headers=headers, timeout=15)

    if resp.status_code == 200:
        data = resp.json()
        return {
            "status": "OK",
            "email": data.get("email", "unknown"),
            "user_id": data.get("id", "unknown"),
        }
    elif resp.status_code == 403:
        return {"status": "FAIL", "error": "403 Forbidden - token is invalid or expired"}
    elif resp.status_code == 429:
        return {"status": "FAIL", "error": "429 Rate Limited - slow down"}
    else:
        return {"status": "FAIL", "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}


def main():
    token = os.getenv("FIGMA_TOKEN", "").strip()

    if not token:
        print(json.dumps({"provider": "figma", "status": "SKIP", "reason": "FIGMA_TOKEN not set in .env"}, indent=2))
        return

    print("[Figma Handshake] testing token...")
    result = check_figma_api(token)
    result["provider"] = "figma"
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
