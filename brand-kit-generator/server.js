const express = require('express');
const multer = require('multer');
const path = require('path');
const { generateBrandPDF } = require('./pdfGenerator');

const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static('public'));

// API endpoint for PDF generation
app.post('/api/generate-brand-kit', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length < 3) {
            return res.status(400).json({ error: 'Please upload at least 3 images' });
        }

        // Process images (in a real app, you'd analyze them here)
        const brandData = {
            brandName: "Extracted Brand",
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
        const pdfPath = path.join(__dirname, 'generated', 'brand-kit.pdf');
        await generateBrandPDF(brandData, pdfPath);

        // Send the PDF back
        res.download(pdfPath, 'brand-kit.pdf', (err) => {
            if (err) {
                console.error('Error sending PDF:', err);
                res.status(500).json({ error: 'Error generating PDF' });
            }
            
            // Clean up uploaded files
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});