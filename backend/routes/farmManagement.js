const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Farm = require('../models/Farm');
const FarmTransaction = require('../models/FarmTransaction');
const InventoryItem = require('../models/InventoryItem');

const router = express.Router();

// Helper: get user's farm ID
async function getUserFarmId(userId) {
  const farm = await Farm.findOne({ user: userId }).select('_id').lean();
  return farm?._id || null;
}

// ─── TRANSACTIONS ──────────────────────────────────────────

// POST /api/farm-management/transactions
router.post('/transactions', protect, async (req, res) => {
  try {
    const farmId = await getUserFarmId(req.user._id);
    if (!farmId) return res.status(404).json({ message: 'Create a farm profile first' });

    const { type, category, amount, description, date, relatedCrop } = req.body;
    if (!type || !category || amount === undefined) {
      return res.status(400).json({ message: 'type, category, and amount are required' });
    }

    const txn = await FarmTransaction.create({
      farm: farmId, user: req.user._id,
      type, category, amount,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      relatedCrop: relatedCrop || '',
    });

    res.status(201).json({ transaction: txn });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add transaction', error: error.message });
  }
});

// GET /api/farm-management/transactions?type=&category=&from=&to=
router.get('/transactions', protect, async (req, res) => {
  try {
    const farmId = await getUserFarmId(req.user._id);
    if (!farmId) return res.status(404).json({ message: 'Create a farm profile first' });

    const filter = { farm: farmId };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) filter.date.$lte = new Date(req.query.to);
    }

    const transactions = await FarmTransaction.find(filter).sort({ date: -1 }).lean();
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

// DELETE /api/farm-management/transactions/:id
router.delete('/transactions/:id', protect, async (req, res) => {
  try {
    const txn = await FarmTransaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
  }
});

// GET /api/farm-management/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const farmId = await getUserFarmId(req.user._id);
    if (!farmId) return res.status(404).json({ message: 'Create a farm profile first' });

    const [totals] = await FarmTransaction.aggregate([
      { $match: { farm: farmId } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
        },
      },
    ]);

    const byCategory = await FarmTransaction.aggregate([
      { $match: { farm: farmId } },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const categoryBreakdown = byCategory.map((b) => ({
      type: b._id.type,
      category: b._id.category,
      total: b.total,
    }));

    res.json({
      totalIncome: totals?.totalIncome || 0,
      totalExpense: totals?.totalExpense || 0,
      netProfit: (totals?.totalIncome || 0) - (totals?.totalExpense || 0),
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch summary', error: error.message });
  }
});

// ─── INVENTORY ─────────────────────────────────────────────

// POST /api/farm-management/inventory
router.post('/inventory', protect, async (req, res) => {
  try {
    const farmId = await getUserFarmId(req.user._id);
    if (!farmId) return res.status(404).json({ message: 'Create a farm profile first' });

    const { itemName, category, quantity, unit, lowStockThreshold } = req.body;
    if (!itemName || quantity === undefined) {
      return res.status(400).json({ message: 'itemName and quantity are required' });
    }

    const item = await InventoryItem.create({
      farm: farmId, user: req.user._id,
      itemName, category: category || 'Other',
      quantity, unit: unit || 'units',
      lowStockThreshold: lowStockThreshold || null,
    });

    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add inventory item', error: error.message });
  }
});

// GET /api/farm-management/inventory
router.get('/inventory', protect, async (req, res) => {
  try {
    const farmId = await getUserFarmId(req.user._id);
    if (!farmId) return res.status(404).json({ message: 'Create a farm profile first' });

    const items = await InventoryItem.find({ farm: farmId }).sort({ itemName: 1 }).lean();

    // Flag low-stock items
    const flagged = items.map((item) => ({
      ...item,
      isLowStock: item.lowStockThreshold !== null && item.quantity <= item.lowStockThreshold,
    }));

    res.json({ items: flagged });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inventory', error: error.message });
  }
});

// PUT /api/farm-management/inventory/:id
router.put('/inventory/:id', protect, async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const updatable = ['itemName', 'category', 'quantity', 'unit', 'lowStockThreshold'];
    for (const field of updatable) {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    }
    item.lastUpdated = new Date();
    await item.save();

    res.json({ item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update inventory item', error: error.message });
  }
});

// DELETE /api/farm-management/inventory/:id
router.delete('/inventory/:id', protect, async (req, res) => {
  try {
    const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete item', error: error.message });
  }
});

module.exports = router;
