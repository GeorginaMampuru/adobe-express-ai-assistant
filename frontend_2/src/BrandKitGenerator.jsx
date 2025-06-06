import React, { useState } from 'react';
import './BrandKitGenerator.css'; 

function BrandKitGenerator() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null); 
   
    const BACKEND_URL = 'http://127.0.0.1:5000/extract-styles';

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setResults(null); 
        setError(null);    
    };

    const handleExtractStyles = async () => {
        if (!selectedFile) {
            alert('Please select an image first.');
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);

            reader.onloadend = async () => {
                const base64Image = reader.result.split(',')[1]; 

                const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ image: base64Image })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                setResults(data);
            };
        } catch (err) {
            console.error('Error extracting styles:', err);
            setError(`Error: ${err.message}. Make sure the backend server is running and accessible.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>ZolDycks Instant Brand Kit Generator</h1>
            <p>lets Upload an image an seeeee</p>

            <input type="file" id="imageUpload" accept="image/*" onChange={handleFileChange} />
            <button
                onClick={handleExtractStyles}
                disabled={!selectedFile || loading}
            >
                {loading ? 'Extracting...' : 'Extract Styles'}
            </button>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {results && (
                <div className="results">
                    <h2>Extracted Colors:</h2>
                    <div className="color-palette">
                        {results.colors && results.colors.length > 0 ? (
                            results.colors.map((color, index) => (
                                <div
                                    key={index}
                                    className="color-swatch"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                >
                                    {color.substring(1).toUpperCase()}
                                </div>
                            ))
                        ) : (
                            <p>No colors extracted.</p>
                        )}
                    </div>
                    <h2>Extracted Font Style:</h2>
                    <p>{results.font_style || 'N/A (coming soon!)'}</p>
                    <button className="apply-button" onClick={() => alert('Please manually copy the hex codes and font style suggestions into Adobe Express.')}>
                        Apply to Express (Manual)
                    </button>
                </div>
            )}
        </div>
    );
}

export default BrandKitGenerator;