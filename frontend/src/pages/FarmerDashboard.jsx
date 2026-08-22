import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/dashboard/farmer')
      .then((res) => setData(res.data.data))
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard…</p>
      </div>
    );
  }

  const features = [
    {
      icon: '🏪',
      title: 'Mandi Prices',
      description: 'Check today\'s market prices for crops across India',
      path: '/farmer/mandi-price',
      color: 'feature-green',
    },
    {
      icon: '🌤️',
      title: 'Weather',
      description: 'View current weather and 5-day forecast for your area',
      path: '/farmer/weather',
      color: 'feature-blue',
    },
    {
      icon: '📜',
      title: 'Land Records',
      description: 'Access official land records (Bhulekh) for your state',
      path: '/farmer/land-records',
      color: 'feature-amber',
    },
    {
      icon: '📰',
      title: 'Farm News',
      description: 'Latest agriculture and farming news from India',
      path: '/farmer/news',
      color: 'feature-purple',
    },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="brand-icon">🌾</span>
          <h1>AgriCare</h1>
          <span className="role-badge role-farmer">Farmer</span>
        </div>
        <div className="dashboard-user">
          <span className="user-greeting">Hi, {user?.name}</span>
          <button onClick={logout} className="btn btn-outline btn-sm">
            Logout
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🌿</span>
          <div>
            <p className="stat-value">{data?.totalCrops ?? '—'}</p>
            <p className="stat-label">Total Crops</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📐</span>
          <div>
            <p className="stat-value">{data?.activePlots ?? '—'}</p>
            <p className="stat-label">Active Plots</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div>
            <p className="stat-value">{data?.upcomingTasks?.length ?? '—'}</p>
            <p className="stat-label">Upcoming Tasks</p>
          </div>
        </div>
      </section>

      {/* Feature Navigation Cards */}
      <section className="feature-nav-section">
        <h2 className="section-title">Quick Access</h2>
        <div className="feature-nav-grid">
          {features.map((f) => (
            <button
              key={f.path}
              className={`feature-nav-card ${f.color}`}
              onClick={() => navigate(f.path)}
            >
              <span className="feature-nav-icon">{f.icon}</span>
              <div className="feature-nav-info">
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
              <span className="feature-nav-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <h2>Farm Details</h2>
          <div className="detail-row">
            <span className="detail-label">Location</span>
            <span className="detail-value">{data?.farmName || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Size</span>
            <span className="detail-value">{data?.farmSize || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Crops</span>
            <span className="detail-value">
              {data?.cropsGrown?.length
                ? data.cropsGrown.join(', ')
                : 'None listed'}
            </span>
          </div>
        </div>

        <div className="card">
          <h2>Upcoming Tasks</h2>
          {data?.upcomingTasks?.length ? (
            <ul className="task-list">
              {data.upcomingTasks.map((t) => (
                <li key={t.id} className="task-item">
                  <span className="task-name">{t.task}</span>
                  <span className="task-due">{t.due}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No upcoming tasks</p>
          )}
        </div>

        <div className="card">
          <h2>Recent Activity</h2>
          {data?.recentActivity?.length ? (
            <ul className="activity-list">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="activity-item">
                  <span className="activity-action">{a.action}</span>
                  <span className="activity-date">{a.date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No recent activity</p>
          )}
        </div>
      </section>
    </div>
  );
}
