import { useAuth } from '../context/AuthContext';

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-card status-card">
        <div className="auth-header">
          <span className="auth-icon">⏳</span>
          <h1>Account Pending</h1>
          <p>
            Hi {user?.name || 'there'}, your <strong>{user?.role}</strong> account
            has been created successfully!
          </p>
        </div>

        <div className="alert alert-info">
          Your account is pending admin approval. You'll be able to log in once an
          administrator reviews and approves your account.
        </div>

        <p className="pending-detail">
          We registered <strong>{user?.email}</strong> — please check back later or
          contact your administrator.
        </p>

        <button onClick={logout} className="btn btn-outline" style={{ width: '100%' }}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
