const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateBrandPDF(brandData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create output directory if needed
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `${brandData.brandName} Brand Guidelines`,
          Author: "Brand Kit Generator",
          CreationDate: new Date()
        }
      });

      const stream = fs.createWriteStream(outputPath)
        .on('error', reject)
        .on('finish', () => resolve(outputPath));

      doc.pipe(stream);

      // ====== COVER PAGE ======
      doc.fillColor(brandData.colors.primary)
         .rect(0, 0, doc.page.width, 120)
         .fill();
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .text(brandData.brandName, 50, 50);
      
      doc.fillColor(brandData.colors.secondary)
         .fontSize(16)
         .text('Brand Guidelines', 50, 85);
      
      doc.fillColor('#333333')
         .fontSize(10)
         .text(`Generated on ${brandData.dateCreated}`, 50, 750);
      
      doc.addPage();

      // ====== TABLE OF CONTENTS ======
      addSectionHeader(doc, 'Table of Contents', brandData.colors.primary);
      
      const sections = [
        'Introduction', 'Brand Colors', 'Typography', 
        'Logo Usage', 'Imagery', 'Brand Voice', 'Contact'
      ];
      
      doc.moveDown();
      sections.forEach((section, i) => {
        doc.text(`${i + 1}. ${section.padEnd(30, '.')}${i + 3}`, { indent: 20 });
      });
      
      doc.addPage();

      // ====== MAIN CONTENT ======
      addSection(doc, '1. Introduction', [
        `Welcome to the ${brandData.brandName} Brand Guidelines.`,
        'This document establishes visual and verbal standards for all brand communications.'
      ], brandData);

      addColorSection(doc, brandData);
      addTypographySection(doc, brandData);
      addLogoSection(doc, brandData);
      
      // ====== FINAL PAGE ======
      addSectionHeader(doc, '7. Contact', brandData.colors.primary);
      doc.moveDown();
      doc.text('For brand inquiries, please contact our team.', { indent: 20 });

      // ====== PAGE NUMBERS ======
      addPageNumbers(doc, brandData);

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

// Helper functions
function addSectionHeader(doc, text, color) {
  doc.fontSize(22)
     .fillColor(color)
     .text(text, 50, 50);
  
  doc.moveTo(50, 75)
     .lineTo(150, 75)
     .lineWidth(2)
     .strokeColor(color)
     .stroke();
}

function addSection(doc, title, content, brandData) {
  addSectionHeader(doc, title, brandData.colors.primary);
  doc.moveDown();
  
  content.forEach(paragraph => {
    doc.fontSize(12)
       .text(paragraph, { 
         indent: 20,
         lineGap: brandData.typography?.lineHeight || 1.5
       });
    doc.moveDown();
  });
  
  doc.addPage();
}

function addColorSection(doc, brandData) {
  addSectionHeader(doc, '2. Brand Colors', brandData.colors.primary);
  doc.moveDown();
  
  // Color grid
  const colors = brandData.colors;
  const squareSize = 50;
  const gap = 20;
  const startX = 50;
  
  Object.keys(colors).forEach((key, i) => {
    if (typeof colors[key] !== 'string') return;
    
    const x = startX + (i % 3 * (squareSize + gap + 100));
    const y = doc.y + Math.floor(i / 3) * (squareSize + gap + 30);
    
    doc.rect(x, y, squareSize, squareSize)
       .fill(colors[key]);
    
    doc.fontSize(10)
       .fillColor('#333333')
       .text(`${key}: ${colors[key]}`, x, y + squareSize + 10, {
         width: squareSize,
         align: 'center'
       });
  });
  
  doc.addPage();
}

function addTypographySection(doc, brandData) {
  addSectionHeader(doc, '3. Typography', brandData.colors.primary);
  doc.moveDown();
  
  doc.font('Helvetica-Bold')
     .fontSize(16)
     .text('Headings:', { indent: 20 });
  
  doc.font('Helvetica')
     .fontSize(12)
     .text('Body text sample', { indent: 40 });
  
  doc.addPage();
}

function addLogoSection(doc, brandData) {
  addSectionHeader(doc, '4. Logo Usage', brandData.colors.primary);
  doc.moveDown();
  
  doc.text(brandData.logoAnalysis || 'Logo guidelines', { indent: 20 });
  doc.addPage();
}

function addPageNumbers(doc, brandData) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`Page ${i + 1} of ${range.count}`, 500, 800, {
         align: 'right'
       });
  }
}

module.exports = { generateBrandPDF };