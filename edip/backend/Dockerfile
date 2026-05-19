FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OCR and native ML packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create upload and chromadb directories
RUN mkdir -p /app/uploads /app/chroma_db

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 8000
