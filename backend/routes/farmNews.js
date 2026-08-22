const express = require('express');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// In-memory cache
const cache = { data: null, timestamp: 0 };
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

const QUERY = 'agriculture OR farming OR farmer OR crop OR kisan OR mandi OR harvest';
const MAX_PAGES = 3; // Fetch up to 3 pages (≈30 articles)

// Helper: build the NewsData.io URL
function buildUrl(apiKey, nextPage) {
  const url = new URL('https://newsdata.io/api/1/latest');
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('country', 'in');
  url.searchParams.set('language', 'en');
  url.searchParams.set('qInTitle', QUERY);
  url.searchParams.set('size', '10'); // max for free plan
  if (nextPage) {
    url.searchParams.set('page', nextPage);
  }
  return url.toString();
}

// Helper: simplify a raw article
function simplifyArticle(a) {
  return {
    title: a.title,
    description: a.description || '',
    source: a.source_name || a.source_id || 'Unknown',
    image: a.image_url || null,
    publishedAt: a.pubDate || '',
    link: a.link || '',
    category: a.category?.[0] || '',
  };
}

// GET /api/farm-news
router.get('/', protect, async (req, res) => {
  try {
    // Serve from cache if fresh
    if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
      return res.json(cache.data);
    }

    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: 'News API key not configured. Please add NEWSDATA_API_KEY to .env',
      });
    }

    let allArticles = [];
    let nextPage = null;

    // Fetch multiple pages to get more articles
    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await fetch(buildUrl(apiKey, nextPage));

      if (!response.ok) {
        // If first page fails, return error; otherwise return what we have
        if (page === 0) {
          const text = await response.text();
          console.error('NewsData.io API error:', response.status, text);
          return res.status(502).json({ message: 'Failed to fetch news' });
        }
        break;
      }

      const json = await response.json();

      if (json.status !== 'success' || !json.results || json.results.length === 0) {
        break;
      }

      const articles = json.results
        .filter((a) => a.title)
        .map(simplifyArticle);

      allArticles = allArticles.concat(articles);
      nextPage = json.nextPage || null;

      // No more pages available
      if (!nextPage) break;
    }

    if (allArticles.length === 0) {
      return res.json({ articles: [], message: 'No news articles found' });
    }

    const result = { articles: allArticles };
    cache.data = result;
    cache.timestamp = Date.now();

    res.json(result);
  } catch (error) {
    console.error('Farm news error:', error.message);
    res.status(500).json({ message: 'Server error fetching news', error: error.message });
  }
});

module.exports = router;
