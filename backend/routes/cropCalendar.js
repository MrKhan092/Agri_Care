const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Farm = require('../models/Farm');
const cropTimelines = require('../data/cropTimelines');
const { generateCropTimelineWithAI } = require('../utils/aiCropTimeline');

const router = express.Router();

// In-memory cache for AI-generated timelines
const aiCache = new Map();

// GET /api/crop-calendar/:cropId
router.get('/:cropId', protect, async (req, res) => {
  try {
    const farm = await Farm.findOne({ user: req.user._id });
    if (!farm) {
      return res.status(404).json({ message: 'No farm profile found. Create one first.' });
    }

    const crop = farm.crops.id(req.params.cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found in your farm profile' });
    }

    const cropNameLower = crop.name.toLowerCase().trim();
    let stages = null;
    let source = 'static';

    // 1. Check static database
    if (cropTimelines[cropNameLower]) {
      stages = cropTimelines[cropNameLower];
    }

    // 2. Check AI cache
    if (!stages && aiCache.has(cropNameLower)) {
      stages = aiCache.get(cropNameLower);
      source = 'ai-cached';
    }

    // 3. Try AI fallback
    if (!stages) {
      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          stages = await generateCropTimelineWithAI(crop.name);
          source = 'ai';
          aiCache.set(cropNameLower, stages); // cache for future requests
        } catch (aiError) {
          console.error('AI crop timeline failed:', aiError.message);
        }
      }
    }

    if (!stages || stages.length === 0) {
      return res.status(422).json({
        message: `Care timeline is not yet available for "${crop.name}". We're working on adding more crops.`,
      });
    }

    // Calculate actual dates and status for each stage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sowingDate = new Date(crop.sowingDate);

    const timeline = stages.map((stage) => {
      const targetDate = new Date(sowingDate);
      targetDate.setDate(targetDate.getDate() + stage.daysFromSowing);
      targetDate.setHours(0, 0, 0, 0);

      let status = 'upcoming';
      if (targetDate.getTime() === today.getTime()) {
        status = 'due-today';
      } else if (targetDate < today) {
        status = 'completed';
      }

      return {
        ...stage,
        targetDate: targetDate.toISOString(),
        status,
      };
    });

    res.json({
      crop: {
        _id: crop._id,
        name: crop.name,
        variety: crop.variety,
        areaAcres: crop.areaAcres,
        sowingDate: crop.sowingDate,
        expectedHarvestDate: crop.expectedHarvestDate,
        status: crop.status,
      },
      source,
      timeline,
    });
  } catch (error) {
    console.error('Crop calendar error:', error.message);
    res.status(500).json({ message: 'Failed to load crop calendar', error: error.message });
  }
});

module.exports = router;
