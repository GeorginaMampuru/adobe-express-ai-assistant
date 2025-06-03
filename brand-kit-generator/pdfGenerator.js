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
    heading: "Helvetica-Bold", // Changed to standard PDF font
    body: "Helvetica"         // Changed to standard PDF font
  },
  logoAnalysis: "Modern, geometric style detected with clean lines and vibrant colors that suggest innovation and energy."
};

function generateBrandPDF(brandData, outputPath) {
  // Create a document
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: `${brandData.brandName} Brand Guidelines`,
      Author: 'Adobe Express AI Assistant',
      Creator: 'Brand Kit Generator'
    }
  });

  // Pipe its output to a file
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Add cover page
  doc.fillColor('#333333')
     .fontSize(40)
     .text(brandData.brandName, 50, 100);
  doc.fontSize(20)
     .text('Brand Guidelines', 50, 160);
  doc.addPage();

  // Add title
  doc.fontSize(25)
     .text(`${brandData.brandName} Brand Guidelines`, {
       align: 'center'
     });
  doc.moveDown();

  // Add divider
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(2);

  // Add color palette section
  doc.fontSize(18).text('Color Palette', {
    underline: true
  });
  doc.moveDown();

  // Draw color squares with labels
  const colors = brandData.colors;
  const squareSize = 50;
  const gap = 20;
  const startX = 50;

  Object.keys(colors).forEach((key, i) => {
    const x = startX + (i * (squareSize + gap + 100));
    
    // Draw color square
    doc.rect(x, doc.y, squareSize, squareSize)
       .fill(colors[key]);
    
    // Add color label
    doc.fontSize(10)
       .fillColor('black')
       .text(`${key}\n${colors[key]}`, x, doc.y + squareSize + 5, {
         width: squareSize,
         align: 'center'
       });
  });

  doc.moveDown(4);

  // Add typography section
  doc.fontSize(18).text('Typography', {
    underline: true
  });
  doc.moveDown();

  // Display heading font
  doc.font('Helvetica-Bold')
     .fontSize(14)
     .text('Heading Font: ' + brandData.fonts.heading);
  
  doc.font('Helvetica-Bold')
     .fontSize(16)
     .text('The quick brown fox jumps over the lazy dog', {
       indent: 20
     });
  
  doc.moveDown();

  // Display body font
  doc.font('Helvetica')
     .fontSize(14)
     .text('Body Font: ' + brandData.fonts.body);
  
  doc.font('Helvetica')
     .fontSize(12)
     .text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.', {
       indent: 20,
       lineGap: 5
     });
  
  doc.moveDown(2);

  // Add logo analysis
  doc.fontSize(18).text('Logo Analysis', {
    underline: true
  });
  doc.moveDown();
  
  doc.fontSize(12)
     .text(brandData.logoAnalysis, {
       lineGap: 5,
       paragraphGap: 10
     });

  // Add footer with page numbers
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(10)
       .text(`Page ${i + 1} of ${pages.count}`, 500, 800, {
         align: 'right'
       });
  }

  doc.end();
}

// Generate PDF with mock data
generateBrandPDF(mockBrandData, './brand_guidelines.pdf');

console.log('Brand guidelines PDF generated successfully!');