const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Missing import
const { generateBrandPDF } = require('./pdfGenerator');

const app = express();
const port = process.env.PORT || 3000; // Better port handling

// Create necessary directories if they don't exist
[ 'uploads', 'generated', 'public' ].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

// Serve static files - only need this once
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for PDF generation
app.post('/api/generate-brand-kit', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({ 
        success: false,
        error: 'Please upload at least 3 images' 
      });
    }

    // Process images (in a real app, you'd analyze them here)
    const brandData = {
      brandName: req.body.brandName || "Extracted Brand",
      colors: {
        primary: "#FF5733",
        secondary: "#33FF57",
        accent: "#3357FF"
      },
      fonts: {
        heading: "Helvetica-Bold",
        body: "Helvetica"
      },
      logoAnalysis: "Brand style extracted from uploaded images"
    };

    // Generate PDF
    const pdfPath = path.join(__dirname, 'generated', `brand-kit-${Date.now()}.pdf`);
    await generateBrandPDF(brandData, pdfPath);

    // Send the PDF back
    res.download(pdfPath, 'brand-kit.pdf', (err) => {
      // Clean up files whether download succeeds or fails
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting uploaded file:', err);
        }
      });
      
      try {
        fs.unlinkSync(pdfPath); // Delete the generated PDF after sending
      } catch (err) {
        console.error('Error deleting generated PDF:', err);
      }

      if (err) {
        console.error('Error sending PDF:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false,
            error: 'Error downloading PDF' 
          });
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something broke!'
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});