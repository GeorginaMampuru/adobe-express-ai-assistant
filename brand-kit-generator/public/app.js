// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');
const fileCount = document.getElementById('fileCount');
const brandNameInput = document.getElementById('brandName');

// Store uploaded files
let uploadedFiles = [];

// Event Listeners
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', handleKeyDown);
fileInput.addEventListener('change', handleFileSelect);
generateBtn.addEventListener('click', generateBrandKit);
document.addEventListener('paste', handlePaste);

// Functions
function handleDragOver(e) {
  e.preventDefault();
  dropZone.classList.add('active');
  dropZone.querySelector('.drop-instructions').textContent = 'Drop your files here';
}

function handleDragLeave() {
  dropZone.classList.remove('active');
  dropZone.querySelector('.drop-instructions').textContent = 'Drag & drop your brand images here';
}

function handleDrop(e) {
  e.preventDefault();
  handleDragLeave();
  handleFiles(e.dataTransfer.files);
}

function handleKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    fileInput.click();
  }
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
  const validFiles = Array.from(files).filter(file => 
    file.type.startsWith('image/') && 
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  );
  
  uploadedFiles = validFiles.slice(0, 10);
  updateFileDisplay();
}

function updateFileDisplay() {
  imagePreview.innerHTML = '';
  fileCount.textContent = `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} selected`;
  fileCount.style.display = 'block';
  
  if (uploadedFiles.length < 3) {
    showStatus('Please upload at least 3 images (JPEG, PNG, or WebP)', 'error');
    generateBtn.disabled = true;
    return;
  }
  
  showStatus(`${uploadedFiles.length} images ready for processing`, 'success');
  generateBtn.disabled = false;
  
  uploadedFiles.forEach((file, index) => {
    const reader = new FileReader();
    const previewItem = createPreviewItem(file, index);
    
    reader.onloadstart = () => {
      previewItem.querySelector('.preview-progress').style.width = '0%';
    };
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        previewItem.querySelector('.preview-progress').style.width = `${(e.loaded / e.total) * 100}%`;
      }
    };
    
    reader.onload = (e) => {
      previewItem.querySelector('img').src = e.target.result;
      previewItem.querySelector('.preview-progress').style.width = '100%';
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
    <div class="preview-progress"></div>
    <img alt="Preview ${index + 1}">
    <span class="preview-filename">
      ${file.name.length > 20 
        ? `${file.name.substring(0, 15)}...${file.name.split('.').pop()}` 
        : file.name}
    </span>
  `;
  
  imagePreview.appendChild(previewItem);
  return previewItem;
}

async function generateBrandKit() {
  if (uploadedFiles.length < 3) return;
  
  showLoading(true);
  
  try {
    const formData = new FormData();
    uploadedFiles.forEach(file => formData.append('images', file));
    formData.append('brandName', brandNameInput.value || '');
    
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
  a.download = 'brand-kit.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetForm() {
  setTimeout(() => {
    uploadedFiles = [];
    imagePreview.innerHTML = '';
    fileInput.value = '';
    fileCount.style.display = 'none';
    brandNameInput.value = '';
  }, 3000);
}

function showLoading(show) {
  generateBtn.disabled = show;
  loadingIndicator.style.display = show ? 'flex' : 'none';
  statusMessage.textContent = show 
    ? 'Analyzing brand elements and generating PDF...' 
    : '';
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  if (type === 'success') {
    setTimeout(() => {
      if (statusMessage.textContent === message) {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
      }
    }, 5000);
  }
}