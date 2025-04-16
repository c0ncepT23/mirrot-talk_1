# app/api/routes.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
from datetime import datetime
import traceback

from app.core.fashion_advisor import FashionAdvisor

router = APIRouter()
fashion_advisor = FashionAdvisor()

@router.post("/analyze")
async def analyze_outfit(
    image: UploadFile = File(...),
):
    """Analyze an outfit image and return a description"""
    try:
        # Save uploaded image
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{timestamp}-{unique_id}.jpg"
        
        # Ensure uploads directory exists
        os.makedirs("uploads", exist_ok=True)
        image_path = os.path.join("uploads", filename)
        
        # Save the file
        with open(image_path, "wb") as f:
            content = await image.read()
            print(f"Read {len(content)} bytes from uploaded file")
            f.write(content)
        
        print(f"File saved to {image_path}, size: {os.path.getsize(image_path)} bytes")
        
        # Analyze the image
        print("Starting image analysis...")
        description = await fashion_advisor.analyze_image(image_path)
        print(f"Analysis complete: {description[:50]}...")
        
        return {
            "success": True,
            "image_path": image_path,
            "description": description
        }
    except Exception as e:
        tb = traceback.format_exc()
        error_msg = f"Error in analyze_outfit: {str(e)}\n{tb}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/advice")
async def get_fashion_advice(
    image_path: str = Form(...),
    description: str = Form(...),
    user_input: str = Form("What do you think of this outfit?"),
    style_goals: str = Form(""),
):
    """Get fashion advice based on outfit description and user input"""
    try:
        # Validate image path
        if not os.path.exists(image_path):
            error_msg = f"Image not found at path: {image_path}"
            print(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        print(f"Getting fashion advice for image: {image_path}")
        print(f"Description: {description[:50]}...")
        print(f"User input: {user_input}")
        print(f"Style goals: {style_goals}")
        
        # Get fashion advice
        advice = await fashion_advisor.get_fashion_advice(
            outfit_description=description,
            user_input=user_input,
            style_goals=style_goals
        )
        
        print(f"Advice generated: {advice[:50]}...")
        
        return {
            "success": True,
            "advice": advice
        }
    except Exception as e:
        tb = traceback.format_exc()
        error_msg = f"Error getting fashion advice: {str(e)}\n{tb}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)