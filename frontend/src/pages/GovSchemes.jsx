import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CATEGORY_ICONS = {
  'Income Support': '💰',
  'Crop Insurance': '🛡️',
  'Credit & Loans': '🏦',
  'Pension': '👴',
  'Soil Health': '🧪',
  'Irrigation': '💧',
  'Market Access': '🏪',
  'Input Subsidy': '🌾',
  'Agroforestry': '🌳',
  'Organic Farming': '🌿',
  'Infrastructure': '🏗️',
  'Price Support': '📊',
  'Loan Waiver': '📝',
  'Climate Resilience': '🌍',
};

export default function GovSchemes() {
  const { user, logout } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedScheme, setExpandedScheme] = useState(null);

  useEffect(() => {
    fetchSchemes();
  }, [selectedCategory]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const params = {};
      // Auto-filter by user's state if available
      if (user?.state) params.state = user.state;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get('/schemes', { params });
      setSchemes(res.data.schemes || []);
      setCategories(res.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter
  const filtered = searchQuery
    ? schemes.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : schemes;

  const toggleExpand = (id) => {
    setExpandedScheme(expandedScheme === id ? null : id);
  };

  return (
    <div className="dashboard feature-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="brand-icon">🌾</span>
          <h1>AgriCare</h1>
          <span className="role-badge role-farmer">Farmer</span>
        </div>
        <div className="dashboard-user">
          <Link to="/farmer/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
          <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
        </div>
      </header>

      <section className="feature-hero">
        <span className="feature-hero-icon">🏛️</span>
        <div>
          <h2>Government Schemes</h2>
          <p>Central & state schemes for farmers — subsidies, insurance, credit & more
            {user?.state && <span className="schemes-state-tag"> · Showing for {user.state}</span>}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="schemes-filters">
        <div className="schemes-search">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search schemes by name or keyword…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="schemes-category-bar">
          <button
            className={`scheme-cat-btn ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`scheme-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {CATEGORY_ICONS[cat] || '📋'} {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="loading-inline">
          <div className="spinner"></div>
          <p>Loading schemes…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="alert alert-error"><span>⚠️</span><p>{error}</p></div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="schemes-count">{filtered.length} scheme{filtered.length !== 1 ? 's' : ''} found</p>
      )}

      {/* Schemes List */}
      {!loading && filtered.length === 0 && (
        <div className="empty-feature-state">
          <span className="empty-icon">📭</span>
          <p>No schemes found matching your filters.</p>
          <p className="empty-hint">Try clearing filters or searching with different keywords.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <section className="schemes-list">
          {filtered.map((scheme) => (
            <div
              key={scheme.id}
              className={`scheme-card ${expandedScheme === scheme.id ? 'scheme-expanded' : ''}`}
            >
              <button
                className="scheme-card-header"
                onClick={() => toggleExpand(scheme.id)}
              >
                <div className="scheme-title-row">
                  <span className="scheme-icon">{CATEGORY_ICONS[scheme.category] || '📋'}</span>
                  <div className="scheme-title-info">
                    <h3>{scheme.name}</h3>
                    <span className="scheme-ministry">{scheme.ministry}</span>
                  </div>
                </div>
                <div className="scheme-header-right">
                  <span className="scheme-category-badge">{scheme.category}</span>
                  <span className="scheme-expand-arrow">{expandedScheme === scheme.id ? '▲' : '▼'}</span>
                </div>
              </button>

              <p className="scheme-description">{scheme.description}</p>

              {expandedScheme === scheme.id && (
                <div className="scheme-details">
                  <div className="scheme-detail-row">
                    <span className="scheme-detail-label">💰 Benefits</span>
                    <span>{scheme.benefits}</span>
                  </div>
                  <div className="scheme-detail-row">
                    <span className="scheme-detail-label">📋 How to Apply</span>
                    <span>{scheme.howToApply}</span>
                  </div>
                  {scheme.eligibility.maxLandAcres && (
                    <div className="scheme-detail-row">
                      <span className="scheme-detail-label">📐 Max Land</span>
                      <span>{scheme.eligibility.maxLandAcres} acres (small & marginal farmers)</span>
                    </div>
                  )}
                  {scheme.eligibility.states && (
                    <div className="scheme-detail-row">
                      <span className="scheme-detail-label">📍 States</span>
                      <span>{scheme.eligibility.states.join(', ')}</span>
                    </div>
                  )}
                  {scheme.applicationLink && (
                    <a
                      href={scheme.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm scheme-apply-btn"
                    >
                      🔗 Apply / Visit Official Portal
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
