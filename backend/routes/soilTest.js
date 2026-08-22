const express = require('express');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const { protect } = require('../middleware/authMiddleware');
const SoilBooking = require('../models/SoilBooking');
const SoilReport = require('../models/SoilReport');
const { analyzeSoil } = require('../utils/soilAnalyzer');
const { extractParamsWithAI, generateFarmerSummary, extractParamsFromText } = require('../utils/aiSoilExtractor');

const router = express.Router();

// Multer config: store PDFs in memory, max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

// ─── BOOKING ROUTES ────────────────────────────────────────

// POST /api/soil-test/book
router.post('/book', protect, async (req, res) => {
  try {
    const { preferredDate, timeSlot, village, district, state, phone, landAreaAcres, notes } = req.body;

    // Validate required fields
    if (!preferredDate || !timeSlot || !village || !district || !state || !phone) {
      return res.status(400).json({ message: 'All required fields must be filled: preferredDate, timeSlot, village, district, state, phone' });
    }

    // Validate time slot
    const validSlots = ['Morning (8am-12pm)', 'Afternoon (12pm-4pm)', 'Evening (4pm-6pm)'];
    if (!validSlots.includes(timeSlot)) {
      return res.status(400).json({ message: 'Invalid time slot' });
    }

    // Reject past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(preferredDate);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'Cannot book a soil test for a past date' });
    }

    const booking = await SoilBooking.create({
      user: req.user._id,
      preferredDate: selectedDate,
      timeSlot,
      village: village.trim(),
      district: district.trim(),
      state: state.trim(),
      phone: phone.trim(),
      landAreaAcres: landAreaAcres || null,
      notes: notes || '',
    });

    res.status(201).json({ message: 'Soil test booked successfully', booking });
  } catch (error) {
    console.error('Booking error:', error.message);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

// GET /api/soil-test/my-bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await SoilBooking.find({ user: req.user._id })
      .sort({ preferredDate: -1 })
      .lean();
    res.json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error.message);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// ─── ANALYSIS ROUTES ───────────────────────────────────────

// POST /api/soil-test/analyze
router.post('/analyze', protect, upload.single('report'), async (req, res) => {
  try {
    let params = {};
    let source = 'manual';
    let originalFileName = '';

    if (req.file) {
      // ── PDF upload flow ──
      source = 'pdf';
      originalFileName = req.file.originalname || 'report.pdf';

      // Extract text from PDF
      const parser = new PDFParse({ data: req.file.buffer });
      const pdfData = await parser.getText();
      await parser.destroy();
      const rawText = pdfData.text;

      if (!rawText || rawText.trim().length < 20) {
        return res.status(422).json({
          message: 'Could not extract readable text from the PDF. The file may be scanned/image-based. Please try manual entry instead.',
        });
      }

      // Try AI extraction first, fall back to regex
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          params = await extractParamsWithAI(rawText);
        } catch (aiError) {
          console.error('AI extraction failed, falling back to regex:', aiError.message);
          params = extractParamsFromText(rawText);
        }
      } else {
        params = extractParamsFromText(rawText);
      }

      if (Object.keys(params).length === 0) {
        return res.status(422).json({
          message: 'Could not extract any soil parameters from this PDF. Please try manual entry instead.',
        });
      }
    } else {
      // ── Manual entry flow ──
      const manualParams = req.body.parameters || req.body;
      const VALID_KEYS = ['pH', 'nitrogen', 'phosphorus', 'potassium', 'organicCarbon', 'ec', 'sulphur', 'zinc', 'iron', 'manganese', 'copper', 'boron'];

      for (const key of VALID_KEYS) {
        const val = manualParams[key];
        if (val !== null && val !== undefined && val !== '' && !isNaN(val)) {
          params[key] = parseFloat(val);
        }
      }

      if (Object.keys(params).length === 0) {
        return res.status(400).json({ message: 'Please provide at least one soil parameter' });
      }
    }

    // Run analysis
    const analysis = analyzeSoil(params);

    // Generate AI farmer summary (non-fatal)
    let farmerSummary = '';
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && analysis.length > 0) {
      try {
        farmerSummary = await generateFarmerSummary(analysis);
      } catch (summaryError) {
        console.error('Farmer summary generation failed:', summaryError.message);
      }
    }

    // Save report
    const report = await SoilReport.create({
      user: req.user._id,
      source,
      originalFileName,
      parameters: params,
      analysis,
      farmerSummary,
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error('Soil analysis error:', error.message);
    if (error.message === 'Only PDF files are accepted') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to analyze soil data', error: error.message });
  }
});

// GET /api/soil-test/my-reports
router.get('/my-reports', protect, async (req, res) => {
  try {
    const reports = await SoilReport.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (error) {
    console.error('Fetch reports error:', error.message);
    res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
});

module.exports = router;
