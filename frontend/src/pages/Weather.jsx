import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Weather() {
  const { user, logout } = useAuth();

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationDenied, setLocationDenied] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/weather', { params: { lat, lon } });
      setWeather(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLocationDenied(true);
      return;
    }

    setLoading(true);
    setError('');
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      },
      (geoError) => {
        setLoading(false);
        setLocationDenied(true);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError('Location access was denied. You can enter your location manually below.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again or enter manually.');
            break;
          case geoError.TIMEOUT:
            setError('Location request timed out. Please try again or enter manually.');
            break;
          default:
            setError('An unknown error occurred. Please enter your location manually.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
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
        <span className="feature-hero-icon">🌤️</span>
        <div>
          <h2>Weather Forecast</h2>
          <p>Check current weather and 5-day forecast for your farm location</p>
        </div>
      </section>

      {/* Location button */}
      {!weather && !loading && (
        <section className="weather-location-section">
          <button onClick={handleGetLocation} className="btn btn-primary btn-location">
            📍 Use my current location
          </button>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}

          {locationDenied && (
            <div className="manual-location">
              <p className="manual-location-label">Enter your city or location:</p>
              <div className="manual-location-input-group">
                <input
                  type="text"
                  placeholder="e.g. Lucknow, UP"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="manual-location-input"
                />
                <p className="manual-location-hint">
                  Geocoding support coming soon. For now, please allow location access.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-inline">
          <div className="spinner"></div>
          <p>Fetching weather data…</p>
        </div>
      )}

      {/* Weather Results */}
      {weather && !loading && (
        <section className="weather-results">
          {/* Current Weather */}
          <div className="weather-current-card">
            <div className="weather-current-main">
              <span className="weather-current-icon">{weather.current.icon}</span>
              <div className="weather-current-temp">
                <span className="temp-value">{Math.round(weather.current.temperature)}</span>
                <span className="temp-unit">{weather.current.temperatureUnit}</span>
              </div>
            </div>
            <p className="weather-current-condition">{weather.current.condition}</p>
            <div className="weather-current-details">
              <div className="weather-detail">
                <span className="weather-detail-icon">💧</span>
                <span className="weather-detail-label">Humidity</span>
                <span className="weather-detail-value">{weather.current.humidity}%</span>
              </div>
              <div className="weather-detail">
                <span className="weather-detail-icon">💨</span>
                <span className="weather-detail-label">Wind</span>
                <span className="weather-detail-value">{weather.current.windSpeed} {weather.current.windSpeedUnit}</span>
              </div>
            </div>
            <button onClick={handleGetLocation} className="btn btn-outline btn-sm weather-refresh">
              🔄 Refresh
            </button>
          </div>

          {/* 5-Day Forecast */}
          <div className="forecast-card">
            <h3>5-Day Forecast</h3>
            <div className="forecast-list">
              {weather.forecast.map((day) => (
                <div key={day.date} className="forecast-item">
                  <span className="forecast-day">{getDayName(day.date)}</span>
                  <span className="forecast-icon">{day.icon}</span>
                  <span className="forecast-condition">{day.condition}</span>
                  <div className="forecast-temps">
                    <span className="forecast-high">{Math.round(day.tempMax)}°</span>
                    <span className="forecast-low">{Math.round(day.tempMin)}°</span>
                  </div>
                  <div className="forecast-rain">
                    <span className="rain-icon">🌧️</span>
                    <span>{day.precipitationProbability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
