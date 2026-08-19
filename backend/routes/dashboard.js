const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// GET /api/dashboard/admin
router.get('/admin', authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const totalFarmers = await User.countDocuments({ role: 'farmer', status: 'approved' });
    const totalSuppliers = await User.countDocuments({ role: 'supplier', status: 'approved' });

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
        totalSuppliers,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/dashboard/farmer
router.get('/farmer', authorize('farmer'), (req, res) => {
  res.json({
    message: `Welcome back, ${req.user.name}!`,
    data: {
      farmName: req.user.farmLocation || 'My Farm',
      farmSize: req.user.farmSize || 'Not set',
      cropsGrown: req.user.cropsGrown || [],
      totalCrops: req.user.cropsGrown?.length || 0,
      activePlots: 4,
      upcomingTasks: [
        { id: 1, task: 'Irrigate wheat field', due: '2026-08-16' },
        { id: 2, task: 'Apply fertilizer to plot B', due: '2026-08-18' },
        { id: 3, task: 'Harvest tomatoes', due: '2026-08-20' },
      ],
      recentActivity: [
        { id: 1, action: 'Planted rice in plot A', date: '2026-08-12' },
        { id: 2, action: 'Soil test completed', date: '2026-08-10' },
      ],
    },
  });
});

// GET /api/dashboard/supplier
router.get('/supplier', authorize('supplier'), (req, res) => {
  res.json({
    message: `Welcome back, ${req.user.name}!`,
    data: {
      businessName: req.user.businessName || 'My Business',
      businessLocation: req.user.businessLocation || 'Not set',
      verified: req.user.verified || false,
      totalOrders: 24,
      pendingOrders: 3,
      productsListed: 18,
      recentOrders: [
        { id: 1, item: 'Organic Fertilizer (50kg)', buyer: 'Green Valley Farm', date: '2026-08-14' },
        { id: 2, item: 'Drip Irrigation Kit', buyer: 'Sunrise Fields', date: '2026-08-13' },
        { id: 3, item: 'Wheat Seeds (25kg)', buyer: 'Harvest Hills', date: '2026-08-12' },
      ],
    },
  });
});

module.exports = router;
