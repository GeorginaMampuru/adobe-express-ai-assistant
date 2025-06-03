const PDFDocument = require('pdfkit');
const fs = require('fs');

// Comprehensive Mock Data
const mockBrandData = {
  brandName: "ELPEAP GROUP",
  tagline: "Innovating Tomorrow's Solutions Today",
  version: "1.0",
  dateCreated: new Date().toLocaleDateString(),
  colors: {
    primary: "#2A5CAA",
    secondary: "#F4B223",
    accent: "#E74C3C",
    dark: "#2C3E50",
    light: "#ECF0F1"
  },
  fonts: {
    heading: "Helvetica-Bold",
    body: "Helvetica",
    accent: "Helvetica-Oblique"
  },
  logo: {
    analysis: "Modern, geometric style with clean lines representing innovation and stability. The triangular elements suggest growth and direction.",
    usage: {
      clearspace: "Minimum 20px clearance around logo",
      sizes: ["Full color", "Monochrome", "Reverse"],
      incorrectUsage: ["Don't stretch", "Don't recolor", "Don't rotate"]
    }
  },
  typography: {
    headingSizes: {
      h1: 32,
      h2: 24,
      h3: 20
    },
    bodySizes: {
      normal: 14,
      small: 12
    }
  },
  imagery: {
    style: "High-quality professional photography with warm tones",
    composition: "Use of negative space, human elements, and technology"
  },
  brandVoice: {
    tone: "Professional yet approachable",
    attributes: ["Innovative", "Reliable", "Forward-thinking"]
  },
  contact: {
    email: "brand@elpeapgroup.co.za",
    phone: "078 140 7749"
  }
};

