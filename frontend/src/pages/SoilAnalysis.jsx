import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SOIL_PARAMS = [
  { key: 'pH', label: 'pH', unit: '', step: '0.1' },
  { key: 'nitrogen', label: 'Nitrogen', unit: 'kg/ha', step: '1' },
  { key: 'phosphorus', label: 'Phosphorus', unit: 'kg/ha', step: '0.1' },
  { key: 'potassium', label: 'Potassium', unit: 'kg/ha', step: '1' },
  { key: 'organicCarbon', label: 'Organic Carbon', unit: '%', step: '0.01' },
  { key: 'ec', label: 'EC (Conductivity)', unit: 'dS/m', step: '0.01' },
  { key: 'sulphur', label: 'Sulphur', unit: 'ppm', step: '0.1' },
  { key: 'zinc', label: 'Zinc', unit: 'ppm', step: '0.01' },
  { key: 'iron', label: 'Iron', unit: 'ppm', step: '0.1' },
  { key: 'manganese', label: 'Manganese', unit: 'ppm', step: '0.01' },
  { key: 'copper', label: 'Copper', unit: 'ppm', step: '0.01' },
  { key: 'boron', label: 'Boron', unit: 'ppm', step: '0.01' },
];

function getRatingClass(rating) {
  if (!rating) return '';
  const r = rating.toLowerCase();
  if (['low', 'deficient', 'acidic', 'saline'].includes(r)) return 'rating-bad';
  if (['neutral (optimal)', 'normal', 'sufficient', 'medium'].includes(r)) return 'rating-good';
  if (['high', 'alkaline', 'slightly saline'].includes(r)) return 'rating-warn';
  return 'rating-good';
}

