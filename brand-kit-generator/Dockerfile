# Use official Python base image for OpenCV compatibility
FROM python:3.11-slim as python-base

# Install OpenCV system dependencies
RUN apt-get update && apt-get install -y \
    libopencv-dev \
    python3-opencv \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir opencv-python-headless numpy

# Node.js setup
FROM node:20-alpine as node-base
WORKDIR /home/user/adobe-express-ai-assistant/brand-kit-generator

# Copy Python dependencies from python-base
COPY --from=python-base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-base /usr/lib/python3/dist-packages/cv2 /usr/lib/python3/dist-packages/cv2

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Verify OpenCV is accessible
RUN python3 -c "import cv2; print(f'OpenCV version: {cv2.__version__}')"

RUN ls -R /home/user/adobe-express-ai-assistant
EXPOSE 3000

COPY brand-kit-generator/server.js /home/user/adobe-express-ai-assistant/server.js
RUN chmod +x /home/user/adobe-express-ai-assistant/brand-kit-generator/start.sh
CMD ["/home/user/adobe-express-ai-assistant/brand-kit-generator/start.sh"]