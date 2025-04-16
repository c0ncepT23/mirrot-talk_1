FROM python:3.9

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create cache directory and set permissions
RUN mkdir -p /root/.cache/huggingface

# Pre-download and cache the BLIP model explicitly
RUN python -c "from transformers import BlipProcessor, BlipForConditionalGeneration; processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-large'); model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-large'); print('Model downloaded successfully!')"

# Copy application code
COPY . .

# Create directories
RUN mkdir -p uploads static templates

# Make sure model loading uses cache
ENV TRANSFORMERS_OFFLINE=1
ENV HF_HUB_OFFLINE=1

# Expose port
EXPOSE 8080

# Run with optimized settings
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]