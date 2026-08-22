const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// In-memory cache: key -> { data, timestamp }
const cache = new Map();
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

// Dataset: "Variety-wise Daily Market Prices Data of Commodity"
const DATA_GOV_RESOURCE_ID = '35985678-0d79-46b4-9ed6-6f13308a1d24';

function getCacheKey(params) {
  return `${params.state || ''}_${params.district || ''}_${params.commodity || ''}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

// GET /api/mandi-price?state=...&district=...&commodity=...
router.get('/', protect, async (req, res) => {
  try {
    const { state, district, commodity } = req.query;

    if (!state) {
      return res.status(400).json({ message: 'State parameter is required' });
    }

    const cacheKey = getCacheKey({ state, district, commodity });
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.DATA_GOV_API_KEY;
    if (!apiKey || apiKey === 'your_data_gov_api_key_here') {
      return res.status(500).json({
        message: 'Mandi price API key not configured. Please add DATA_GOV_API_KEY to .env',
      });
    }

    // Build the API URL with filters
    const url = new URL(`https://api.data.gov.in/resource/${DATA_GOV_RESOURCE_ID}`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '500');
    url.searchParams.set('filters[State]', state);
    url.searchParams.set('sort[Arrival_Date]', 'desc');

    if (district) {
      url.searchParams.set('filters[District]', district);
    }
    if (commodity) {
      url.searchParams.set('filters[Commodity]', commodity);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const text = await response.text();
      console.error('data.gov.in API error:', response.status, text);
      return res.status(502).json({
        message: 'Failed to fetch data from data.gov.in',
      });
    }

    const json = await response.json();
    const rawRecords = json.records || [];

    if (rawRecords.length === 0) {
      const result = { records: [], message: 'No data available for the selected filters' };
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return res.json(result);
    }

    // Simplify records — actual field names from this dataset are
    // capitalized: State, District, Market, Commodity, Variety,
    // Min_Price, Max_Price, Modal_Price, Arrival_Date
    const records = rawRecords.map((r) => ({
      market: r.Market || '',
      commodity: r.Commodity || '',
      variety: r.Variety || '',
      min_price: r.Min_Price || '',
      max_price: r.Max_Price || '',
      modal_price: r.Modal_Price || '',
      arrival_date: r.Arrival_Date || '',
      state: r.State || '',
      district: r.District || '',
    }));

    // Extract unique values for dropdown population
    const districts = [...new Set(records.map((r) => r.district).filter(Boolean))].sort();
    const markets = [...new Set(records.map((r) => r.market).filter(Boolean))].sort();
    const commodities = [...new Set(records.map((r) => r.commodity).filter(Boolean))].sort();

    const result = { records, districts, markets, commodities };
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);
  } catch (error) {
    console.error('Mandi price error:', error.message);
    res.status(500).json({ message: 'Server error fetching mandi prices', error: error.message });
  }
});

module.exports = router;