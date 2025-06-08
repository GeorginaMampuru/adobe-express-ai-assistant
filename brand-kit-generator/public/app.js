// DOM Elements with null checks
const getElement = (id) => {
    const el = document.getElementById(id);
    if (!el) console.warn(`Element with ID ${id} not found`);
    return el;
};

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

        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/') && 
            ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        );
        
        uploadedFiles = validFiles.slice(0, 10);
        updateFileDisplay();
    }

    function updateFileDisplay() {
        if (!imagePreview) return;
        
        imagePreview.innerHTML = '';
        
        if (fileCount) {
            fileCount.textContent = `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} selected`;
            fileCount.style.display = uploadedFiles.length ? 'block' : 'none';
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
                throw new Error(error.error || 'Failed to generate brand kit');
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

    function showStatus(message, type) {
        if (!statusMessage) return;
        
        statusMessage.textContent = message;
        statusMessage.className = `status ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                if (statusMessage.textContent === message) {
                    statusMessage.textContent = '';
                    statusMessage.className = 'status';
                }
            }, 5000);
        }
    }
}