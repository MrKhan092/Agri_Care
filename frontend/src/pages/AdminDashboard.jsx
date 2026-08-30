import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchDashboard = async () => {
    try {
      const [dashRes, usersRes] = await Promise.all([
        api.get('/dashboard/admin'),
        api.get('/admin/users', {
          params: {
            ...(filterRole && { role: filterRole }),
          },
        }),
      ]);
      setStats(dashRes.data.data);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filterRole]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/users/${id}`);
      await fetchDashboard();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading admin dashboard…</p>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="brand-icon">🌾</span>
          <h1>AgriCare</h1>
          <span className="role-badge role-admin">Admin</span>
        </div>
        <div className="dashboard-user">
          <span className="user-greeting">Hi, {user?.name}</span>
          <button onClick={logout} className="btn btn-outline btn-sm">
            Logout
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div>
            <p className="stat-value">{stats?.totalUsers ?? '—'}</p>
            <p className="stat-label">Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🌾</span>
          <div>
            <p className="stat-value">{stats?.totalFarmers ?? '—'}</p>
            <p className="stat-label">Farmers</p>
          </div>
        </div>
      </section>

      {/* User Management */}
      <section className="card admin-users-card">
        <div className="admin-users-header">
          <h2>User Management</h2>
          <div className="admin-filters">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="">All Roles</option>
              <option value="farmer">Farmer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {users.length === 0 ? (
          <p className="empty-state">No users found</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td className="email-cell">{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>{u.role}</span>
                    </td>
                    <td className="date-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="actions-cell">
                      {u.role !== 'admin' && (
                        <button
                          className="btn btn-action btn-delete"
                          onClick={() => handleDelete(u._id, u.name)}
                          disabled={actionLoading === u._id}
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
