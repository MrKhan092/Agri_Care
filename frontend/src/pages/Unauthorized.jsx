import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-card status-card">
        <div className="auth-header">
          <span className="auth-icon">🚫</span>
          <h1>Access Denied</h1>
          <p>You don't have permission to view this page.</p>
        </div>

        <div className="alert alert-error">
          Your role (<strong>{user?.role || 'unknown'}</strong>) does not have access
          to the requested resource.
        </div>

        <Link
          to={
            user?.role === 'admin'
              ? '/admin/dashboard'
              : user?.role === 'farmer'
                ? '/farmer/dashboard'
                : user?.role === 'supplier'
                  ? '/supplier/dashboard'
                  : '/login'
          }
          className="btn btn-primary"
          style={{ width: '100%', textDecoration: 'none' }}
        >
          Go to My Dashboard
        </Link>
      </div>
    </div>
  );
}
