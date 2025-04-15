# app/api/routes.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
from datetime import datetime

from app.core.fashion_advisor import FashionAdvisor

router = APIRouter()
fashion_advisor = FashionAdvisor()

@router.post("/analyze")
async def analyze_outfit(
    image: UploadFile = File(...),
):
    """Analyze an outfit image and return a description"""
    # Save uploaded image
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{timestamp}-{unique_id}.jpg"
    
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    image_path = os.path.join("uploads", filename)
    
    # Save the file
    with open(image_path, "wb") as f:
        f.write(await image.read())
    
    # Analyze the image
    description = await fashion_advisor.analyze_image(image_path)
    
    return {
        "success": True,
        "image_path": image_path,
        "description": description
    }

@router.post("/advice")
async def get_fashion_advice(
    image_path: str = Form(...),
    description: str = Form(...),
    user_input: str = Form("What do you think of this outfit?"),
    style_goals: str = Form(""),
):
    """Get fashion advice based on outfit description and user input"""
    # Validate image path
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        # Get fashion advice
        advice = await fashion_advisor.get_fashion_advice(
            outfit_description=description,
            user_input=user_input,
            style_goals=style_goals
        )
        
        return {
            "success": True,
            "advice": advice
        }
    except Exception as e:
        # Add better error handling
        print(f"Error getting fashion advice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting fashion advice: {str(e)}")