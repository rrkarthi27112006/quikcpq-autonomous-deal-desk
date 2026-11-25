"""
Lightweight .env loader and configuration status helper for QuikCPQ.
"""
import os
from typing import Dict

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

def load_env_file():
    """Loads key=value pairs from backend/.env into os.environ if not already set."""
    if not os.path.exists(ENV_PATH):
        return
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and value and not os.environ.get(key):
                os.environ[key] = value

def get_config_status() -> Dict[str, object]:
    """Returns integration readiness without exposing secret values."""
    load_env_file()
    gemini_ready = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    imap_ready = bool(
        os.environ.get("IMAP_HOST", "").strip()
        and os.environ.get("IMAP_USER", "").strip()
        and os.environ.get("IMAP_PASSWORD", "").strip()
    )
    smtp_ready = bool(
        os.environ.get("SMTP_HOST", "").strip()
        and os.environ.get("SMTP_USER", "").strip()
        and os.environ.get("SMTP_PASSWORD", "").strip()
    )
    return {
        "gemini_configured": gemini_ready,
        "imap_configured": imap_ready,
        "imap_user": os.environ.get("IMAP_USER", "") if imap_ready else None,
        "smtp_configured": smtp_ready,
        "smtp_user": os.environ.get("SMTP_USER", "") if smtp_ready else None,
    }
