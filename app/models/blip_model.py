# app/models/blip_model.py
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor

class FashionBLIPModel:
    """Fashion description generator using BLIP with optimized loading and parallel processing"""
    
    # Class variables for singleton pattern
    _instance = None
    _is_initialized = False
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(FashionBLIPModel, cls).__new__(cls)
        return cls._instance
    
    def __init__(self, model_name="Salesforce/blip-image-captioning-large"):
        """Initialize the BLIP model only once"""
        if not FashionBLIPModel._is_initialized:
            print("Initializing BLIP model...")
            try:
                self.processor = BlipProcessor.from_pretrained(model_name)
                self.model = BlipForConditionalGeneration.from_pretrained(
                    model_name,
                    low_cpu_mem_usage=True  # Reduce memory usage during loading
                )
                
                # Move model to GPU if available
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                self.model.to(self.device)
                print(f"BLIP model loaded successfully on {self.device}")
                
                FashionBLIPModel._is_initialized = True
            except Exception as e:
                print(f"Error initializing BLIP model: {e}")
                self.processor = None
                self.model = None
                self.device = "cpu"
    
    def generate_description(self, image_path):
        """Generate a basic description of the outfit"""
        if self.processor is None or self.model is None:
            return "A person wearing clothes. (Model failed to load)"
        
        image = Image.open(image_path).convert('RGB')
        
        # Use a fashion-specific prompt
        prompt = "a photo of a person wearing"
        
        # Generate caption with BLIP
        inputs = self.processor(image, prompt, return_tensors="pt").to(self.device)
        with torch.no_grad():  # Disable gradient calculation for inference
            output = self.model.generate(**inputs, max_new_tokens=100)
        description = self.processor.decode(output[0], skip_special_tokens=True)
        
        return description
    
    async def get_comprehensive_analysis(self, image_path):
        """Generate detailed fashion analysis using multiple prompts in parallel"""
        if self.processor is None or self.model is None:
            return "A person wearing clothes. (Model failed to load)"
        
        image = Image.open(image_path).convert('RGB')
        
        # Define prompts for different aspects of the outfit
        prompts = [
            "a photo of a person wearing",  # General outfit
            "the colors in this outfit are",  # Color information
            "the style of this outfit can be described as",  # Style information
            "the accessories in this outfit include",  # Accessories
            "the fit and silhouette of these clothes are"  # Fit details
        ]
        
        # Create thread pool executor for parallel processing
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            # Run caption generation tasks in parallel
            tasks = [
                loop.run_in_executor(
                    executor,
                    self._generate_single_caption,
                    image, prompt
                )
                for prompt in prompts
            ]
            descriptions = await asyncio.gather(*tasks)
        
        # Combine all descriptions
        full_analysis = " ".join(descriptions)
        return full_analysis
    
    def _generate_single_caption(self, image, prompt):
        """Helper method to generate a single caption"""
        try:
            inputs = self.processor(image, prompt, return_tensors="pt").to(self.device)
            with torch.no_grad():  # Disable gradient calculation for inference
                output = self.model.generate(**inputs, max_new_tokens=30)
            caption = self.processor.decode(output[0], skip_special_tokens=True)
            return caption
        except Exception as e:
            print(f"Error generating caption for prompt '{prompt}': {e}")
            return f"{prompt} (error occurred)"