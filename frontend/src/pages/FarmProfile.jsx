import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import indianStates from '../data/indianStates';

const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay', 'Loamy', 'Unknown'];
const IRRIGATION = ['Canal', 'Borewell', 'Rainfed', 'Tank', 'River', 'Other'];

export default function FarmProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCropForm, setShowCropForm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Farm create/edit form
  const [farmForm, setFarmForm] = useState({
    farmName: '', totalAreaAcres: '', village: '',
    district: user?.district || '', state: user?.state || '',
    soilType: 'Unknown', irrigationSource: 'Rainfed',
  });

  // Crop form
  const [cropForm, setCropForm] = useState({
    name: '', variety: '', areaAcres: '', sowingDate: '', expectedHarvestDate: '',
  });

  useEffect(() => { fetchFarm(); }, []);

  const fetchFarm = async () => {
    try {
      const res = await api.get('/farm');
      setFarm(res.data.farm);
    } catch (err) {
      if (err.response?.status === 404) {
        setShowCreateForm(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarm = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await api.post('/farm', {
        ...farmForm, totalAreaAcres: parseFloat(farmForm.totalAreaAcres),
      });
      setFarm(res.data.farm);
      setShowCreateForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create farm');
    } finally { setSubmitting(false); }
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await api.post('/farm/crops', {
        ...cropForm, areaAcres: parseFloat(cropForm.areaAcres),
      });
      setFarm(res.data.farm);
      setShowCropForm(false);
      setCropForm({ name: '', variety: '', areaAcres: '', sowingDate: '', expectedHarvestDate: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add crop');
    } finally { setSubmitting(false); }
  };

  const handleCropStatus = async (cropId, status) => {
    try {
      const res = await api.put(`/farm/crops/${cropId}`, { status });
      setFarm(res.data.farm);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update crop');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (loading) return (
    <div className="dashboard feature-page">
      <div className="loading-inline"><div className="spinner"></div><p>Loading farm profile…</p></div>
    </div>
  );

  const activeCrops = farm?.crops?.filter(c => c.status === 'active') || [];
  const pastCrops = farm?.crops?.filter(c => c.status !== 'active') || [];

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
        <span className="feature-hero-icon">🏡</span>
        <div>
          <h2>My Farm</h2>
          <p>{farm ? (farm.farmName || 'Your farm profile') : 'Set up your farm profile'}</p>
        </div>
      </section>

      {error && <div className="alert alert-error"><span>⚠️</span><p>{error}</p></div>}

      {/* Create Farm Form */}
      {showCreateForm && !farm && (
        <section className="card booking-form-card">
          <h3>🌱 Create Your Farm Profile</h3>
          <form onSubmit={handleCreateFarm} className="booking-form">
            <div className="form-row">
              <div className="form-group">
                <label>Farm Name <span className="label-optional">optional</span></label>
                <input type="text" className="form-input" value={farmForm.farmName}
                  onChange={(e) => setFarmForm({...farmForm, farmName: e.target.value})}
                  placeholder="e.g. Khan Farm" />
              </div>
              <div className="form-group">
                <label>Total Area (acres) *</label>
                <input type="number" className="form-input" value={farmForm.totalAreaAcres}
                  onChange={(e) => setFarmForm({...farmForm, totalAreaAcres: e.target.value})}
                  step="0.1" min="0.1" required placeholder="e.g. 5" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Village *</label>
                <input type="text" className="form-input" value={farmForm.village}
                  onChange={(e) => setFarmForm({...farmForm, village: e.target.value})}
                  required placeholder="Your village" />
              </div>
              <div className="form-group">
                <label>District *</label>
                <input type="text" className="form-input" value={farmForm.district}
                  onChange={(e) => setFarmForm({...farmForm, district: e.target.value})}
                  required placeholder="Your district" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>State *</label>
                <select className="form-select" value={farmForm.state}
                  onChange={(e) => setFarmForm({...farmForm, state: e.target.value})} required>
                  <option value="">Select state</option>
                  {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Soil Type</label>
                <select className="form-select" value={farmForm.soilType}
                  onChange={(e) => setFarmForm({...farmForm, soilType: e.target.value})}>
                  {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Irrigation Source</label>
                <select className="form-select" value={farmForm.irrigationSource}
                  onChange={(e) => setFarmForm({...farmForm, irrigationSource: e.target.value})}>
                  {IRRIGATION.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : '🏡 Create Farm Profile'}
            </button>
          </form>
        </section>
      )}

      {/* Farm Overview */}
      {farm && (
        <>
          <section className="farm-overview-card card">
            <div className="farm-details-grid">
              <div className="farm-detail"><span className="farm-detail-label">📍 Location</span><span>{farm.village}, {farm.district}, {farm.state}</span></div>
              <div className="farm-detail"><span className="farm-detail-label">📐 Total Area</span><span>{farm.totalAreaAcres} acres</span></div>
              <div className="farm-detail"><span className="farm-detail-label">🪨 Soil Type</span><span>{farm.soilType}</span></div>
              <div className="farm-detail"><span className="farm-detail-label">💧 Irrigation</span><span>{farm.irrigationSource}</span></div>
            </div>
          </section>

          {/* Active Crops */}
          <section className="crops-section">
            <div className="section-header">
              <h3 className="section-title">🌱 Active Crops ({activeCrops.length})</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCropForm(!showCropForm)}>
                {showCropForm ? '✕ Cancel' : '+ Add Crop'}
              </button>
            </div>

            {showCropForm && (
              <div className="card booking-form-card" style={{marginTop: '0.75rem'}}>
                <form onSubmit={handleAddCrop} className="booking-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Crop Name *</label>
                      <input type="text" className="form-input" value={cropForm.name}
                        onChange={(e) => setCropForm({...cropForm, name: e.target.value})}
                        required placeholder="e.g. Wheat, Rice, Tomato" />
                    </div>
                    <div className="form-group">
                      <label>Variety <span className="label-optional">optional</span></label>
                      <input type="text" className="form-input" value={cropForm.variety}
                        onChange={(e) => setCropForm({...cropForm, variety: e.target.value})}
                        placeholder="e.g. HD-2967" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Area (acres) *</label>
                      <input type="number" className="form-input" value={cropForm.areaAcres}
                        onChange={(e) => setCropForm({...cropForm, areaAcres: e.target.value})}
                        step="0.1" min="0.1" required />
                    </div>
                    <div className="form-group">
                      <label>Sowing Date *</label>
                      <input type="date" className="form-input" value={cropForm.sowingDate}
                        onChange={(e) => setCropForm({...cropForm, sowingDate: e.target.value})}
                        required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expected Harvest <span className="label-optional">optional</span></label>
                      <input type="date" className="form-input" value={cropForm.expectedHarvestDate}
                        onChange={(e) => setCropForm({...cropForm, expectedHarvestDate: e.target.value})} />
                    </div>
                    <div className="form-group"></div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Adding…' : '🌱 Add Crop'}
                  </button>
                </form>
              </div>
            )}

            {activeCrops.length === 0 && !showCropForm && (
              <div className="empty-feature-state">
                <span className="empty-icon">🌾</span>
                <p>No active crops. Add your first crop to get care timelines!</p>
              </div>
            )}

            <div className="crops-grid">
              {activeCrops.map(crop => (
                <div key={crop._id} className="crop-card crop-active">
                  <div className="crop-card-header">
                    <h4>{crop.name}{crop.variety ? ` (${crop.variety})` : ''}</h4>
                    <span className="status-badge status-confirmed">Active</span>
                  </div>
                  <div className="crop-card-details">
                    <span>📐 {crop.areaAcres} acres</span>
                    <span>🌱 Sown: {formatDate(crop.sowingDate)}</span>
                    {crop.expectedHarvestDate && <span>🌾 Harvest: {formatDate(crop.expectedHarvestDate)}</span>}
                  </div>
                  <div className="crop-card-actions">
                    <Link to={`/farmer/crop-calendar/${crop._id}`} className="btn btn-primary btn-sm">
                      📅 Care Timeline
                    </Link>
                    <button className="btn btn-outline btn-sm" onClick={() => handleCropStatus(crop._id, 'harvested')}>
                      ✅ Harvested
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Past Crops */}
          {pastCrops.length > 0 && (
            <section className="crops-section">
              <h3 className="section-title">📦 Past Crops ({pastCrops.length})</h3>
              <div className="crops-grid">
                {pastCrops.map(crop => (
                  <div key={crop._id} className="crop-card crop-past">
                    <div className="crop-card-header">
                      <h4>{crop.name}{crop.variety ? ` (${crop.variety})` : ''}</h4>
                      <span className={`status-badge ${crop.status === 'harvested' ? 'status-completed' : 'status-cancelled'}`}>
                        {crop.status}
                      </span>
                    </div>
                    <div className="crop-card-details">
                      <span>📐 {crop.areaAcres} acres</span>
                      <span>🌱 Sown: {formatDate(crop.sowingDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
