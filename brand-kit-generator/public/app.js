// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');

// Store uploaded files
let uploadedFiles = [];

// Handle drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    handleFiles(e.dataTransfer.files);
});

// Handle file input change
fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

// Process uploaded files
function handleFiles(files) {
    uploadedFiles = Array.from(files);
    
    // Clear previous previews
    imagePreview.innerHTML = '';
    
    // Validate at least 3 images
    if (uploadedFiles.length < 3) {
        statusMessage.textContent = 'Please upload at least 3 images';
        statusMessage.style.color = '#d32f2f';
        statusMessage.style.backgroundColor = '#ffebee';
        generateBtn.disabled = true;
        return;
    }
    
    // Display image previews
    uploadedFiles.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
    
    statusMessage.textContent = `${uploadedFiles.length} images ready for processing`;
    statusMessage.style.color = '#388e3c';
    statusMessage.style.backgroundColor = '#e8f5e9';
    generateBtn.disabled = false;
}

// Generate PDF (mock for now - will connect to backend)
generateBtn.addEventListener('click', async () => {
    if (uploadedFiles.length < 3) return;
    
    // Show loading state
    generateBtn.disabled = true;
    loadingIndicator.style.display = 'block';
    statusMessage.textContent = 'Processing your brand images...';
    
    try {
        // In a real implementation, this would call your backend API
        // For now, we'll simulate a delay and then download a mock PDF
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create a mock PDF download
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,...'; // Base64 of a simple PDF
        link.download = 'brand_kit.pdf';
        link.click();
        
        statusMessage.textContent = 'Brand kit generated successfully!';
        statusMessage.style.color = '#388e3c';
        statusMessage.style.backgroundColor = '#e8f5e9';
    } catch (error) {
        statusMessage.textContent = 'Error generating brand kit: ' + error.message;
        statusMessage.style.color = '#d32f2f';
        statusMessage.style.backgroundColor = '#ffebee';
    } finally {
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
    }
});