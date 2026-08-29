import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/dashboard/farmer')
      .then((res) => setData(res.data.data))
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));

    // Fetch weather silently
    if (user?.state) {
      api.get(`/weather?city=${user.district || user.state}`)
        .then((res) => setWeather(res.data))
        .catch(() => {});
    }
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
      icon: '🏪', title: 'Mandi Prices',
      description: 'Live market commodity prices', path: '/farmer/mandi-price',
      gradient: 'fcard-green',
    },
    {
      icon: '📜', title: 'Land Records',
      description: 'Official Bhulekh land records', path: '/farmer/land-records',
      gradient: 'fcard-amber',
    },
    {
      icon: '📰', title: 'Farm News',
      description: 'Daily agriculture headlines', path: '/farmer/news',
      gradient: 'fcard-purple',
    },
    {
      icon: '🧪', title: 'Soil Test',
      description: 'Book a soil testing visit', path: '/farmer/soil-booking',
      gradient: 'fcard-teal',
    },
    {
      icon: '🔬', title: 'Soil Analysis',
      description: 'AI-powered soil reports', path: '/farmer/soil-analysis',
      gradient: 'fcard-rose',
    },
    {
      icon: '🏡', title: 'My Farm',
      description: 'Profile, crops & timelines', path: '/farmer/farm-profile',
      gradient: 'fcard-emerald',
    },
    {
      icon: '💰', title: 'Farm Finance',
      description: 'Expenses, income & inventory', path: '/farmer/farm-management',
      gradient: 'fcard-orange',
    },
    {
      icon: '🏛️', title: 'Govt Schemes',
      description: 'Subsidies, insurance & credit', path: '/farmer/schemes',
      gradient: 'fcard-indigo',
    },
  ];

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  const weatherIcon = weather?.current
    ? weather.current.weather?.[0]?.icon
      ? `https://openweathermap.org/img/wn/${weather.current.weather[0].icon}.png`
      : null
    : null;
  const temp = weather?.current?.main?.temp;
  const weatherDesc = weather?.current?.weather?.[0]?.description;
  const humidity = weather?.current?.main?.humidity;

  return (
    <div className="dash-v2">
      {/* Top Bar */}
      <header className="dash-topbar">
        <div className="dash-topbar-inner">
          <Link to="/" className="dash-logo">
            <span className="dash-logo-icon">🌾</span>
            <span className="dash-logo-text">AgriCare</span>
          </Link>
          <div className="dash-topbar-right">
            {/* Weather Pill */}
            {temp && (
              <button className="weather-pill" onClick={() => navigate('/farmer/weather')}>
                {weatherIcon && <img src={weatherIcon} alt="" className="weather-pill-icon" />}
                <span className="weather-pill-temp">{Math.round(temp)}°C</span>
                <span className="weather-pill-desc">{weatherDesc}</span>
                {humidity && <span className="weather-pill-humidity">💧 {humidity}%</span>}
              </button>
            )}
            <span className="dash-user-name">{user?.name}</span>
            <button onClick={logout} className="dash-logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="dash-hero">
        <div className="dash-hero-content">
          <p className="dash-greeting">{greeting},</p>
          <h1 className="dash-hero-name">{user?.name?.split(' ')[0]} 👋</h1>
          <p className="dash-hero-sub">Here's what's happening on your farm today</p>
        </div>
        <div className="dash-hero-glow"></div>
      </section>

      {/* Stats Row */}
      <section className="dash-stats-row">
        <div className="dash-stat dash-stat-crops">
          <div className="dash-stat-icon-wrap">🌿</div>
          <div>
            <span className="dash-stat-num">{data?.totalCrops ?? 0}</span>
            <span className="dash-stat-lbl">Crops</span>
          </div>
        </div>
        <div className="dash-stat dash-stat-plots">
          <div className="dash-stat-icon-wrap">📐</div>
          <div>
            <span className="dash-stat-num">{data?.activePlots ?? 0}</span>
            <span className="dash-stat-lbl">Active Plots</span>
          </div>
        </div>
        <div className="dash-stat dash-stat-tasks">
          <div className="dash-stat-icon-wrap">📋</div>
          <div>
            <span className="dash-stat-num">{data?.upcomingTasks?.length ?? 0}</span>
            <span className="dash-stat-lbl">Tasks</span>
          </div>
        </div>
        {data?.farmSize && (
          <div className="dash-stat dash-stat-area">
            <div className="dash-stat-icon-wrap">🗺️</div>
            <div>
              <span className="dash-stat-num">{data.farmSize}</span>
              <span className="dash-stat-lbl">Farm Size</span>
            </div>
          </div>
        )}
      </section>

      {/* Quick Access Grid */}
      <section className="dash-features-section">
        <h2 className="dash-section-title">Quick Access</h2>
        <div className="dash-features-grid">
          {features.map((f) => (
            <button
              key={f.path}
              className={`dash-fcard ${f.gradient}`}
              onClick={() => navigate(f.path)}
            >
              <div className="dash-fcard-icon">{f.icon}</div>
              <div className="dash-fcard-body">
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
              <svg className="dash-fcard-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom Info Cards */}
      <section className="dash-bottom-grid">
        <div className="dash-info-card">
          <div className="dash-info-header">
            <span>🏡</span>
            <h3>Farm Overview</h3>
          </div>
          <div className="dash-info-rows">
            <div className="dash-info-row">
              <span>📍 Location</span>
              <strong>{data?.farmName || user?.state || 'Not set'}</strong>
            </div>
            <div className="dash-info-row">
              <span>🌾 Crops</span>
              <strong>{data?.cropsGrown?.length ? data.cropsGrown.join(', ') : 'None listed'}</strong>
            </div>
          </div>
          <button className="dash-info-action" onClick={() => navigate('/farmer/farm-profile')}>
            View Farm Profile →
          </button>
        </div>

        <div className="dash-info-card">
          <div className="dash-info-header">
            <span>📋</span>
            <h3>Upcoming Tasks</h3>
          </div>
          {data?.upcomingTasks?.length ? (
            <div className="dash-tasks-list">
              {data.upcomingTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="dash-task-item">
                  <span className="dash-task-dot"></span>
                  <span className="dash-task-name">{t.task}</span>
                  <span className="dash-task-due">{t.due}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty">
              <span>✨</span>
              <p>All clear! No pending tasks.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
