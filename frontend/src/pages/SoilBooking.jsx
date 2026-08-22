import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import indianStates from '../data/indianStates';

const TIME_SLOTS = ['Morning (8am-12pm)', 'Afternoon (12pm-4pm)', 'Evening (4pm-6pm)'];
const STATUS_STYLES = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
};

export default function SoilBooking() {
  const { user, logout } = useAuth();

  // Form state
  const [form, setForm] = useState({
    preferredDate: '',
    timeSlot: '',
    village: '',
    district: user?.district || '',
    state: user?.state || '',
    phone: '',
    landAreaAcres: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Bookings list
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/soil-test/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/soil-test/book', {
        ...form,
        landAreaAcres: form.landAreaAcres ? parseFloat(form.landAreaAcres) : null,
      });
      setSuccess(true);
      setForm({
        preferredDate: '',
        timeSlot: '',
        village: '',
        district: user?.district || '',
        state: user?.state || '',
        phone: '',
        landAreaAcres: '',
        notes: '',
      });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book soil test');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
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
        <span className="feature-hero-icon">🧪</span>
        <div>
          <h2>Book Soil Test</h2>
          <p>Schedule a soil testing visit for your farm</p>
        </div>
      </section>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          <div>
            <strong>Booking confirmed!</strong>
            <p>Your soil test has been booked. You'll be contacted to confirm the visit.</p>
          </div>
        </div>
      )}

      {/* Booking Form */}
      <section className="card booking-form-card">
        <h3>📋 New Booking</h3>
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferredDate">Preferred Date *</label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={form.preferredDate}
                onChange={handleChange}
                min={today}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="timeSlot">Time Slot *</label>
              <select
                id="timeSlot"
                name="timeSlot"
                value={form.timeSlot}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select time slot</option>
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="village">Village *</label>
              <input
                type="text"
                id="village"
                name="village"
                value={form.village}
                onChange={handleChange}
                placeholder="Your village name"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="booking-district">District *</label>
              <input
                type="text"
                id="booking-district"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="Your district"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="booking-state">State *</label>
              <select
                id="booking-state"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select state</option>
                {indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="landAreaAcres">Land Area (acres) <span className="label-optional">optional</span></label>
              <input
                type="number"
                id="landAreaAcres"
                name="landAreaAcres"
                value={form.landAreaAcres}
                onChange={handleChange}
                placeholder="e.g. 2.5"
                step="0.1"
                min="0"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="notes">Notes <span className="label-optional">optional</span></label>
              <input
                type="text"
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any special instructions"
                className="form-input"
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Booking…' : '📅 Book Soil Test'}
          </button>
        </form>
      </section>

      {/* My Bookings */}
      <section className="bookings-section">
        <h3 className="section-title">My Bookings</h3>

        {loadingBookings && (
          <div className="loading-inline">
            <div className="spinner"></div>
            <p>Loading bookings…</p>
          </div>
        )}

        {!loadingBookings && bookings.length === 0 && (
          <div className="empty-feature-state">
            <span className="empty-icon">📭</span>
            <p>No bookings yet. Fill out the form above to schedule your first soil test.</p>
          </div>
        )}

        {!loadingBookings && bookings.length > 0 && (
          <div className="bookings-list">
            {bookings.map((b) => (
              <div key={b._id} className="booking-card">
                <div className="booking-card-top">
                  <div className="booking-date-slot">
                    <span className="booking-date">📅 {formatDate(b.preferredDate)}</span>
                    <span className="booking-slot">🕐 {b.timeSlot}</span>
                  </div>
                  <span className={`status-badge ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <div className="booking-card-details">
                  <span>📍 {b.village}, {b.district}, {b.state}</span>
                  <span>📞 {b.phone}</span>
                  {b.landAreaAcres && <span>📐 {b.landAreaAcres} acres</span>}
                  {b.notes && <span>📝 {b.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
