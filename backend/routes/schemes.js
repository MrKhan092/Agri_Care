const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const govSchemes = require('../data/govSchemes');

const router = express.Router();

// GET /api/schemes — return all schemes, optionally filtered
router.get('/', protect, async (req, res) => {
  try {
    let filtered = [...govSchemes];
    const { state, category, search } = req.query;

    // Filter by state: show central (allStates=true) + state-specific matches
    if (state) {
      filtered = filtered.filter((s) => {
        if (s.eligibility.allStates) return true;
        return s.eligibility.states?.some(
          (st) => st.toLowerCase() === state.toLowerCase()
        );
      });
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search by name or description
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Collect unique categories for the frontend filter
    const categories = [...new Set(govSchemes.map((s) => s.category))].sort();

    res.json({ schemes: filtered, categories, total: filtered.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch schemes', error: error.message });
  }
});

// GET /api/schemes/:id — return a single scheme by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const scheme = govSchemes.find((s) => s.id === req.params.id);
    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }
    res.json({ scheme });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch scheme', error: error.message });
  }
});

module.exports = router;
