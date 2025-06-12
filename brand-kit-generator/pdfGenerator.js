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

      // Helper function to check if we need a new page
      const checkAddPage = (minSpaceNeeded = 100) => {
        if (doc.y > doc.page.height - minSpaceNeeded) {
          doc.addPage();
          return true;
        }
        return false;
      };

      // ====== COVER PAGE ======
      // Header with primary color
      doc.fillColor(brandData.colors.primary)
         .rect(0, 0, doc.page.width, 120)
         .fill();
      
      // Brand name
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .text(brandData.brandName, 50, 50);
      
      // Tagline
      doc.fillColor(brandData.colors.secondary)
         .fontSize(16)
         .text(brandData.tagline, 50, 85);
      
      // Generation date
      doc.fillColor('#333333')
         .fontSize(10)
         .text(`Generated on ${brandData.dateCreated}`, 50, 750);
      
      // Force new page after cover
      doc.addPage();

      // ====== TABLE OF CONTENTS ======
      addSectionHeader(doc, 'Table of Contents', brandData.colors.primary);
      
      const sections = [
        'Introduction', 'Brand Colors', 'Typography', 
        'Logo Usage', 'Imagery Guidelines', 'Brand Voice',
        'Adobe Express Templates'
      ];
      
      doc.moveDown();
      sections.forEach((section, i) => {
        const pageNum = i < 6 ? i + 3 : i + 4;
        doc.text(`${i + 1}. ${section.padEnd(30, '.')}${pageNum}`, { 
          indent: 20,
          paragraphGap: 5
        });
      });
      
      // Only add new page if needed
      checkAddPage(200) || doc.addPage();

      // ====== MAIN CONTENT SECTIONS ======
      addSection(doc, '1. Introduction', [
        `Welcome to the ${brandData.brandName} Brand Guidelines.`,
        'This document establishes the visual and verbal identity standards for our brand.',
        'These guidelines ensure consistency across all brand communications and touchpoints.'
      ], brandData);

      addColorSection(doc, brandData);
      addTypographySection(doc, brandData);
      addLogoSection(doc, brandData);
      addImagerySection(doc, brandData);
      addBrandVoiceSection(doc, brandData);
      addTemplateSection(doc, brandData);

      // ====== PAGE NUMBERS ======
      addPageNumbers(doc, brandData);

      doc.end();

    } catch (err) {
      reject(err);
    }
  });

  function addSectionHeader(doc, text, color) {
    checkAddPage(100);
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
      checkAddPage(50);
      doc.fontSize(12)
         .text(paragraph, { 
           indent: 20,
           lineGap: 1.5
         });
      doc.moveDown();
    });
  }

  function addColorSection(doc, brandData) {
    addSectionHeader(doc, '2. Brand Colors', brandData.colors.primary);
    doc.moveDown();
    
    const colors = brandData.colors;
    const squareSize = 60;
    const gap = 30;
    const startX = 50;
    let startY = doc.y;

    Object.keys(colors).forEach((key, i) => {
      if (typeof colors[key] !== 'string') return;
      
      if (i % 3 === 0 && i !== 0 && doc.y > doc.page.height - 150) {
        doc.addPage();
        startY = 50;
      }
      
      const x = startX + (i % 3 * (squareSize + gap + 120));
      const y = startY + Math.floor(i / 3) * (squareSize + gap + 30);
      
      doc.rect(x, y, squareSize, squareSize)
         .fill(colors[key]);
      
      doc.fontSize(10)
         .fillColor('#333333')
         .text(`${key.toUpperCase()}`, x, y + squareSize + 10, {
           width: squareSize,
           align: 'center'
         })
         .text(colors[key], x, y + squareSize + 25, {
           width: squareSize,
           align: 'center'
         });
    });

    doc.moveDown(6);
    
    checkAddPage(300);
    doc.fontSize(14)
       .text('Color Application Examples:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text('Website Header:');
    doc.fillColor(brandData.colors.primary)
       .rect(50, doc.y, 500, 40)
       .fill();
    doc.fillColor('#FFFFFF')
       .font(brandData.fonts.heading)
       .fontSize(20)
       .text(brandData.brandName, 60, doc.y + 8);
    
    doc.moveDown(3);
    
    doc.fontSize(12)
       .text('Call-to-Action Button:');
    doc.fillColor(brandData.colors.secondary)
       .rect(50, doc.y, 180, 50)
       .fill();
    doc.fillColor('#333333')
       .font(brandData.fonts.heading)
       .fontSize(16)
       .text('SIGN UP NOW', 50, doc.y + 15, { width: 180, align: 'center' });
    
    doc.moveDown(4);
    
    doc.fontSize(14)
       .text('Color Application Guidelines:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text(`Primary Color (${brandData.colors.primary}):`, { continued: true })
       .fillColor(brandData.colors.primary)
       .text(' Use for primary brand elements and key actions', { underline: true });
    
    doc.fillColor('#333333')
       .text(`Secondary Color (${brandData.colors.secondary}):`, { continued: true })
       .fillColor(brandData.colors.secondary)
       .text(' Use for secondary elements and highlights', { underline: true });
  }

  function addTypographySection(doc, brandData) {
    addSectionHeader(doc, '3. Typography', brandData.colors.primary);
    doc.moveDown();
    
    doc.fontSize(14)
       .text('Heading Hierarchy:', { underline: true });
    
    doc.moveDown();
    doc.font(brandData.fonts.heading)
       .fillColor(brandData.colors.primary)
       .fontSize(32)
       .text('Main Headline', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.font(brandData.fonts.heading)
       .fillColor('#333333')
       .fontSize(24)
       .text('Section Title', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.font(brandData.fonts.heading)
       .fillColor('#666666')
       .fontSize(20)
       .text('Subheading', { indent: 20 });
    
    doc.moveDown(2);
    
    checkAddPage(200);
    doc.fontSize(14)
       .text('Typography in Context:', { underline: true });
    
    doc.moveDown();
    doc.font(brandData.fonts.heading)
       .fillColor(brandData.colors.primary)
       .fontSize(24)
       .text('Our Brand Story', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.font(brandData.fonts.body)
       .fillColor('#333333')
       .fontSize(12)
       .text('This is how your body text appears when paired with headings. The combination creates visual hierarchy and brand consistency.', 
            { indent: 20, lineGap: 1.5, width: 500 });
    
    doc.moveDown(2);
    
    doc.fontSize(14)
       .text('Font Pairing Guidelines:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text(`• Use ${brandData.fonts.heading} for all headings and display text`, { indent: 30 });
    doc.text(`• Use ${brandData.fonts.body} for body text and paragraphs`, { indent: 30 });
    doc.text('• Maintain consistent spacing and line heights', { indent: 30 });
  }

  function addLogoSection(doc, brandData) {
    addSectionHeader(doc, '4. Logo Usage', brandData.colors.primary);
    doc.moveDown();
    
    doc.fontSize(14)
       .text('Minimum Clear Space:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(10)
       .text('Maintain space equal to 1/2 the logo height on all sides:', { indent: 20 });
    
    const logoSize = 80;
    const clearSpace = logoSize/2;
    const boxX = 100;
    const boxY = doc.y + 10;
    
    doc.rect(boxX, boxY, logoSize + clearSpace*2, logoSize + clearSpace*2)
       .fill('#F5F5F5');
    doc.rect(boxX + clearSpace, boxY + clearSpace, logoSize, logoSize)
       .fill(brandData.colors.primary);
    doc.fillColor('#333333')
       .fontSize(8)
       .text('Logo', boxX + clearSpace, boxY + clearSpace + logoSize/2 - 5, 
            { width: logoSize, align: 'center' });
    
    doc.moveDown(6);
    
    checkAddPage(200);
    doc.fontSize(14)
       .text('Logo Guidelines:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text('• Maintain clear space around the logo as shown above', { indent: 30 });
    doc.text('• Use approved color variations', { indent: 30 });
    doc.text('• Minimum size: 50px digital, 1" print', { indent: 30 });
    
    doc.moveDown(2);
    doc.fontSize(14)
       .text('Incorrect Usage:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text('• Do not stretch or distort the logo', { indent: 30 });
    doc.text('• Do not recolor except approved variants', { indent: 30 });
    doc.text('• Do not rotate or modify the logo', { indent: 30 });
  }

  function addImagerySection(doc, brandData) {
    addSectionHeader(doc, '5. Imagery Guidelines', brandData.colors.primary);
    doc.moveDown();
    
    doc.fontSize(14)
       .text('Photography Style:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text('1. High-quality professional photography', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.fillColor('#EEEEEE')
       .rect(50, doc.y, 150, 100)
       .fill();
    doc.fillColor('#999999')
       .fontSize(8)
       .text('[Professional product shot]', 50, doc.y + 45, { width: 150, align: 'center' });
    
    doc.moveDown(3);
    doc.fontSize(12)
       .text('2. Consistent lighting and tone', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.fillColor('#EEEEEE')
       .rect(50, doc.y, 150, 100)
       .fill();
    doc.fillColor('#999999')
       .fontSize(8)
       .text('[Consistent color palette]', 50, doc.y + 45, { width: 150, align: 'center' });
    
    doc.moveDown(3);
    doc.fontSize(12)
       .text('3. Authentic human elements', { indent: 20 });
    
    doc.moveDown(0.5);
    doc.fillColor('#EEEEEE')
       .rect(50, doc.y, 150, 100)
       .fill();
    doc.fillColor('#999999')
       .fontSize(8)
       .text('[Authentic team photo]', 50, doc.y + 45, { width: 150, align: 'center' });
  }

  function addBrandVoiceSection(doc, brandData) {
    addSectionHeader(doc, '6. Brand Voice', brandData.colors.primary);
    doc.moveDown();
    
    doc.fontSize(14)
       .text('Tone Examples:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text('Appropriate:', { indent: 20, underline: true });
    doc.text('"We\'re excited to share our latest innovation that will transform your workflow."', 
         { indent: 40, font: brandData.fonts.body });
    
    doc.moveDown();
    doc.fontSize(12)
       .text('Inappropriate:', { indent: 20, underline: true });
    doc.text('"Yo, check out this dope new thing we made - it\'s sick!"', 
         { indent: 40, font: brandData.fonts.body });
    
    doc.moveDown(2);
    doc.fontSize(14)
       .text('Key Attributes:', { underline: true });
    
    doc.moveDown();
    doc.fontSize(12)
       .text('• Innovative - Showcase forward-thinking solutions', { indent: 30 });
    doc.text('• Reliable - Use concrete examples and data', { indent: 30 });
    doc.text('• Forward-thinking - Focus on future benefits', { indent: 30 });
  }

  function addTemplateSection(doc, brandData) {
    addSectionHeader(doc, '7. Adobe Express Templates', brandData.colors.primary);
    doc.moveDown();
    
    doc.fontSize(16)
       .fillColor(brandData.colors.primary)
       .text('Social Media Post Template', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .fillColor('#333333')
       .text('Perfect for: Instagram, Facebook, LinkedIn posts')
       .text(`Uses your ${brandData.colors.primary} primary color and ${brandData.fonts.heading} font`);
    
    doc.moveDown();
    doc.fillColor('#F0F8FF')
       .rect(50, doc.y, 250, 150)
       .fill();
    doc.fillColor(brandData.colors.primary)
       .rect(60, doc.y + 10, 230, 40)
       .fill();
    doc.fillColor('#FFFFFF')
       .font(brandData.fonts.heading)
       .fontSize(18)
       .text(brandData.brandName, 70, doc.y + 20);
    doc.fillColor('#333333')
       .font(brandData.fonts.body)
       .fontSize(12)
       .text('Share our latest news with your network!', 70, doc.y + 70);
    doc.fillColor(brandData.colors.secondary)
       .rect(70, doc.y + 100, 100, 30)
       .fill();
    doc.fillColor('#333333')
       .font(brandData.fonts.heading)
       .fontSize(12)
       .text('Learn More', 70, doc.y + 105, { width: 100, align: 'center' });
    
    doc.moveDown(4);
    
    checkAddPage(300);
    doc.fontSize(16)
       .fillColor(brandData.colors.primary)
       .text('Business Presentation Template', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text('Professional slides using your brand colors')
       .text(`Features ${brandData.colors.secondary} accents and clean ${brandData.fonts.body} typography`);
    
    doc.moveDown();
    doc.fillColor('#FFF5F5')
       .rect(50, doc.y, 250, 150)
       .fill();
    doc.fillColor(brandData.colors.primary)
       .rect(50, doc.y, 250, 30)
       .fill();
    doc.fillColor('#FFFFFF')
       .font(brandData.fonts.heading)
       .fontSize(14)
       .text(brandData.brandName, 60, doc.y + 5);
    doc.fillColor('#333333')
       .font(brandData.fonts.heading)
       .fontSize(18)
       .text('Q3 Results', 60, doc.y + 50);
    doc.fillColor(brandData.colors.secondary)
       .rect(60, doc.y + 80, 40, 4)
       .fill();
    doc.fillColor('#333333')
       .font(brandData.fonts.body)
       .fontSize(12)
       .text('Revenue Growth: 24%', 60, doc.y + 100);
    
    doc.moveDown(4);
    
    checkAddPage(300);
    doc.fontSize(16)
       .fillColor(brandData.colors.primary)
       .text('Marketing Flyer Template', { underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text('Eye-catching design that matches your brand')
       .text(`Combines ${brandData.colors.primary} and ${brandData.colors.secondary} for maximum impact`);
    
    doc.moveDown();
    doc.fillColor('#F5F0FF')
       .rect(50, doc.y, 250, 150)
       .fill();
    doc.fillColor(brandData.colors.secondary)
       .rect(50, doc.y, 250, 20)
       .fill();
    doc.fillColor(brandData.colors.primary)
       .font(brandData.fonts.heading)
       .fontSize(24)
       .text('SUMMER SALE', 60, doc.y + 40);
    doc.fillColor('#333333')
       .font(brandData.fonts.body)
       .fontSize(14)
       .text('20% OFF ALL PRODUCTS', 60, doc.y + 80);
    doc.fillColor(brandData.colors.primary)
       .rect(60, doc.y + 110, 120, 30)
       .fill();
    doc.fillColor('#FFFFFF')
       .font(brandData.fonts.heading)
       .fontSize(14)
       .text('SHOP NOW', 60, doc.y + 115, { width: 120, align: 'center' });
    
    doc.moveDown(2);
    doc.fontSize(10)
       .text('* These templates are automatically matched to your brand and available in your Adobe Express account.', 
            { indent: 20, lineGap: 1.5 });
  }

  function addPageNumbers(doc, brandData) {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      
      if (doc.y < doc.page.height - 50) {
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`${brandData.brandName} Brand Guidelines`, 50, doc.page.height - 30)
           .text(`Page ${i + 1} of ${range.count}`, doc.page.width - 50, doc.page.height - 30, { 
             align: 'right' 
           });
        
        doc.moveTo(50, doc.page.height - 40)
           .lineTo(doc.page.width - 50, doc.page.height - 40)
           .lineWidth(0.5)
           .strokeColor('#CCCCCC')
           .stroke();
      }
    }
  }
}

module.exports = { generateBrandPDF };