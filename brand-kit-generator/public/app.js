// DOM Elements with null checks
const getElement = (id) => {
    const el = document.getElementById(id);
    if (!el) console.warn(`Element with ID ${id} not found`);
    return el;
};

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_COUNT = 10;

// Get elements
const dropZone = getElement('dropZone');
const fileInput = getElement('fileInput');
const imagePreview = getElement('imagePreview');
const generateBtn = getElement('generateBtn');
const loadingIndicator = getElement('loadingIndicator');
const statusMessage = getElement('statusMessage');
const fileCount = getElement('fileCount');
const brandNameInput = getElement('brandName') || { value: '' };
const brandTaglineInput = getElement('brandTagline') || { value: '' };
const primaryColorInput = getElement('primaryColor') || { value: '#2A5CAA' };
const secondaryColorInput = getElement('secondaryColor') || { value: '#F4B223' };
const fileSizeWarning = getElement('fileSizeWarning') || { style: { display: '' } };

// Check for essential elements
if (!dropZone || !fileInput || !generateBtn) {
    console.error('Essential elements missing from page');
    if (statusMessage) {
        statusMessage.textContent = 'Error: Page elements missing. Please reload.';
        statusMessage.className = 'status error';
    }
} else {
    // Store uploaded files
    let uploadedFiles = [];

    // Event Listeners
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    generateBtn.addEventListener('click', generateBrandKit);
    document.addEventListener('paste', handlePaste);

    // Functions
    function handleDragOver(e) {
        e.preventDefault();
        dropZone.classList.add('active');
    }

    function handleDragLeave() {
        dropZone.classList.remove('active');
    }

    function handleDrop(e) {
        e.preventDefault();
        handleDragLeave();
        handleFiles(e.dataTransfer.files);
    }

    function handleFileSelect() {
        handleFiles(fileInput.files);
    }

    function handlePaste(e) {
        if (e.clipboardData.files.length > 0) {
            handleFiles(e.clipboardData.files);
            e.preventDefault();
        }
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/') && 
                              ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
            const isValidSize = file.size <= MAX_FILE_SIZE;
            
            if (!isValidSize) {
                showStatus(`File ${file.name} exceeds 10MB limit`, 'error', 5000);
            }
            
            return isValidType && isValidSize;
        }).slice(0, MAX_FILE_COUNT);
        
        uploadedFiles = validFiles;
        updateFileDisplay();
    }

    function updateFileDisplay() {
        if (!imagePreview) return;
        
        imagePreview.innerHTML = '';
        
        if (fileCount) {
            fileCount.textContent = `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} selected`;
            fileCount.style.display = uploadedFiles.length ? 'block' : 'none';
        }
        
        // Show/hide size warning
        if (fileSizeWarning) {
            const hasLargeFiles = uploadedFiles.some(file => file.size > MAX_FILE_SIZE);
            fileSizeWarning.style.display = hasLargeFiles ? 'block' : 'none';
        }
        
        if (uploadedFiles.length < 3) {
            showStatus('Please upload at least 3 images (JPEG, PNG, or WebP)', 'error');
            if (generateBtn) generateBtn.disabled = true;
            return;
        }
        
        showStatus(`${uploadedFiles.length} images ready for processing`, 'success');
        if (generateBtn) generateBtn.disabled = false;
        
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            const previewItem = createPreviewItem(file, index);
            
            // Add file size info
            const sizeInfo = document.createElement('div');
            sizeInfo.className = 'file-size-info';
            sizeInfo.textContent = `${(file.size / 1024 / 1024).toFixed(1)}MB`;
            previewItem.appendChild(sizeInfo);
            
            reader.onload = (e) => {
                const img = previewItem.querySelector('img');
                if (img) img.src = e.target.result;
            };
            
            reader.onerror = () => {
                previewItem.classList.add('error');
                showStatus(`Error loading ${file.name}`, 'error');
            };
            
            reader.readAsDataURL(file);
        });
    }

    function createPreviewItem(file, index) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        previewItem.innerHTML = `
            <img alt="Preview ${index + 1}">
            <span class="preview-filename">
                ${file.name.length > 20 
                    ? `${file.name.substring(0, 15)}...${file.name.split('.').pop()}` 
                    : file.name}
            </span>
        `;
        
        if (imagePreview) imagePreview.appendChild(previewItem);
        return previewItem;
    }

    async function generateBrandKit() {
        if (uploadedFiles.length < 3) return;
        
        // Check for oversized files before upload
        const oversizedFiles = uploadedFiles.filter(file => file.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            showStatus(`Some files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`, 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            const formData = new FormData();
            uploadedFiles.forEach(file => formData.append('images', file));
            
            // Safely get values with fallbacks
            formData.append('brandName', brandNameInput.value.trim() || 'Our Brand');
            formData.append('tagline', brandTaglineInput.value.trim() || 'Innovating tomorrow');
            formData.append('primaryColor', primaryColorInput.value || '#2A5CAA');
            formData.append('secondaryColor', secondaryColorInput.value || '#F4B223');
            
            const response = await fetch('/api/generate-brand-kit', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                const errorMsg = error.error || 'Failed to generate brand kit';
                throw new Error(errorMsg.includes('File too large') 
                    ? 'One or more files exceed 10MB limit' 
                    : errorMsg);
            }
            
            const blob = await response.blob();
            downloadPDF(blob);
            showStatus('Brand kit generated successfully!', 'success');
            resetForm();
            
        } catch (error) {
            console.error('Generation error:', error);
            showStatus(error.message || 'Failed to generate brand kit', 'error');
        } finally {
            showLoading(false);
        }
    }

    function downloadPDF(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brand-kit-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    function resetForm() {
        setTimeout(() => {
            uploadedFiles = [];
            if (imagePreview) imagePreview.innerHTML = '';
            if (fileInput) fileInput.value = '';
            if (fileCount) fileCount.style.display = 'none';
        }, 3000);
    }

    function showLoading(show) {
        if (generateBtn) generateBtn.disabled = show;
        if (loadingIndicator) loadingIndicator.style.display = show ? 'flex' : 'none';
        if (statusMessage && show) {
            statusMessage.textContent = 'Analyzing brand elements and generating PDF...';
        }
    }

    function showStatus(message, type, timeout = 5000) {
        if (!statusMessage) return;
        
        statusMessage.textContent = message;
        statusMessage.className = `status ${type}`;
        
        if (type === 'success' || timeout) {
            setTimeout(() => {
                if (statusMessage.textContent === message) {
                    statusMessage.textContent = '';
                    statusMessage.className = 'status';
                }
            }, timeout);
        }
    }
}