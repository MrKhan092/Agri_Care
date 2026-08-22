import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function FarmNews() {
  const { user, logout } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get('/farm-news');
        setArticles(res.data.articles || []);
        if (res.data.message && res.data.articles?.length === 0) {
          setError(res.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch news');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffHrs < 48) return 'Yesterday';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
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
        <span className="feature-hero-icon">📰</span>
        <div>
          <h2>Farm News</h2>
          <p>Latest agriculture and farming news from across India</p>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="loading-inline">
          <div className="spinner"></div>
          <p>Fetching latest farm news…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="empty-feature-state">
          <span className="empty-icon">📭</span>
          <p>{error}</p>
        </div>
      )}

      {/* No articles */}
      {!loading && !error && articles.length === 0 && (
        <div className="empty-feature-state">
          <span className="empty-icon">🔍</span>
          <p>No farming news found at the moment.</p>
          <p className="empty-hint">Check back later for the latest updates.</p>
        </div>
      )}

      {/* News Grid */}
      {!loading && articles.length > 0 && (
        <section className="news-grid">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news-card"
            >
              {article.image ? (
                <div className="news-card-image">
                  <img
                    src={article.image}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="news-card-image news-card-placeholder">
                  <span>📰</span>
                </div>
              )}
              <div className="news-card-body">
                <h3 className="news-card-title">{article.title}</h3>
                {article.description && (
                  <p className="news-card-desc">
                    {article.description.length > 120
                      ? article.description.slice(0, 120) + '…'
                      : article.description}
                  </p>
                )}
                <div className="news-card-meta">
                  <span className="news-source">{article.source}</span>
                  <span className="news-date">{formatDate(article.publishedAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
