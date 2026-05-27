# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Python Backend & Package
# ==========================================
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (e.g. build-essential, git)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy python backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy scraper code and backend source code
COPY ImdbDataExtraction/ ./ImdbDataExtraction/
COPY backend/ ./backend/

# Copy built frontend assets into backend/static directory
COPY --from=frontend-builder /app/dist ./backend/static

# Expose server port
EXPOSE 8000

# Set environment configurations
ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONPATH=/app

# Start the uvicorn server serving both API and Frontend
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
