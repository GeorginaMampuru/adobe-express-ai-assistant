const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Enhanced Mock Data with more brand elements
const mockBrandData = {
  brandName: "ELPEAP GROUP",
  tagline: "Innovating Tomorrow's Solutions Today",
  version: "1.0",
  dateCreated: new Date().toLocaleDateString('en-ZA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  colors: {
    primary: "#2A5CAA",
    secondary: "#F4B223",
    accent: "#E74C3C",
    dark: "#2C3E50",
    light: "#ECF0F1",
    gradients: {
      primary: ["#2A5CAA", "#3A7BDA"],
      accent: ["#E74C3C", "#EB6F5E"]
    }
  },
  fonts: {
    heading: "Helvetica-Bold",
    body: "Helvetica",
    accent: "Helvetica-Oblique",
    pairingExamples: [
      "Helvetica-Bold + Helvetica",
      "Helvetica-Bold + Georgia"
    ]
  },
  logo: {
    analysis: "Modern, geometric style with clean lines representing innovation and stability. The triangular elements suggest growth and direction.",
    usage: {
      clearspace: "Minimum 20px clearance around logo",
      sizes: ["Full color", "Monochrome", "Reverse"],
      incorrectUsage: ["Don't stretch", "Don't recolor", "Don't rotate"],
      placement: {
        digital: "Top left corner",
        print: "Minimum 10mm from edges"
      }
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
    },
    lineHeight: 1.5,
    paragraphSpacing: 15
  },
  imagery: {
    style: "High-quality professional photography with warm tones",
    composition: "Use of negative space, human elements, and technology",
    examples: [
      "Team collaboration shots",
      "Technology close-ups",
      "Abstract patterns"
    ]
  },
  brandVoice: {
    tone: "Professional yet approachable",
    attributes: ["Innovative", "Reliable", "Forward-thinking"],
    messagingExamples: {
      formal: "ELPEAP Group delivers cutting-edge solutions...",
      casual: "We're excited to innovate with you..."
    }
  },
  contact: {
    email: "brand@elpeapgroup.co.za",
    phone: "078 140 7749",
    social: {
      linkedin: "linkedin.com/company/elpeap",
      twitter: "@elpeap_group"
    }
  }
};