function generateBrandPDF(brandData, outputPath) {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true,
    info: {
      Title: `${brandData.brandName} Brand Guidelines`,
      Author: "ELPEAP Creative Team",
      Keywords: "brand,guidelines,design"
    }
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // ========== COVER PAGE ==========
  doc.fillColor(brandData.colors.primary)
     .rect(0, 0, doc.page.width, 120)
     .fill();
  
  doc.fillColor('#FFFFFF')
     .fontSize(28)
     .text(brandData.brandName, 50, 50, { lineBreak: false });
  
  doc.fillColor(brandData.colors.secondary)
     .fontSize(16)
     .text(brandData.tagline, 50, 85);
  
  doc.fillColor('#333333')
     .fontSize(12)
     .text(`Version ${brandData.version} | ${brandData.dateCreated}`, 50, 750);
  
  doc.addPage();

  // ========== TABLE OF CONTENTS ==========
  doc.fontSize(18)
     .fillColor(brandData.colors.primary)
     .text('Table of Contents', 50, 50);
  
  doc.moveDown();
  doc.fontSize(12)
     .fillColor('#333333')
     .text('1. Introduction..........................3', { indent: 20 })
     .text('2. Brand Colors........................4', { indent: 20 })
     .text('3. Typography..........................5', { indent: 20 })
     .text('4. Logo Usage..........................6', { indent: 20 })
     .text('5. Imagery Guidelines..................7', { indent: 20 })
     .text('6. Brand Voice........................8', { indent: 20 })
     .text('7. Contact Information................9', { indent: 20 });
  
  doc.addPage();

  // ========== INTRODUCTION ==========
  doc.fontSize(22)
     .fillColor(brandData.colors.primary)
     .text('1. Introduction', 50, 50);
  
  doc.moveDown();
  doc.fontSize(12)
     .fillColor('#333333')
     .text(`Welcome to the ${brandData.brandName} Brand Guidelines. This document serves as the foundation for all visual and verbal communications representing our brand.`, {
       lineGap: 5,
       paragraphGap: 10
     })
     .text(`Our brand identity is built on the principles of ${brandData.brandVoice.attributes.join(', ')}. These guidelines ensure consistency across all touchpoints.`, {
       lineGap: 5
     });
  
  doc.addPage();

  // ========== BRAND COLORS ==========
  doc.fontSize(22)
     .fillColor(brandData.colors.primary)
     .text('2. Brand Colors', 50, 50);
  
  doc.moveDown();
  doc.fontSize(14)
     .text('Primary Color Palette', { underline: true });
  
  doc.moveDown(0.5);
  const colors = brandData.colors;
  const squareSize = 60;
  const gap = 30;
  const startX = 50;
  const startY = doc.y;

  Object.keys(colors).forEach((key, i) => {
    const x = startX + (i % 3 * (squareSize + gap + 120));
    const y = startY + Math.floor(i / 3) * (squareSize + gap);
    
    doc.rect(x, y, squareSize, squareSize)
       .fill(colors[key]);
    
    doc.fontSize(10)
       .fillColor('#333333')
       .text(key.toUpperCase(), x, y + squareSize + 10)
       .text(colors[key], x, y + squareSize + 25);
  });

  doc.moveDown(6);

  // Color usage guidelines
  doc.fontSize(14)
     .text('Color Application', { underline: true });
  
  doc.moveDown();
  doc.fontSize(12)
     .text('Primary Color:', { continued: true })
     .fillColor(brandData.colors.primary)
     .text(' Use for primary actions and key brand elements', { underline: true });
  
  doc.fillColor('#333333')
     .text('Secondary Color:', { continued: true })
     .fillColor(brandData.colors.secondary)
     .text(' Use for secondary actions and highlights', { underline: true });
  
  doc.fillColor('#333333')
     .text('Accent Color:', { continued: true })
     .fillColor(brandData.colors.accent)
     .text(' Use sparingly for alerts and important notices', { underline: true });
  
  doc.addPage();

  // ========== TYPOGRAPHY ==========
  doc.fontSize(22)
     .fillColor(brandData.colors.primary)
     .text('3. Typography', 50, 50);
  
  doc.moveDown();
  
  // Heading styles
  doc.fontSize(14)
     .text('Heading Styles', { underline: true });
  
  doc.moveDown();
  doc.font(brandData.fonts.heading)
     .fillColor(brandData.colors.primary)
     .fontSize(brandData.typography.headingSizes.h1)
     .text('Heading 1', { indent: 20 });
  
  doc.font(brandData.fonts.heading)
     .fillColor('#333333')
     .fontSize(brandData.typography.headingSizes.h2)
     .text('Heading 2', { indent: 20 });
  
  doc.font(brandData.fonts.heading)
     .fillColor('#666666')
     .fontSize(brandData.typography.headingSizes.h3)
     .text('Heading 3', { indent: 20 });
  
  doc.moveDown(2);
  
  // Body text
  doc.fontSize(14)
     .fillColor('#333333')
     .text('Body Text', { underline: true });
  
  doc.moveDown();
  doc.font(brandData.fonts.body)
     .fontSize(brandData.typography.bodySizes.normal)
     .text('This is normal body text. Use for paragraphs and general content.', { indent: 20 });
  
  doc.moveDown();
  doc.font(brandData.fonts.body)
     .fontSize(brandData.typography.bodySizes.small)
     .text('This is small body text. Use for captions and secondary information.', { indent: 20 });
  
  doc.moveDown(2);
  
  // Font pairing examples
  doc.fontSize(14)
     .text('Recommended Pairings', { underline: true });
  
  doc.moveDown();
  doc.font(brandData.fonts.heading)
     .fontSize(16)
     .fillColor(brandData.colors.primary)
     .text('Heading in Primary Color', { indent: 20 });
  
  doc.font(brandData.fonts.body)
     .fontSize(12)
     .fillColor('#333333')
     .text('Paired with body text in dark gray for optimal readability and visual hierarchy.', { indent: 20 });
  
  doc.addPage();

  // ========== LOGO USAGE ==========
  doc.fontSize(22)
     .fillColor(brandData.colors.primary)
     .text('4. Logo Usage', 50, 50);
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.logo.analysis, { lineGap: 5 });
  
  doc.moveDown();
  doc.fontSize(14)
     .text('Clear Space Requirements', { underline: true });
  
  doc.moveDown();
  doc.fontSize(12)
     .text(`Maintain minimum ${brandData.logo.usage.clearspace} around the logo at all times.`);
  
  doc.moveDown(2);
  doc.fontSize(14)
     .text('Correct Usage', { underline: true });
  
  doc.moveDown();
  brandData.logo.usage.sizes.forEach(size => {
    doc.text(`• ${size} version`, { indent: 30 });
  });
  
  doc.moveDown(2);
  doc.fontSize(14)
     .text('Incorrect Usage', { underline: true });
  
  doc.moveDown();
  brandData.logo.usage.incorrectUsage.forEach(usage => {
    doc.text(`• ${usage}`, { indent: 30 });
  });
  
  doc.addPage();

  // ========== IMAGERY GUIDELINES ==========
  doc.fontSize(22)
     .fillColor(brandData.colors.primary)
     .text('5. Imagery Guidelines', 50, 50);
  
  doc.moveDown();
  doc.fontSize(14)
     .text('Style', { underline: true });
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.imagery.style, { lineGap: 5 });
  
  doc.moveDown();
  doc.fontSize(14)
     .text('Composition', { underline: true });
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.imagery.composition, { lineGap: 5 });
  
  doc.addPage();

  // ========== BRAND VOICE ==========
  doc.fontSize(22)
     .fillColor(brandData.colors.primary)
     .text('6. Brand Voice', 50, 50);
  
  doc.moveDown();
  doc.fontSize(14)
     .text('Tone', { underline: true });
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.brandVoice.tone, { lineGap: 5 });
  
  doc.moveDown();
  doc.fontSize(14)
     .text('Key Attributes', { underline: true });
  
  doc.moveDown();
  brandData.brandVoice.attributes.forEach(attr => {
    doc.text(`• ${attr}`, { indent: 30 });
  });
  
  doc.addPage();

  // ========== CONTACT INFORMATION ==========
  doc.fontSize(22)
     .fillColor(brandData.colors.primary)
     .text('7. Contact Information', 50, 50);
  
  doc.moveDown();
  doc.fontSize(14)
     .text('Brand Team', { underline: true });
  
  doc.moveDown();
  doc.fontSize(12)
     .text(`For brand-related inquiries and asset requests, please contact:`, { lineGap: 5 });
  
  doc.moveDown();
  doc.text(`Email: ${brandData.contact.email}`);
  doc.text(`Phone: ${brandData.contact.phone}`);
  
  // ========== PAGE NUMBERS ==========
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`${brandData.brandName} Brand Guidelines`, 50, 800)
       .text(`Page ${i + 1} of ${range.count}`, 500, 800, { align: 'right' });
  }

  doc.end();
}

generateBrandPDF(mockBrandData, './elpeap_brand_guidelines.pdf');
console.log('Brand guidelines PDF generated successfully!');