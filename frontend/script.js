const imageUpload = document.getElementById('imageUpload');
const extractButton = document.getElementById('extractButton');
const resultsDiv = document.getElementById('results');
const colorPaletteDiv = document.getElementById('colorPalette');
const fontStyleP = document.getElementById('fontStyle');
const applyButton = document.getElementById('applyToExpress');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const errorMessageP = errorDiv.querySelector('.error-message');

const BACKEND_URL = 'http://127.0.0.1:5000/extract-styles'; // IMPORTANT: Use Dev1's backend address

imageUpload.addEventListener('change', () => {
    if (imageUpload.files.length > 0) {
        extractButton.disabled = false;
    } else {
        extractButton.disabled = true;
    }
});

extractButton.addEventListener('click', async () => {
    const file = imageUpload.files[0];
    if (!file) {
        alert('Please select an image first.');
        return;
    }

    loadingDiv.classList.remove('hidden');
    resultsDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    errorMessageP.textContent = '';
    extractButton.disabled = true; // Disable button during extraction

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file); // Read file as base64

        reader.onloadend = async () => {
            const base64Image = reader.result.split(',')[1]; // Get only the base64 part

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
            displayResults(data);
        };
    } catch (error) {
        console.error('Error extracting styles:', error);
        errorMessageP.textContent = `Error: ${error.message}. Make sure the backend server is running and accessible.`;
        errorDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
        extractButton.disabled = false; // Re-enable button
    }
});

function displayResults(data) {
    colorPaletteDiv.innerHTML = ''; // Clear previous colors

    if (data.colors && data.colors.length > 0) {
        data.colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = color; // Show hex on hover
            swatch.textContent = color.substring(1).toUpperCase(); // Display hex without #
            colorPaletteDiv.appendChild(swatch);
        });
    } else {
        colorPaletteDiv.innerHTML = '<p>No colors extracted.</p>';
    }

    // Placeholder for font style
    fontStyleP.textContent = data.font_style || 'N/A (coming soon!)'; // Will be updated on Day 2

    resultsDiv.classList.remove('hidden');
}

// Placeholder for applying to Express - will be manual for now
applyButton.addEventListener('click', () => {
    alert('Please manually copy the hex codes and font style suggestions into Adobe Express.');
});