export default function SoilAnalysis() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');

  // Upload state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Manual state
  const [manualParams, setManualParams] = useState({});
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Results
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  // Past reports
  const [pastReports, setPastReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [viewingReport, setViewingReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/soil-test/my-reports');
      setPastReports(res.data.reports || []);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // ── PDF Upload ──
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setReport(null);

    const formData = new FormData();
    formData.append('report', file);

    try {
      const res = await api.post('/soil-test/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(res.data.report);
      setFile(null);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze PDF');
    } finally {
      setUploading(false);
    }
  };

  // ── Manual Entry ──
  const handleManualChange = (key, value) => {
    setManualParams((prev) => ({
      ...prev,
      [key]: value === '' ? '' : value,
    }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const filled = Object.entries(manualParams).filter(([, v]) => v !== '' && v !== null && v !== undefined);
    if (filled.length === 0) {
      setError('Please enter at least one soil parameter');
      return;
    }

    setManualSubmitting(true);
    setError('');
    setReport(null);

    const params = {};
    for (const [k, v] of filled) {
      params[k] = parseFloat(v);
    }

    try {
      const res = await api.post('/soil-test/analyze', { parameters: params });
      setReport(res.data.report);
      setManualParams({});
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze soil data');
    } finally {
      setManualSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  // Currently displayed report (either new result or a past report being viewed)
  const displayReport = viewingReport || report;

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
        <span className="feature-hero-icon">🔬</span>
        <div>
          <h2>Soil Analysis</h2>
          <p>Upload a soil report PDF or enter values manually to get recommendations</p>
        </div>
      </section>

      {/* Tabs */}
      {!displayReport && (
        <>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'upload' ? 'tab-active' : ''}`}
              onClick={() => { setActiveTab('upload'); setError(''); }}
            >
              📄 Upload PDF
            </button>
            <button
              className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`}
              onClick={() => { setActiveTab('manual'); setError(''); }}
            >
              ✏️ Enter Manually
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <section className="card soil-input-card">
              <h3>Upload Soil Report (PDF)</h3>
              <p className="soil-input-hint">Upload your soil health card or lab report PDF. We'll extract the values automatically using AI.</p>
              <form onSubmit={handleUpload}>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="soil-pdf"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="file-input"
                  />
                  <label htmlFor="soil-pdf" className="file-label">
                    {file ? (
                      <span>📎 {file.name}</span>
                    ) : (
                      <span>📁 Click to select a PDF file</span>
                    )}
                  </label>
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-primary" disabled={!file || uploading}>
                  {uploading ? '🔄 Analyzing…' : '🔬 Analyze Report'}
                </button>
              </form>
            </section>
          )}

          {/* Manual Tab */}
          {activeTab === 'manual' && (
            <section className="card soil-input-card">
              <h3>Enter Soil Parameters</h3>
              <p className="soil-input-hint">Enter any soil values you have. At least one parameter is required.</p>
              <form onSubmit={handleManualSubmit}>
                <div className="soil-params-grid">
                  {SOIL_PARAMS.map((p) => (
                    <div key={p.key} className="soil-param-input">
                      <label htmlFor={`param-${p.key}`}>
                        {p.label} {p.unit && <span className="param-unit">({p.unit})</span>}
                      </label>
                      <input
                        type="number"
                        id={`param-${p.key}`}
                        value={manualParams[p.key] || ''}
                        onChange={(e) => handleManualChange(p.key, e.target.value)}
                        step={p.step}
                        min="0"
                        placeholder="—"
                        className="form-input"
                      />
                    </div>
                  ))}
                </div>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="btn btn-primary" disabled={manualSubmitting}>
                  {manualSubmitting ? '🔄 Analyzing…' : '🔬 Analyze Soil'}
                </button>
              </form>
            </section>
          )}
        </>
      )}

      {/* Results View */}
      {displayReport && (
        <section className="soil-results">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { setReport(null); setViewingReport(null); }}
            style={{ marginBottom: '1rem' }}
          >
            ← Back to input
          </button>

          {/* Farmer Summary */}
          {displayReport.farmerSummary && (
            <div className="farmer-summary-card">
              <h3>🌱 Your Soil Summary</h3>
              <p>{displayReport.farmerSummary}</p>
            </div>
          )}

          {/* Source info */}
          <p className="results-count">
            {displayReport.source === 'pdf' ? `📄 From: ${displayReport.originalFileName}` : '✏️ Manual entry'} 
            {' · '}{formatDate(displayReport.createdAt)}
          </p>

          {/* Analysis Table */}
          <div className="analysis-table">
            <div className="analysis-header">
              <span>Parameter</span>
              <span>Value</span>
              <span>Rating</span>
              <span>Recommendation</span>
            </div>
            {displayReport.analysis.map((a, i) => (
              <div key={i} className="analysis-row">
                <span className="analysis-param">{a.parameter}</span>
                <span className="analysis-value">{a.value}</span>
                <span className={`analysis-rating ${getRatingClass(a.rating)}`}>{a.rating}</span>
                <span className="analysis-rec">{a.recommendation}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past Reports */}
      {!displayReport && (
        <section className="past-reports-section">
          <h3 className="section-title">Past Reports</h3>

          {loadingReports && (
            <div className="loading-inline">
              <div className="spinner"></div>
              <p>Loading reports…</p>
            </div>
          )}

          {!loadingReports && pastReports.length === 0 && (
            <div className="empty-feature-state">
              <span className="empty-icon">📭</span>
              <p>No soil reports yet. Upload a PDF or enter values above to get your first analysis.</p>
            </div>
          )}

          {!loadingReports && pastReports.length > 0 && (
            <div className="past-reports-list">
              {pastReports.map((r) => (
                <button
                  key={r._id}
                  className="past-report-item"
                  onClick={() => setViewingReport(r)}
                >
                  <div className="past-report-info">
                    <span className="past-report-icon">{r.source === 'pdf' ? '📄' : '✏️'}</span>
                    <div>
                      <p className="past-report-title">
                        {r.source === 'pdf' ? r.originalFileName : 'Manual Entry'}
                      </p>
                      <p className="past-report-date">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="past-report-meta">
                    <span>{r.analysis.length} parameters</span>
                    <span className="past-report-arrow">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
