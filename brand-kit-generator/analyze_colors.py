#!/usr/bin/env python3
import sys
import json
import cv2
import numpy as np
from typing import Dict, List, Union

def extract_dominant_colors(
    image_path: str,
    num_colors: int = 3,
    resize_dim: int = 300,
    max_iterations: int = 10
) -> Dict[str, Union[List[str], str]]:
    """
    Extracts dominant colors from an image using k-means clustering.
    
    Args:
        image_path: Path to the image file
        num_colors: Number of dominant colors to extract (1-10)
        resize_dim: Size to resize image for faster processing
        max_iterations: Maximum iterations for k-means algorithm
        
    Returns:
        Dictionary containing either:
        - 'colors': List of HEX color strings sorted by dominance
        - 'error': Error message string
    """
    # Validate inputs
    if not 1 <= num_colors <= 10:
        return {"error": "num_colors must be between 1 and 10"}
    
    try:
        # Read and validate image
        img = cv2.imread(image_path)
        if img is None:
            return {"error": f"Could not read image at {image_path}"}
        
        # Preprocess image
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (resize_dim, resize_dim))
        
        # Prepare for k-means
        pixels = img.reshape((-1, 3)).astype(np.float32)
        
        # K-means parameters
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 
                   max_iterations, 1.0)
        
        # Perform k-means clustering
        _, labels, centers = cv2.kmeans(
            pixels, num_colors, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
        )
        
        # Calculate color dominance (count of pixels per cluster)
        counts = np.bincount(labels.flatten())
        total_pixels = sum(counts)
        percentages = [round(count/total_pixels*100, 2) for count in counts]
        
        # Sort colors by dominance
        sorted_indices = np.argsort(counts)[::-1]
        sorted_centers = centers[sorted_indices]
        sorted_percentages = [percentages[i] for i in sorted_indices]
        
        # Convert to HEX and prepare results
        hex_colors = [
            f"#{int(r):02x}{int(g):02x}{int(b):02x}"
            for r, g, b in sorted_centers
        ]
        
        return {
            "colors": hex_colors,
            "percentages": sorted_percentages,
            "rgb_values": [list(map(int, color)) for color in sorted_centers]
        }
        
    except Exception as e:
        return {"error": f"Image processing error: {str(e)}"}

def main():
    """Handle command line execution"""
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "Usage: script.py <image_path> [num_colors]"}))
            sys.exit(1)
            
        num_colors = int(sys.argv[2]) if len(sys.argv) > 2 else 3
        result = extract_dominant_colors(sys.argv[1], num_colors=num_colors)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Execution error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()