const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Farm = require('../models/Farm');

const router = express.Router();

// GET /api/farm — get logged-in user's farm
router.get('/', protect, async (req, res) => {
  try {
    const farm = await Farm.findOne({ user: req.user._id }).lean();
    if (!farm) {
      return res.status(404).json({ message: 'No farm profile found. Create one to get started!' });
    }
    res.json({ farm });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch farm profile', error: error.message });
  }
});

// POST /api/farm — create farm profile
router.post('/', protect, async (req, res) => {
  try {
    const existing = await Farm.findOne({ user: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'Farm profile already exists. Use PUT to update.' });
    }

    const { farmName, totalAreaAcres, village, district, state, soilType, irrigationSource } = req.body;

    if (!totalAreaAcres || !village || !district || !state) {
      return res.status(400).json({ message: 'totalAreaAcres, village, district, and state are required' });
    }

    const farm = await Farm.create({
      user: req.user._id,
      farmName: farmName || '',
      totalAreaAcres,
      village, district, state,
      soilType: soilType || 'Unknown',
      irrigationSource: irrigationSource || 'Rainfed',
      crops: [],
    });

    res.status(201).json({ message: 'Farm profile created', farm });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create farm profile', error: error.message });
  }
});

// PUT /api/farm — update farm profile
router.put('/', protect, async (req, res) => {
  try {
    const farm = await Farm.findOne({ user: req.user._id });
    if (!farm) {
      return res.status(404).json({ message: 'No farm profile found' });
    }

    const updatable = ['farmName', 'totalAreaAcres', 'village', 'district', 'state', 'soilType', 'irrigationSource'];
    for (const field of updatable) {
      if (req.body[field] !== undefined) {
        farm[field] = req.body[field];
      }
    }

    await farm.save();
    res.json({ message: 'Farm profile updated', farm });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update farm profile', error: error.message });
  }
});

// POST /api/farm/crops — add a crop
router.post('/crops', protect, async (req, res) => {
  try {
    const farm = await Farm.findOne({ user: req.user._id });
    if (!farm) {
      return res.status(404).json({ message: 'Create a farm profile first' });
    }

    const { name, variety, areaAcres, sowingDate, expectedHarvestDate } = req.body;

    if (!name || !areaAcres || !sowingDate) {
      return res.status(400).json({ message: 'Crop name, area, and sowing date are required' });
    }

    farm.crops.push({
      name: name.trim(),
      variety: variety || '',
      areaAcres,
      sowingDate: new Date(sowingDate),
      expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : null,
      status: 'active',
    });

    await farm.save();
    const newCrop = farm.crops[farm.crops.length - 1];
    res.status(201).json({ message: 'Crop added', crop: newCrop, farm });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add crop', error: error.message });
  }
});

// PUT /api/farm/crops/:cropId — update a crop
router.put('/crops/:cropId', protect, async (req, res) => {
  try {
    const farm = await Farm.findOne({ user: req.user._id });
    if (!farm) {
      return res.status(404).json({ message: 'No farm profile found' });
    }

    const crop = farm.crops.id(req.params.cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    const updatable = ['name', 'variety', 'areaAcres', 'sowingDate', 'expectedHarvestDate', 'status'];
    for (const field of updatable) {
      if (req.body[field] !== undefined) {
        if (field === 'sowingDate' || field === 'expectedHarvestDate') {
          crop[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          crop[field] = req.body[field];
        }
      }
    }

    await farm.save();
    res.json({ message: 'Crop updated', crop, farm });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update crop', error: error.message });
  }
});

module.exports = router;
