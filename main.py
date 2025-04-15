# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import Request
import uvicorn
import os

from app.api.routes import router as api_router

# Initialize FastAPI app
app = FastAPI(
    title="Fashion Advisor",
    description="A fashion advisor chatbot powered by BLIP and LLM"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Include API routes
app.include_router(api_router, prefix="/api")

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Home route
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Add health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080)