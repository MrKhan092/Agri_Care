const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Farm = require('../models/Farm');
const cropTimelines = require('../data/cropTimelines');

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// GET /api/dashboard/admin
router.get('/admin', authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const totalFarmers = await User.countDocuments({ role: 'farmer', status: 'approved' });

    const recentUsers = await User.find()
      .select('name email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      message: `Welcome back, ${req.user.name}!`,
      data: {
        totalUsers,
        pendingUsers,
        totalFarmers,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/dashboard/farmer
router.get('/farmer', authorize('farmer'), async (req, res) => {
  try {
    const farm = await Farm.findOne({ user: req.user._id }).lean();

    const crops = farm?.crops || [];
    const activeCrops = crops.filter(c => c.status === 'active');
    const totalCrops = crops.length;
    const activePlots = activeCrops.length;

    // Build upcoming tasks from active crops' calendar stages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingTasks = [];

    for (const crop of activeCrops) {
      const cropNameLower = crop.name.toLowerCase().trim();
      const stages = cropTimelines[cropNameLower];
      if (!stages) continue;

      const sowingDate = new Date(crop.sowingDate);
      for (const stage of stages) {
        const targetDate = new Date(sowingDate);
        targetDate.setDate(targetDate.getDate() + stage.daysFromSowing);
        targetDate.setHours(0, 0, 0, 0);

        // Show tasks due today or in the next 7 days
        const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          upcomingTasks.push({
            id: `${crop._id}-${stage.daysFromSowing}`,
            task: `${crop.name}: ${stage.stageName}`,
            due: targetDate.toISOString().split('T')[0],
          });
        }
      }
    }

    // Sort by date, limit to 5
    upcomingTasks.sort((a, b) => a.due.localeCompare(b.due));

    res.json({
      message: `Welcome back, ${req.user.name}!`,
      data: {
        farmName: farm?.farmName || farm?.village || 'My Farm',
        farmSize: farm ? `${farm.totalAreaAcres} acres` : 'Not set',
        cropsGrown: activeCrops.map(c => c.name),
        totalCrops,
        activePlots,
        upcomingTasks: upcomingTasks.slice(0, 5),
        recentActivity: [],
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
