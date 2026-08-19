import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [role, setRole] = useState('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email, password);
      const userRole = data.user.role;

      // Verify the user's actual role matches what they selected
      if (userRole !== role) {
        setError(`This account is registered as a ${userRole}, not a ${role}.`);
        // Still redirect to their actual dashboard
        return;
      }

      if (userRole === 'admin') navigate('/admin/dashboard');
      else if (userRole === 'farmer') navigate('/farmer/dashboard');
      else if (userRole === 'supplier') navigate('/supplier/dashboard');
      else navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const roleConfig = {
    admin: { icon: '🛡️', label: 'Admin' },
    farmer: { icon: '🌾', label: 'Farmer' },
    supplier: { icon: '📦', label: 'Supplier' },
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">{roleConfig[role].icon}</span>
          <h1>Welcome Back</h1>
          <p>Sign in as {roleConfig[role].label}</p>
        </div>

        {/* Role selector */}
        <div className="login-role-selector">
          {Object.entries(roleConfig).map(([key, { icon, label }]) => (
            <button
              key={key}
              type="button"
              className={`role-btn ${role === key ? 'role-btn-active' : ''}`}
              onClick={() => { setRole(key); setError(''); }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Signing in…' : `Sign In as ${roleConfig[role].label}`}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
