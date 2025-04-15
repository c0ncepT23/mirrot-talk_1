FROM python:3.9

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the BLIP model to cache it in the container
RUN python -c "from transformers import BlipProcessor, BlipForConditionalGeneration; \
    processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-large'); \
    model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-large')"

# Copy application code
COPY . .

# Create directories
RUN mkdir -p uploads static templates

# Set environment variables for better performance
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_OFFLINE=1
ENV TORCH_HOME=/app/.torch

# Expose port
EXPOSE 8080

# Run the application with increased timeout
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--timeout-keep-alive", "120"]