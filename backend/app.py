# backend/app.py

import cv2
import numpy as np
from sklearn.cluster import KMeans
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
from PIL import Image
import io
import pytesseract



app = Flask(__name__)
CORS(app) # Enable CORS for all routes, crucial for frontend communication

def extract_dominant_colors(image_data, num_colors=5):
    """
    Extracts dominant colors from a base64 encoded image.
    """
    try:
        # Convert base64 image data to OpenCV format
        nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            # This can happen if base64 data is corrupt or image format is not supported
            print("Error: Could not decode image from base64 data.")
            return []

        # Resize for faster processing (optional, but highly recommended for K-Means)
        # Smaller image means faster clustering. Adjust (width, height) as needed.
        img_resized = cv2.resize(img, (200, 200), interpolation=cv2.INTER_AREA)

        # Reshape the image to be a list of pixels (height * width, 3 channels)
        pixels = img_resized.reshape(-1, 3)

        # Convert to float32 for K-Means
        pixels = np.float32(pixels)

        # Define K-Means criteria (Epsilon for accuracy, Max iterations)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)

        # Apply K-Means clustering
        # KMEANS_PP_CENTERS for better initial cluster centers
        _, labels, centers = cv2.kmeans(pixels, num_colors, None, criteria, 10, cv2.KMEANS_PP_CENTERS)

        # Convert center colors to 8-bit integers (0-255)
        centers = np.uint8(centers)

        # OpenCV reads images as BGR. Convert to RGB for common hex format.
        # Format as hex strings: #RRGGBB
        hex_colors = ['#{:02x}{:02x}{:02x}'.format(c[2], c[1], c[0]) for c in centers]

        return hex_colors

    except Exception as e:
        print(f"Error in extract_dominant_colors: {e}")
        return []

def extract_basic_font_characteristics(image_data):
    """
    Extracts basic font characteristics (e.g., serif/sans-serif, bold/normal)
    from a base64 encoded image using Tesseract.
    This is a simplified approach for hackathon purposes.
    """
    try:
        # Convert base64 image data to PIL Image for Tesseract
        image_bytes = base64.b64decode(image_data)
        img_pil = Image.open(io.BytesIO(image_bytes))

        # Convert to grayscale for better OCR performance
        img_gray = img_pil.convert('L')

        # Use Tesseract to get bounding box data and text
        # output_type=pytesseract.Output.DICT gives more structured data
        data = pytesseract.image_to_data(img_gray, output_type=pytesseract.Output.DICT)

        font_styles = []
        # Iterate through detected text lines/words
        # This part would be expanded to actually "classify" font styles.
        # For the MVP, we'll just indicate if text was found.
        has_text = False
        for i in range(len(data['text'])):
            text = data['text'][i].strip()
            conf = int(data['conf'][i]) if data['conf'][i] else 0 # Confidence can be empty
            if conf > 60 and text: # Only consider high confidence text
                has_text = True
               
                break # Just need to know if text exists for now.

        # Placeholder logic:
        if has_text:
            # This is where you would integrate actual font classification.
            # For hackathon, just return a general idea or placeholder.
            return "Text detected (style needs further analysis)"
        else:
            return "No prominent text detected"

    except pytesseract.TesseractNotFoundError:
        print("Tesseract is not installed or not in your PATH. Please install it.")
        return "Tesseract OCR not found. Font analysis unavailable."
    except Exception as e:
        print(f"Error in extract_basic_font_characteristics: {e}")
        return "Error during font analysis."

@app.route('/extract-styles', methods=['POST'])
def extract_styles():
    """
    API endpoint to receive an image (base64) and return extracted styles.
    """
    if not request.json or 'image' not in request.json:
        return jsonify({'error': 'No image data provided in JSON body'}), 400

    image_base64 = request.json['image']

    colors = extract_dominant_colors(image_base64)
    font_style_suggestion = extract_basic_font_characteristics(image_base64)

    response_data = {
        'colors': colors,
        'font_style': font_style_suggestion
    }
    return jsonify(response_data)

if __name__ == '__main__':
    # When running locally for testing, ensure this is accessible by your frontend.
    # If frontend is on a different machine/device in the same network,
    # you might need to change host='0.0.0.0'
    app.run(debug=True, host='127.0.0.1', port=5000)