// Enhanced DOM utility with caching
const DOM = {
    elements: {},
    get(id) {
        if (!this.elements[id]) {
            const el = document.getElementById(id);
            if (!el) console.warn(`Element with ID ${id} not found`);
            this.elements[id] = el || null;
        }
        return this.elements[id];
    },
    safeValue(id, defaultValue = '') {
        const el = this.get(id);
        return el ? el.value.trim() : defaultValue;
    }
};

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_COUNT = 10;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_COLORS = {
    primary: '#2A5CAA',
    secondary: '#F4B223',
    accent: '#E74C3C'
};

// State management
const AppState = {
    uploadedFiles: [],
    isProcessing: false,
    init() {
        // Initialize essential elements
        if (!this.checkEssentialElements()) return false;

        // Set up event listeners
        this.setupEventListeners();
        return true;
    },
    checkEssentialElements() {
        const requiredElements = ['dropZone', 'fileInput', 'generateBtn', 'colorAnalysisBtn', 'fontAnalysisBtn'];
        const missingElements = requiredElements.filter(id => !DOM.get(id));
        
        if (missingElements.length > 0) {
            console.error('Missing essential elements:', missingElements);
            this.showStatus('Error: Critical components missing. Please reload.', 'error', 0);
            return false;
        }
        return true;
    },
    setupEventListeners() {
        const { dropZone, fileInput, generateBtn, colorAnalysisBtn, fontAnalysisBtn } = DOM.elements;
        
        dropZone.addEventListener('dragover', this.handleDragOver);
        dropZone.addEventListener('dragleave', this.handleDragLeave);
        dropZone.addEventListener('drop', this.handleDrop);
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        generateBtn.addEventListener('click', this.generateBrandKit.bind(this));
        document.addEventListener('paste', this.handlePaste.bind(this));
        
        if (colorAnalysisBtn) {
            colorAnalysisBtn.addEventListener('click', this.analyzeColors.bind(this));
        }
        if (fontAnalysisBtn) {
            fontAnalysisBtn.addEventListener('click', this.analyzeFonts.bind(this));
        }
    },
    handleDragOver(e) {
        e.preventDefault();
        DOM.get('dropZone').classList.add('active');
    },
    handleDragLeave() {
        DOM.get('dropZone').classList.remove('active');
    },
    handleDrop(e) {
        e.preventDefault();
        this.handleDragLeave();
        this.handleFiles(e.dataTransfer.files);
    },
    handleFileSelect() {
        this.handleFiles(DOM.get('fileInput').files);
    },
    handlePaste(e) {
        if (e.clipboardData.files.length > 0) {
            this.handleFiles(e.clipboardData.files);
            e.preventDefault();
        }
    },
    handleFiles(files) {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files)
            .filter(file => this.validateFile(file))
            .slice(0, MAX_FILE_COUNT);
        
        this.uploadedFiles = validFiles;
        this.updateUI();
    },
    validateFile(file) {
        const isValidType = VALID_IMAGE_TYPES.includes(file.type);
        const isValidSize = file.size <= MAX_FILE_SIZE;
        
        if (!isValidType) {
            this.showStatus(`Unsupported file type: ${file.name}`, 'error');
        }
        if (!isValidSize) {
            this.showStatus(`File too large (max 10MB): ${file.name}`, 'error');
        }
        
        return isValidType && isValidSize;
    },
    updateUI() {
        console.log('updateUI called, uploadedFiles.length:', this.uploadedFiles.length);
        const imagePreview = DOM.get('imagePreview');
        const fileCount = DOM.get('fileCount');
        const generateBtn = DOM.get('generateBtn');
        
        // Clear existing previews
        if (imagePreview) imagePreview.innerHTML = '';
        
        // Update file count display
        if (fileCount) {
            fileCount.textContent = `${this.uploadedFiles.length} file${this.uploadedFiles.length !== 1 ? 's' : ''}`;
            fileCount.style.display = this.uploadedFiles.length ? 'block' : 'none';
        }
        
        // Update analysis buttons
        this.toggleAnalysisButtons(this.uploadedFiles.length > 0);
        
        // Check minimum file requirement
        if (this.uploadedFiles.length < 3) {
            this.showStatus('Upload at least 3 images (JPEG, PNG, or WebP)', 'error');
            if (generateBtn) generateBtn.disabled = true;
            return;
        }
        
        // Process files for preview
        this.processFilePreviews();
    },
    toggleAnalysisButtons(enabled) {
        console.log('toggleAnalysisButtons called with enabled:', enabled, 'DOM.elements:', DOM.elements);
        const { colorAnalysisBtn, fontAnalysisBtn } = DOM.elements;
        if (colorAnalysisBtn) colorAnalysisBtn.disabled = !enabled;
        if (fontAnalysisBtn) fontAnalysisBtn.disabled = !enabled;
    },
    async processFilePreviews() {
        const imagePreview = DOM.get('imagePreview');
        if (!imagePreview) return;
        
        this.showStatus(`${this.uploadedFiles.length} images ready`, 'success');
        DOM.get('generateBtn').disabled = false;
        
        // Process each file for preview
        await Promise.all(this.uploadedFiles.map(async (file, index) => {
            try {
                const previewItem = this.createPreviewItem(file, index);
                const imgSrc = await this.readFileAsDataURL(file);
                
                const img = previewItem.querySelector('img');
                if (img) img.src = imgSrc;
                
                // Add file metadata
                const sizeInfo = document.createElement('div');
                sizeInfo.className = 'file-meta';
                sizeInfo.innerHTML = `
                    <span>${(file.size / 1024 / 1024).toFixed(1)}MB</span>
                    <span>${file.type.split('/')[1].toUpperCase()}</span>
                `;
                previewItem.appendChild(sizeInfo);
                
            } catch (error) {
                console.error('Error processing file preview:', error);
            }
        }));
    },
    createPreviewItem(file, index) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.dataset.filename = file.name;
        
        previewItem.innerHTML = `
            <img alt="Preview ${file.name}">
            <span class="preview-filename">
                ${this.truncateFilename(file.name)}
            </span>
        `;
        
        DOM.get('imagePreview').appendChild(previewItem);
        return previewItem;
    },
    truncateFilename(name, maxLength = 20) {
        if (name.length <= maxLength) return name;
        const ext = name.split('.').pop();
        return `${name.substring(0, maxLength - ext.length - 3)}...${ext}`;
    },
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    async analyzeColors() {
        if (this.uploadedFiles.length === 0 || this.isProcessing) return;
        
        this.setProcessing(true);
        try {
            const formData = new FormData();
            formData.append('image', this.uploadedFiles[0]);
            
            const response = await this.apiRequest('/api/analyze/colors', formData);
            const { data } = response;
            
            // Update color inputs
            this.updateColorInputs({
                primary: data.palette[0],
                secondary: data.palette[1],
                accent: data.palette[2]
            });
            
            this.showStatus('Colors extracted successfully!', 'success');
            
        } catch (error) {
            console.error('Color analysis failed:', error);
            this.showStatus('Color extraction failed. Please select manually.', 'error');
        } finally {
            this.setProcessing(false);
        }
    },
    async analyzeFonts() {
        if (this.uploadedFiles.length === 0 || this.isProcessing) return;
        
        this.setProcessing(true);
        try {
            const formData = new FormData();
            formData.append('image', this.uploadedFiles[0]);
            
            const response = await this.apiRequest('/api/analyze/fonts', formData);
            const { data } = response;
            
            this.showStatus(
                `Suggested fonts: Heading (${data.fonts.heading}), Body (${data.fonts.body})`, 
                'success'
            );
            
        } catch (error) {
            console.error('Font analysis failed:', error);
            this.showStatus('Font detection failed. Using default fonts.', 'error');
        } finally {
            this.setProcessing(false);
        }
    },
    async generateBrandKit() {
        if (this.uploadedFiles.length < 3 || this.isProcessing) return;
        
        // Validate files before upload
        const oversizedFiles = this.uploadedFiles.filter(f => f.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            this.showStatus(
                `Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`, 
                'error'
            );
            return;
        }
        
        this.setProcessing(true);
        
        try {
            const formData = new FormData();
            this.uploadedFiles.forEach(file => formData.append('images', file));
            
            // Add form data with fallbacks
            formData.append('brandName', DOM.safeValue('brandName', 'Our Brand'));
            formData.append('tagline', DOM.safeValue('brandTagline', 'Innovating tomorrow'));
            formData.append('primaryColor', DOM.safeValue('primaryColor', DEFAULT_COLORS.primary));
            formData.append('secondaryColor', DOM.safeValue('secondaryColor', DEFAULT_COLORS.secondary));
            
            const response = await this.apiRequest('/api/generate-brand-kit', formData);
            this.downloadPDF(response);
            this.showStatus('Brand kit generated!', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Generation failed:', error);
            this.showStatus(
                error.message.includes('File too large') 
                    ? 'Files exceed 10MB limit' 
                    : 'Failed to generate brand kit',
                'error'
            );
        } finally {
            this.setProcessing(false);
        }
    },
    async apiRequest(endpoint, body) {
        const response = await fetch(endpoint, {
            method: 'POST',
            body
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Request failed');
        }
        
        return response.json();
    },
    updateColorInputs(colors) {
        const { primaryColorInput, secondaryColorInput } = DOM.elements;
        if (colors.primary && primaryColorInput) primaryColorInput.value = colors.primary;
        if (colors.secondary && secondaryColorInput) secondaryColorInput.value = colors.secondary;
    },
    downloadPDF(response) {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brand-kit-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    resetForm() {
        setTimeout(() => {
            this.uploadedFiles = [];
            this.toggleAnalysisButtons(false);
            
            const imagePreview = DOM.get('imagePreview');
            if (imagePreview) imagePreview.innerHTML = '';
            
            const fileInput = DOM.get('fileInput');
            if (fileInput) fileInput.value = '';
            
            const fileCount = DOM.get('fileCount');
            if (fileCount) fileCount.style.display = 'none';
        }, 3000);
    },
    setProcessing(isProcessing) {
        this.isProcessing = isProcessing;
        const generateBtn = DOM.get('generateBtn');
        const loadingIndicator = DOM.get('loadingIndicator');
        const statusMessage = DOM.get('statusMessage');
        
        if (generateBtn) generateBtn.disabled = isProcessing;
        if (loadingIndicator) loadingIndicator.style.display = isProcessing ? 'flex' : 'none';
        if (statusMessage && isProcessing) {
            statusMessage.textContent = 'Processing...';
        }
    },
    showStatus(message, type, timeout = 5000) {
        const statusMessage = DOM.get('statusMessage');
        if (!statusMessage) return;
        
        statusMessage.textContent = message;
        statusMessage.className = `status ${type}`;
        
        if (timeout > 0) {
            setTimeout(() => {
                if (statusMessage.textContent === message) {
                    statusMessage.textContent = '';
                    statusMessage.className = 'status';
                }
            }, timeout);
        }
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    if (AppState.init()) {
        console.log('Brand Kit Generator initialized');
    } else {
        console.error('Application failed to initialize');
    }
});