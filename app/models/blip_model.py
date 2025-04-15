# app/models/blip_model.py
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch
import os

class FashionBLIPModel:
    """Fashion description generator using BLIP"""
    
    def __init__(self, model_name="Salesforce/blip-image-captioning-large"):
        """Initialize the BLIP model"""
        self.processor = BlipProcessor.from_pretrained(model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(model_name)
        
        # Move model to GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        print(f"BLIP model loaded on {self.device}")
    
    def generate_description(self, image_path):
        """Generate a basic description of the outfit"""
        image = Image.open(image_path).convert('RGB')
        
        # Use a fashion-specific prompt
        prompt = "a photo of a person wearing"
        
        # Generate caption with BLIP
        inputs = self.processor(image, prompt, return_tensors="pt").to(self.device)
        output = self.model.generate(**inputs, max_new_tokens=100)
        description = self.processor.decode(output[0], skip_special_tokens=True)
        
        return description
    
    def get_comprehensive_analysis(self, image_path):
        """Generate detailed fashion analysis using multiple prompts"""
        image = Image.open(image_path).convert('RGB')
        
        # Use multiple prompts to get different aspects of the outfit
        prompts = [
            "a photo of a person wearing",  # General outfit
            "the colors in this outfit are",  # Color information
            "the style of this outfit can be described as",  # Style information
            "the accessories in this outfit include",  # Accessories
            "the fit and silhouette of these clothes are"  # Fit details
        ]
        
        descriptions = []
        for prompt in prompts:
            inputs = self.processor(image, prompt, return_tensors="pt").to(self.device)
            output = self.model.generate(**inputs, max_new_tokens=30)
            caption = self.processor.decode(output[0], skip_special_tokens=True)
            descriptions.append(caption)
        
        # Combine all descriptions
        full_analysis = " ".join(descriptions)
        return full_analysis