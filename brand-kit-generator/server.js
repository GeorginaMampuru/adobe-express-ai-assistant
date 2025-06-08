const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateBrandPDF } = require('./pdfGenerator');

const app = express();
const port = process.env.PORT || 3000;

// Create necessary directories
['uploads', 'generated', 'public'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
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

// API endpoint
app.post('/api/generate-brand-kit', upload.array('images', 10), async (req, res) => {
  try {
    // Validate files
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least 3 images'
      });
    }

    // Create complete brand data structure
    const brandData = {
      brandName: req.body.brandName || "Extracted Brand",
      colors: {
        primary: "#2A5CAA",
        secondary: "#F4B223",
        accent: "#E74C3C",
        dark: "#2C3E50",
        light: "#ECF0F1"
      },
      fonts: {
        heading: "Helvetica-Bold",
        body: "Helvetica"
      },
      typography: {
        lineHeight: 1.5
      },
      logoAnalysis: "Brand style extracted from uploaded images",
      dateCreated: new Date().toLocaleDateString('en-ZA')
    };

    // Generate PDF
    const pdfFilename = `brand-kit-${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, 'generated', pdfFilename);
    
    await generateBrandPDF(brandData, pdfPath);

    // Send file
    res.download(pdfPath, pdfFilename, (err) => {
      // Cleanup
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
    if (files) {
      files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }
    if (pdfPath) {
      try { fs.unlinkSync(pdfPath); } catch (e) {}
    }
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