function generateBrandPDF(brandData, outputPath) {
  // Create output directory if it doesn't exist
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
      Author: "ELPEAP Creative Team",
      Keywords: "brand,guidelines,design",
      CreationDate: new Date()
    }
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // ========== COVER PAGE ==========
  // Header background
  doc.fillColor(brandData.colors.primary)
     .rect(0, 0, doc.page.width, 120)
     .fill();
  
  // Brand name
  doc.fillColor('#FFFFFF')
     .fontSize(28)
     .text(brandData.brandName, 50, 50, { 
       lineBreak: false,
       characterSpacing: 0.5 
     });
  
  // Tagline
  doc.fillColor(brandData.colors.secondary)
     .fontSize(16)
     .text(brandData.tagline, 50, 85, {
       characterSpacing: 0.2
     });
  
  // Version and date
  doc.fillColor('#333333')
     .fontSize(10)
     .text(`Version ${brandData.version} | ${brandData.dateCreated}`, 50, 750, {
       align: 'left'
     });
  
  doc.addPage();

  // ========== TABLE OF CONTENTS ==========
  addSectionHeader(doc, 'Table of Contents', brandData.colors.primary);
  
  const tocItems = [
    { title: 'Introduction', page: 3 },
    { title: 'Brand Colors', page: 4 },
    { title: 'Typography', page: 5 },
    { title: 'Logo Usage', page: 6 },
    { title: 'Imagery Guidelines', page: 7 },
    { title: 'Brand Voice', page: 8 },
    { title: 'Contact Information', page: 9 }
  ];

  doc.moveDown();
  tocItems.forEach(item => {
    doc.fontSize(12)
       .fillColor('#333333')
       .text(`${item.title.padEnd(30, '.')}${item.page}`, { 
         indent: 20,
         paragraphGap: 5
       });
  });
  
  doc.addPage();

  // ========== INTRODUCTION ==========
  addSectionHeader(doc, '1. Introduction', brandData.colors.primary);
  
  doc.moveDown();
  doc.fontSize(12)
     .fillColor('#333333')
     .text(`Welcome to the ${brandData.brandName} Brand Guidelines. This document serves as the foundation for all visual and verbal communications representing our brand.`, {
       lineGap: brandData.typography.lineHeight,
       paragraphGap: brandData.typography.paragraphSpacing
     })
     .text(`Our brand identity is built on the principles of ${brandData.brandVoice.attributes.join(', ')}. These guidelines ensure consistency across all touchpoints including:`, {
       lineGap: brandData.typography.lineHeight
     });
  
  doc.moveDown();
  [
    'Digital platforms (website, social media)',
    'Print materials (brochures, business cards)',
    'Presentations and marketing collateral',
    'Product packaging and merchandise'
  ].forEach(item => {
    doc.text(`• ${item}`, { indent: 30 });
  });
  
  doc.addPage();

  // ========== BRAND COLORS ==========
  addSectionHeader(doc, '2. Brand Colors', brandData.colors.primary);
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Primary Color Palette');
  
  doc.moveDown(0.5);
  const colors = brandData.colors;
  const squareSize = 60;
  const gap = 30;
  const startX = 50;
  const startY = doc.y;

  // Display color swatches in a grid
  Object.keys(colors).filter(key => !['gradients'].includes(key)).forEach((key, i) => {
    const x = startX + (i % 3 * (squareSize + gap + 120));
    const y = startY + Math.floor(i / 3) * (squareSize + gap + 30);
    
    // Color swatch
    doc.rect(x, y, squareSize, squareSize)
       .fill(colors[key]);
    
    // Color name and value
    doc.fontSize(10)
       .fillColor('#333333')
       .text(key.toUpperCase(), x, y + squareSize + 10, {
         width: squareSize,
         align: 'center'
       })
       .text(colors[key], x, y + squareSize + 25, {
         width: squareSize,
         align: 'center'
       });
  });

  doc.moveDown(6);

  // Color usage guidelines
  addSubsectionHeader(doc, 'Color Application');
  
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
  
  // Add gradient examples if they exist
  if (brandData.colors.gradients) {
    doc.moveDown(2);
    addSubsectionHeader(doc, 'Gradient Applications');
    
    doc.moveDown();
    Object.keys(brandData.colors.gradients).forEach(gradient => {
      const [start, end] = brandData.colors.gradients[gradient];
      doc.text(`• ${gradient} gradient: ${start} → ${end}`, { indent: 30 });
    });
  }
  
  doc.addPage();

  // ========== TYPOGRAPHY ==========
  addSectionHeader(doc, '3. Typography', brandData.colors.primary);
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Heading Styles');
  
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
  addSubsectionHeader(doc, 'Body Text');
  
  doc.moveDown();
  doc.font(brandData.fonts.body)
     .fontSize(brandData.typography.bodySizes.normal)
     .text('This is normal body text. Use for paragraphs and general content. Maintain consistent line height and spacing for optimal readability.', { 
       indent: 20,
       lineGap: brandData.typography.lineHeight
     });
  
  doc.moveDown();
  doc.font(brandData.fonts.body)
     .fontSize(brandData.typography.bodySizes.small)
     .text('This is small body text. Use for captions, footnotes, and secondary information. Should be legible at smaller sizes.', { 
       indent: 20,
       lineGap: brandData.typography.lineHeight
     });
  
  doc.moveDown(2);
  
  // Font pairing examples
  if (brandData.fonts.pairingExamples) {
    addSubsectionHeader(doc, 'Recommended Pairings');
    
    doc.moveDown();
    brandData.fonts.pairingExamples.forEach(pairing => {
      doc.text(`• ${pairing}`, { indent: 30 });
    });
  }
  
  doc.addPage();

  // ========== LOGO USAGE ==========
  addSectionHeader(doc, '4. Logo Usage', brandData.colors.primary);
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.logo.analysis, { 
       lineGap: brandData.typography.lineHeight 
     });
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Clear Space Requirements');
  
  doc.moveDown();
  doc.fontSize(12)
     .text(`Maintain minimum ${brandData.logo.usage.clearspace} around the logo at all times. This ensures visibility and prevents visual clutter.`);
  
  doc.moveDown(2);
  addSubsectionHeader(doc, 'Correct Usage');
  
  doc.moveDown();
  brandData.logo.usage.sizes.forEach(size => {
    doc.text(`• ${size} version`, { indent: 30 });
  });
  
  // Logo placement guidelines
  if (brandData.logo.usage.placement) {
    doc.moveDown();
    addSubsectionHeader(doc, 'Placement Guidelines');
    
    doc.moveDown();
    Object.keys(brandData.logo.usage.placement).forEach(medium => {
      doc.text(`• ${medium}: ${brandData.logo.usage.placement[medium]}`, { indent: 30 });
    });
  }
  
  doc.moveDown(2);
  addSubsectionHeader(doc, 'Incorrect Usage');
  
  doc.moveDown();
  brandData.logo.usage.incorrectUsage.forEach(usage => {
    doc.text(`• ${usage}`, { indent: 30 });
  });
  
  doc.addPage();

  // ========== IMAGERY GUIDELINES ==========
  addSectionHeader(doc, '5. Imagery Guidelines', brandData.colors.primary);
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Style');
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.imagery.style, { 
       lineGap: brandData.typography.lineHeight 
     });
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Composition');
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.imagery.composition, { 
       lineGap: brandData.typography.lineHeight 
     });
  
  // Image examples
  if (brandData.imagery.examples) {
    doc.moveDown();
    addSubsectionHeader(doc, 'Recommended Subjects');
    
    doc.moveDown();
    brandData.imagery.examples.forEach(example => {
      doc.text(`• ${example}`, { indent: 30 });
    });
  }
  
  doc.addPage();

  // ========== BRAND VOICE ==========
  addSectionHeader(doc, '6. Brand Voice', brandData.colors.primary);
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Tone');
  
  doc.moveDown();
  doc.fontSize(12)
     .text(brandData.brandVoice.tone, { 
       lineGap: brandData.typography.lineHeight 
     });
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Key Attributes');
  
  doc.moveDown();
  brandData.brandVoice.attributes.forEach(attr => {
    doc.text(`• ${attr}`, { indent: 30 });
  });
  
  // Messaging examples
  if (brandData.brandVoice.messagingExamples) {
    doc.moveDown();
    addSubsectionHeader(doc, 'Messaging Examples');
    
    doc.moveDown();
    Object.keys(brandData.brandVoice.messagingExamples).forEach(context => {
      doc.fontSize(12)
         .fillColor('#333333')
         .text(`${context}:`, { indent: 20 });
      
      doc.fontSize(11)
         .fillColor('#555555')
         .text(`"${brandData.brandVoice.messagingExamples[context]}"`, {
           indent: 40,
           paragraphGap: 10
         });
    });
  }
  
  doc.addPage();

  // ========== CONTACT INFORMATION ==========
  addSectionHeader(doc, '7. Contact Information', brandData.colors.primary);
  
  doc.moveDown();
  addSubsectionHeader(doc, 'Brand Team');
  
  doc.moveDown();
  doc.fontSize(12)
     .text(`For brand-related inquiries and asset requests, please contact:`, { 
       lineGap: brandData.typography.lineHeight 
     });
  
  doc.moveDown();
  doc.text(`Email: ${brandData.contact.email}`);
  doc.text(`Phone: ${brandData.contact.phone}`);
  
  // Social media contacts
  if (brandData.contact.social) {
    doc.moveDown();
    addSubsectionHeader(doc, 'Social Media');
    
    doc.moveDown();
    Object.keys(brandData.contact.social).forEach(platform => {
      doc.text(`• ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${brandData.contact.social[platform]}`);
    });
  }
  
  // ========== PAGE NUMBERS ==========
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    
    // Footer with page numbers
    doc.fontSize(10)
       .fillColor('#666666')
       .text(`${brandData.brandName} Brand Guidelines`, 50, 800, {
         align: 'left'
       })
       .text(`Page ${i + 1} of ${range.count}`, 500, 800, { 
         align: 'right' 
       });
    
    // Add subtle border
    doc.moveTo(50, 790)
       .lineTo(550, 790)
       .lineWidth(0.5)
       .strokeColor('#CCCCCC')
       .stroke();
  }

  doc.end();

  // Helper functions for consistent headers
  function addSectionHeader(doc, text, color) {
    doc.fontSize(22)
       .fillColor(color)
       .text(text, 50, 50);
    
    // Add decorative underline
    doc.moveTo(50, 75)
       .lineTo(150, 75)
       .lineWidth(2)
       .strokeColor(color)
       .stroke();
  }
  
  function addSubsectionHeader(doc, text) {
    doc.fontSize(14)
       .fillColor('#333333')
       .text(text, { 
         underline: true,
         paragraphGap: 5
       });
  }
}

// Generate the PDF
const outputPath = path.join(__dirname, 'output', 'elpeap_brand_guidelines.pdf');
generateBrandPDF(mockBrandData, outputPath);

console.log(`Brand guidelines PDF generated at: ${outputPath}`);