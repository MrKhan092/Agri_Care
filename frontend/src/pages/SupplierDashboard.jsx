import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function SupplierDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/supplier')
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="brand-icon">🌾</span>
          <h1>AgriCare</h1>
          <span className="role-badge role-supplier">Supplier</span>
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
          <span className="stat-icon">📦</span>
          <div>
            <p className="stat-value">{data?.totalOrders ?? '—'}</p>
            <p className="stat-label">Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div>
            <p className="stat-value">{data?.pendingOrders ?? '—'}</p>
            <p className="stat-label">Pending Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏷️</span>
          <div>
            <p className="stat-value">{data?.productsListed ?? '—'}</p>
            <p className="stat-label">Products Listed</p>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <h2>Business Details</h2>
          <div className="detail-row">
            <span className="detail-label">Business</span>
            <span className="detail-value">{data?.businessName || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Location</span>
            <span className="detail-value">{data?.businessLocation || 'Not set'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Verified</span>
            <span className={`detail-value ${data?.verified ? 'text-success' : 'text-muted'}`}>
              {data?.verified ? '✓ Verified' : 'Not yet'}
            </span>
          </div>
        </div>

        <div className="card">
          <h2>Recent Orders</h2>
          {data?.recentOrders?.length ? (
            <ul className="task-list">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="task-item">
                  <div>
                    <span className="task-name">{o.item}</span>
                    <span className="order-buyer"> — {o.buyer}</span>
                  </div>
                  <span className="task-due">{o.date}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No recent orders</p>
          )}
        </div>
      </section>
    </div>
  );
}
