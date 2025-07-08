const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { createWorker } = require('tesseract.js');
const { generateBrandPDF } = require('./pdfGenerator.js');
const { spawn } = require('child_process');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');

// Jimp initialization with fallback
let Jimp;

(async () => {
  try {
    Jimp = require('jimp');
    if (Jimp.default) {
      Jimp = Jimp.default;
    }

    if (typeof Jimp.read !== 'function') {
      throw new Error('Jimp.read is not a function. Check Jimp version.');
    }

    // Test with a minimal operation
    const testImage = new Jimp(1, 1, 0xffffffff); // 1x1 white image
    await testImage.getBufferAsync(Jimp.MIME_PNG);
    console.log('Jimp initialized successfully');
  } catch (err) {
    console.error('Jimp initialization failed:', err);
    console.error('Please make sure Jimp is properly installed by running:');
    console.error('npm install jimp@0.22.10');
    process.exit(1);
  }
})();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

app.use(express.static(path.join(__dirname, 'public')));

const ensureDirectories = async () => {
  const directories = ['uploads', 'generated', 'public'];
  await Promise.all(directories.map(async dir => {
    try {
      await fs.mkdir(path.join(__dirname, dir), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }));
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, validMimes.includes(file.mimetype));
  }
});

ensureDirectories().catch(err => {
  console.error('Directory initialization failed:', err);
  process.exit(1);
});

async function runColorAnalysisScript(imagePath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('/nix/store/w6ipvqir3vbsclczpv0nmz2n7l4l5rp1-python3-3.11.8-env/bin/python', [
      '-u',
      path.join(__dirname, 'analyze_colors.py'),
      imagePath
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => output += data.toString());
    pythonProcess.stderr.on('data', (data) => errorOutput += data.toString());

    pythonProcess.on('error', (err) => {
      console.error('Python process error:', err);
      reject(new Error('Color analysis failed to start'));
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}\nError: ${errorOutput}`);
        return reject(new Error(`Color analysis failed with exit code ${code}`));
      }

      try {
        resolve(JSON.parse(output));
      } catch (parseError) {
        console.error('Output parse error:', parseError, '\nOutput:', output);
        reject(new Error('Invalid analysis results format'));
      }
    });

    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Color analysis timed out'));
    }, 30000);
  });
}

app.post('/api/analyze/colors', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const analysisResult = await runColorAnalysisScript(req.file.path);
    
    if (!analysisResult.colors || !Array.isArray(analysisResult.colors)) {
      throw new Error('Invalid color analysis results');
    }

    res.json({
      success: true,
      data: {
        palette: analysisResult.colors,
        percentages: analysisResult.percentages || [],
        rgb_values: analysisResult.rgb_values || []
      }
    });

  } catch (error) {
    console.error('Color analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Color analysis failed',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  } finally {
    if (req.file) cleanupFiles([req.file]).catch(console.error);
  }
});

app.post('/api/analyze/fonts', upload.single('image'), async (req, res) => {
  let worker;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const image = await Jimp.read(req.file.path);
    const processedBuffer = await image
      .greyscale()
      .contrast(0.5)
      .getBufferAsync(Jimp.MIME_PNG);

    worker = await createWorker();
    const { data } = await worker.recognize(processedBuffer);
    const lines = data.lines || [];
    res.json({
 success: true,
 data: {
        fonts: {
          heading: lines.length > 0 ? 'Helvetica-Bold' : 'Helvetica',
          body: lines.length > 1 ? 'Helvetica' : 'Arial'
        },
        textAnalysis: {
          totalLines: lines.length,
          totalWords: data.words?.length || 0,
          confidence: data.confidence || 0
        },
        extractedText: data.text
      }
    });

  } catch (error) {
    console.error('Font detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Font analysis failed',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  } finally {
    if (worker) await worker.terminate().catch(console.error);
    if (req.file) cleanupFiles([req.file]).catch(console.error);
  }
});


app.post('/api/generate-brand-kit', upload.array('images', 10), async (req, res) => {
  const files = req.files || [];
  try {
    if (files.length < 3) {
      return res.status(400).json({ success: false, error: 'At least 3 images are required' });
    }

    const brandName = req.body.brandName?.trim() || 'Our Brand';
    if (brandName.length > 50) {
      return res.status(400).json({ success: false, error: 'Brand name must be ≤50 characters' });
    }

    let colorAnalysis;
    try {
      colorAnalysis = await runColorAnalysisScript(files[0].path);
    } catch (colorError) {
      console.warn('Color extraction failed, using defaults:', colorError);
    }

    const brandData = {
      brandName,
      tagline: req.body.tagline?.trim() || 'Innovating tomorrow',
      colors: {
        primary: req.body.primaryColor || colorAnalysis?.colors?.[0] || '#2A5CAA',
        secondary: req.body.secondaryColor || colorAnalysis?.colors?.[1] || '#F4B223',
        accent: req.body.accentColor || colorAnalysis?.colors?.[2] || '#E74C3C'
      },
      fonts: {
        heading: req.body.headingFont || "Helvetica-Bold",
        body: req.body.bodyFont || "Helvetica"
      }
    };

    const pdfFilename = `brand-kit-${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, 'generated', pdfFilename);
    await generateBrandPDF(brandData, pdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${pdfFilename}`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    fileStream.on('close', () => cleanupFiles(files, pdfPath).catch(console.error));
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      cleanupFiles(files, pdfPath).catch(console.error);
      res.status(500).end();
    });

  } catch (error) {
    console.error('Brand kit generation error:', error);
    await cleanupFiles(files);
    res.status(500).json({
      success: false,
      error: 'Brand kit generation failed',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

async function cleanupFiles(files = [], pdfPath = null) {
  try {
    await Promise.all([
      ...files.map(file => fs.unlink(file.path).catch(console.error)),
      ...(pdfPath ? [fs.unlink(pdfPath).catch(console.error)] : [])
    ]);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;
