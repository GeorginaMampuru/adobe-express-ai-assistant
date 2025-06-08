// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');
const fileCount = document.getElementById('fileCount');

// Store uploaded files
let uploadedFiles = [];

// Handle drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
    dropZone.querySelector('.drop-instructions').textContent = 'Drop your files here';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
    dropZone.querySelector('.drop-instructions').textContent = 'Drag & drop your brand images here';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    dropZone.querySelector('.drop-instructions').textContent = 'Drag & drop your brand images here';
    handleFiles(e.dataTransfer.files);
});

// Handle file input change
fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

// Process uploaded files
function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') && 
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    );
    
    uploadedFiles = validFiles.slice(0, 10); // Limit to 10 files
    
    // Clear previous previews
    imagePreview.innerHTML = '';
    
    // Update file count display
    fileCount.textContent = `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} selected`;
    fileCount.style.display = 'block';
    
    // Validate at least 3 images
    if (uploadedFiles.length < 3) {
        showStatus('Please upload at least 3 images (JPEG, PNG, or WebP)', 'error');
        generateBtn.disabled = true;
        return;
    }
    
    // Display image previews with progress
    let loadedCount = 0;
    uploadedFiles.forEach((file, index) => {
        const reader = new FileReader();
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const progress = document.createElement('div');
        progress.className = 'preview-progress';
        previewItem.appendChild(progress);
        
        const img = document.createElement('img');
        img.alt = `Preview ${index + 1}`;
        previewItem.appendChild(img);
        
        const fileName = document.createElement('span');
        fileName.className = 'preview-filename';
        fileName.textContent = file.name.length > 20 
            ? `${file.name.substring(0, 15)}...${file.name.split('.').pop()}`
            : file.name;
        previewItem.appendChild(fileName);
        
        imagePreview.appendChild(previewItem);
        
        reader.onloadstart = () => {
            progress.style.width = '0%';
        };
        
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                progress.style.width = `${(e.loaded / e.total) * 100}%`;
            }
        };
        
        reader.onload = (e) => {
            img.src = e.target.result;
            progress.style.width = '100%';
            loadedCount++;
            
            if (loadedCount === uploadedFiles.length) {
                showStatus(`${uploadedFiles.length} images ready for processing`, 'success');
                generateBtn.disabled = false;
            }
        };
        
        reader.onerror = () => {
            previewItem.classList.add('error');
            showStatus(`Error loading ${file.name}`, 'error');
        };
        
        reader.readAsDataURL(file);
    });
}

// Generate PDF - Connect to backend
generateBtn.addEventListener('click', async () => {
    if (uploadedFiles.length < 3) return;
    
    // Show loading state
    generateBtn.disabled = true;
    loadingIndicator.style.display = 'flex'; // Changed to flex for better centering
    statusMessage.textContent = 'Analyzing brand elements and generating PDF...';
    
    try {
        const formData = new FormData();
        uploadedFiles.forEach(file => {
            formData.append('images', file);
        });
        
        // Add any additional form data
        formData.append('brandName', document.getElementById('brandName').value || 'My Brand');
        
        const response = await fetch('/api/generate-brand-kit', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brand_kit.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showStatus('Brand kit generated successfully!', 'success');
        
        // Reset form after successful generation
        setTimeout(() => {
            uploadedFiles = [];
            imagePreview.innerHTML = '';
            fileInput.value = '';
            fileCount.style.display = 'none';
            document.getElementById('brandName').value = '';
        }, 3000);
        
    } catch (error) {
        console.error('Generation error:', error);
        showStatus(`Error: ${error.message || 'Failed to generate brand kit'}`, 'error');
    } finally {
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
    }
});

// Helper function to show status messages
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (statusMessage.textContent === message) {
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
            }
        }, 5000);
    }
}

// Add some additional UX improvements
document.addEventListener('paste', (e) => {
    if (e.clipboardData.files.length > 0) {
        handleFiles(e.clipboardData.files);
        e.preventDefault();
    }
});

// Add keyboard accessibility
dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        fileInput.click();
    }
});