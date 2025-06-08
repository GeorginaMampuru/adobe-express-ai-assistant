const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateBrandPDF } = require('./pdfGenerator');

const app = express();
const port = process.env.PORT || 3000;

// Configure directories
['uploads', 'generated', 'public'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configure Multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint
app.post('/api/generate-brand-kit', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please upload at least 3 images' 
      });
    }

    // Extract form data
    const brandData = {
      brandName: req.body.brandName || 'Our Brand',
      tagline: req.body.tagline || 'Innovating tomorrow',
      colors: {
        primary: req.body.primaryColor || '#2A5CAA',
        secondary: req.body.secondaryColor || '#F4B223',
        accent: '#E74C3C',
        dark: '#2C3E50',
        light: '#ECF0F1'
      },
      fonts: {
        heading: "Helvetica-Bold",
        body: "Helvetica"
      },
      dateCreated: new Date().toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    // Generate PDF
    const pdfFilename = `brand-kit-${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, 'generated', pdfFilename);
    
    await generateBrandPDF(brandData, pdfPath);

    // Stream the PDF back
    res.download(pdfPath, pdfFilename, (err) => {
      // Cleanup files
      cleanupFiles(req.files, pdfPath);
      if (err) console.error('Download error:', err);
    });

  } catch (error) {
    console.error('Server error:', error);
    cleanupFiles(req.files);
    res.status(500).json({ 
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error'
    });
  }
});

// Helper function for file cleanup
function cleanupFiles(files = [], pdfPath = null) {
  try {
    files?.forEach(file => fs.unlinkSync(file.path));
    if (pdfPath) fs.unlinkSync(pdfPath);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});