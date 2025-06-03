const PDFDocument = require('pdfkit');
const fs = require('fs');

// Mock data - this will later come from your image processing
const mockBrandData = {
  brandName: "Acme Corp",
  colors: {
    primary: "#FF5733",
    secondary: "#33FF57",
    accent: "#3357FF"
  },
  fonts: {
    heading: "Helvetica Bold",
    body: "Roboto"
  },
  logoAnalysis: "Modern, geometric style detected"
};

function generateBrandPDF(brandData, outputPath) {
    // Create a document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
    // Pipe its output to a file
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
  
    // Add content here (we'll build this next)
  
    // Finalize the PDF and end the stream
    doc.end();
  }
  
  // Generate PDF with mock data
  generateBrandPDF(mockBrandData, './brand_guidelines.pdf');
  function generateBrandPDF(brandData, outputPath) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
  
    // Add title
    doc.fontSize(25).text(`${brandData.brandName} Brand Guidelines`, {
      align: 'center'
    });
    doc.moveDown();
  
    // Add divider
    doc.moveTo(50, 100).lineTo(550, 100).stroke();
    doc.moveDown(2);
  
    // Add color palette section
    doc.fontSize(18).text('Color Palette', {
      underline: true
    });
    doc.moveDown();
  
    // Draw color squares with labels
    const colors = brandData.colors;
    const startY = doc.y;
    const squareSize = 50;
    const gap = 20;
  
    Object.keys(colors).forEach((key, i) => {
      const x = 50 + (i * (squareSize + gap + 100));
      
      // Draw color square
      doc.rect(x, doc.y, squareSize, squareSize)
         .fill(colors[key]);
      
      // Add color label
      doc.fontSize(12)
         .fillColor('black')
         .text(`${key}: ${colors[key]}`, x, doc.y + squareSize + 5, {
           width: 100
         });
    });
  
    doc.moveDown(3);
  
    // Add typography section
    doc.fontSize(18).text('Typography', {
      underline: true
    });
    doc.moveDown();
  
    // Display heading font
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .text('Heading Font: ' + brandData.fonts.heading);
    
    doc.font('Times-Roman')
       .fontSize(12)
       .text('Sample heading text', {
         font: 'Helvetica-Bold'
       });
    
    doc.moveDown();
  
    // Display body font
    doc.font('Helvetica')
       .fontSize(14)
       .text('Body Font: ' + brandData.fonts.body);
    
    doc.font(brandData.fonts.body)
       .fontSize(12)
       .text('Sample body text for demonstration purposes.');
    
    doc.moveDown(2);
  
    // Add logo analysis
    doc.fontSize(18).text('Logo Analysis', {
      underline: true
    });
    doc.moveDown();
    
    doc.fontSize(12).text(brandData.logoAnalysis);
  
    doc.end();
  }