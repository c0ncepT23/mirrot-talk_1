# config.py
import os
from pathlib import Path

# API Keys
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# GCP/Firebase Settings
GCP_PROJECT_ID = "fashion-app-456914"
GCS_BUCKET_NAME = "fashion-app-uploads"

# Directories (for local development)
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# Ensure directories exist for local development
os.makedirs(UPLOAD_DIR, exist_ok=True)