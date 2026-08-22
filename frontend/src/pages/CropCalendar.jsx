import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CATEGORY_ICONS = {
  irrigation: '💧',
  fertilizer: '🌱',
  'pest-control': '🐛',
  harvest: '🌾',
  general: 'ℹ️',
};

const STATUS_CLASS = {
  upcoming: 'timeline-upcoming',
  'due-today': 'timeline-due',
  completed: 'timeline-done',
};

export default function CropCalendar() {
  const { cropId } = useParams();
  const { logout } = useAuth();
  const [crop, setCrop] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await api.get(`/crop-calendar/${cropId}`);
        setCrop(res.data.crop);
        setTimeline(res.data.timeline || []);
        setSource(res.data.source);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load crop calendar');
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [cropId]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Separate urgent (due-today/overdue) from rest
  const urgentStages = timeline.filter(s => s.status === 'due-today');
  const allStages = timeline;

  return (
    <div className="dashboard feature-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="brand-icon">🌾</span>
          <h1>AgriCare</h1>
          <span className="role-badge role-farmer">Farmer</span>
        </div>
        <div className="dashboard-user">
          <Link to="/farmer/farm-profile" className="btn btn-outline btn-sm">← My Farm</Link>
          <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
        </div>
      </header>

      {loading && (
        <div className="loading-inline">
          <div className="spinner"></div>
          <p>{source === '' ? 'Loading crop calendar…' : 'Generating AI timeline…'}</p>
        </div>
      )}

      {error && !loading && (
        <div className="empty-feature-state">
          <span className="empty-icon">📭</span>
          <p>{error}</p>
          <Link to="/farmer/farm-profile" className="btn btn-primary btn-sm" style={{marginTop: '0.5rem'}}>← Back to Farm</Link>
        </div>
      )}

      {!loading && crop && (
        <>
          <section className="feature-hero">
            <span className="feature-hero-icon">📅</span>
            <div>
              <h2>{crop.name} Care Timeline</h2>
              <p>
                {crop.variety && `${crop.variety} · `}
                Sown: {formatDate(crop.sowingDate)} · {crop.areaAcres} acres
                {source === 'ai' && <span className="ai-badge">✨ AI Generated</span>}
              </p>
            </div>
          </section>

          {/* Urgent Items */}
          {urgentStages.length > 0 && (
            <section className="urgent-stages">
              <h3>⚡ Action Required Today</h3>
              {urgentStages.map((s, i) => (
                <div key={`urgent-${i}`} className="urgent-card">
                  <span className="stage-icon">{CATEGORY_ICONS[s.category] || 'ℹ️'}</span>
                  <div>
                    <strong>{s.stageName}</strong>
                    <p>{s.description}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Full Timeline */}
          <section className="crop-timeline">
            <h3 className="section-title">Full Timeline ({allStages.length} stages)</h3>
            <div className="timeline-vertical">
              {allStages.map((stage, i) => (
                <div key={i} className={`timeline-item ${STATUS_CLASS[stage.status]}`}>
                  <div className="timeline-marker">
                    <span className="timeline-dot"></span>
                    {i < allStages.length - 1 && <span className="timeline-line"></span>}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="stage-icon">{CATEGORY_ICONS[stage.category] || 'ℹ️'}</span>
                      <strong>{stage.stageName}</strong>
                      <span className={`status-badge stage-status-${stage.status}`}>
                        {stage.status === 'due-today' ? '🔥 Due Today' : stage.status === 'completed' ? '✅ Done' : '⏳ Upcoming'}
                      </span>
                    </div>
                    <p className="timeline-date">📅 {formatDate(stage.targetDate)} · Day {stage.daysFromSowing}</p>
                    <p className="timeline-desc">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
