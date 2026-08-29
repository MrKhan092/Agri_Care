import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const EXPENSE_CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticide', 'Labour', 'Irrigation', 'Equipment', 'Transport', 'Other'];
const INCOME_CATEGORIES = ['Crop Sale', 'Subsidy', 'Lease Income', 'Other'];
const INVENTORY_CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Fuel', 'Other'];
const UNITS = ['kg', 'litres', 'bags', 'packets', 'units', 'tonnes'];

const CHART_COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function FarmManagement() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txnFilter, setTxnFilter] = useState({ type: '', category: '' });
  const [txnForm, setTxnForm] = useState({
    type: 'expense', category: '', amount: '', description: '', date: '', relatedCrop: '',
  });
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Summary state
  const [summary, setSummary] = useState(null);

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [invForm, setInvForm] = useState({
    itemName: '', category: 'Other', quantity: '', unit: 'units', lowStockThreshold: '',
  });
  const [showInvForm, setShowInvForm] = useState(false);

  // ─── Fetch helpers ─────────────────────────────────────────

  const fetchTransactions = useCallback(async () => {
    try {
      const params = {};
      if (txnFilter.type) params.type = txnFilter.type;
      if (txnFilter.category) params.category = txnFilter.category;
      const res = await api.get('/farm-management/transactions', { params });
      setTransactions(res.data.transactions || []);
    } catch (err) {
      if (err.response?.status !== 404) setError(err.response?.data?.message || 'Failed to load transactions');
    }
  }, [txnFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/farm-management/summary');
      setSummary(res.data);
    } catch (err) {
      if (err.response?.status !== 404) setError(err.response?.data?.message || 'Failed to load summary');
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await api.get('/farm-management/inventory');
      setInventory(res.data.items || []);
    } catch (err) {
      if (err.response?.status !== 404) setError(err.response?.data?.message || 'Failed to load inventory');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchSummary(), fetchInventory()]);
      setLoading(false);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // ─── Transaction handlers ─────────────────────────────────

  const handleAddTxn = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/farm-management/transactions', {
        ...txnForm,
        amount: parseFloat(txnForm.amount),
      });
      setTxnForm({ type: 'expense', category: '', amount: '', description: '', date: '', relatedCrop: '' });
      setShowTxnForm(false);
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add transaction');
    } finally { setSubmitting(false); }
  };

  const handleDeleteTxn = async (id) => {
    try {
      await api.delete(`/farm-management/transactions/${id}`);
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  // ─── Inventory handlers ───────────────────────────────────

  const handleAddInv = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/farm-management/inventory', {
        ...invForm,
        quantity: parseFloat(invForm.quantity),
        lowStockThreshold: invForm.lowStockThreshold ? parseFloat(invForm.lowStockThreshold) : null,
      });
      setInvForm({ itemName: '', category: 'Other', quantity: '', unit: 'units', lowStockThreshold: '' });
      setShowInvForm(false);
      await fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally { setSubmitting(false); }
  };

  const handleInvQuantity = async (id, delta) => {
    const item = inventory.find(i => i._id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    try {
      await api.put(`/farm-management/inventory/${id}`, { quantity: newQty });
      await fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDeleteInv = async (id) => {
    try {
      await api.delete(`/farm-management/inventory/${id}`);
      await fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  // ─── Helpers ──────────────────────────────────────────────

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const categories = txnForm.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Chart data
  const chartData = summary?.categoryBreakdown?.map(b => ({
    name: `${b.category} (${b.type})`,
    amount: b.total,
    type: b.type,
  })) || [];

  // ─── Render ───────────────────────────────────────────────

  if (loading) return (
    <div className="dashboard feature-page">
      <div className="loading-inline"><div className="spinner"></div><p>Loading farm management…</p></div>
    </div>
  );

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
        <span className="feature-hero-icon">💰</span>
        <div>
          <h2>Farm Management</h2>
          <p>Track expenses, income, and inventory for your farm</p>
        </div>
      </section>

      {error && <div className="alert alert-error"><span>⚠️</span><p>{error}</p></div>}

      {/* Tab Bar */}
      <div className="mgmt-tabs">
        <button className={`mgmt-tab ${activeTab === 'transactions' ? 'mgmt-tab-active' : ''}`}
          onClick={() => setActiveTab('transactions')}>
          📝 Transactions
        </button>
        <button className={`mgmt-tab ${activeTab === 'summary' ? 'mgmt-tab-active' : ''}`}
          onClick={() => setActiveTab('summary')}>
          📊 Summary
        </button>
        <button className={`mgmt-tab ${activeTab === 'inventory' ? 'mgmt-tab-active' : ''}`}
          onClick={() => setActiveTab('inventory')}>
          📦 Inventory
        </button>
      </div>

      {/* ═══ Transactions Tab ═══ */}
      {activeTab === 'transactions' && (
        <section className="mgmt-section">
          <div className="section-header">
            <h3 className="section-title">Transactions</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTxnForm(!showTxnForm)}>
              {showTxnForm ? '✕ Cancel' : '+ Add Transaction'}
            </button>
          </div>

          {showTxnForm && (
            <div className="card booking-form-card" style={{ marginTop: '0.75rem' }}>
              <form onSubmit={handleAddTxn} className="booking-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <div className="txn-type-toggle">
                      <button type="button"
                        className={`toggle-btn ${txnForm.type === 'expense' ? 'toggle-active toggle-expense' : ''}`}
                        onClick={() => setTxnForm({ ...txnForm, type: 'expense', category: '' })}>
                        📤 Expense
                      </button>
                      <button type="button"
                        className={`toggle-btn ${txnForm.type === 'income' ? 'toggle-active toggle-income' : ''}`}
                        onClick={() => setTxnForm({ ...txnForm, type: 'income', category: '' })}>
                        📥 Income
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select className="form-select" value={txnForm.category}
                      onChange={(e) => setTxnForm({ ...txnForm, category: e.target.value })} required>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" className="form-input" value={txnForm.amount}
                      onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                      min="0" step="0.01" required placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" className="form-input" value={txnForm.date}
                      onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Description <span className="label-optional">optional</span></label>
                    <input type="text" className="form-input" value={txnForm.description}
                      onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
                      placeholder="e.g. Purchased DAP fertilizer" />
                  </div>
                  <div className="form-group">
                    <label>Related Crop <span className="label-optional">optional</span></label>
                    <input type="text" className="form-input" value={txnForm.relatedCrop}
                      onChange={(e) => setTxnForm({ ...txnForm, relatedCrop: e.target.value })}
                      placeholder="e.g. Wheat" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding…' : '💰 Add Transaction'}
                </button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="txn-filters">
            <select className="form-select form-select-sm" value={txnFilter.type}
              onChange={(e) => setTxnFilter({ ...txnFilter, type: e.target.value })}>
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Transactions Table */}
          {transactions.length === 0 ? (
            <div className="empty-feature-state">
              <span className="empty-icon">📭</span>
              <p>No transactions yet. Add your first expense or income!</p>
            </div>
          ) : (
            <div className="txn-table-wrapper">
              <table className="txn-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(txn => (
                    <tr key={txn._id} className={txn.type === 'income' ? 'txn-row-income' : 'txn-row-expense'}>
                      <td>{formatDate(txn.date)}</td>
                      <td>
                        <span className={`txn-type-badge txn-type-${txn.type}`}>
                          {txn.type === 'income' ? '📥' : '📤'} {txn.type}
                        </span>
                      </td>
                      <td>{txn.category}</td>
                      <td className={`txn-amount ${txn.type === 'income' ? 'txn-amount-income' : 'txn-amount-expense'}`}>
                        {txn.type === 'income' ? '+' : '−'}{formatCurrency(txn.amount)}
                      </td>
                      <td className="txn-desc">{txn.description || '—'}</td>
                      <td>
                        <button className="btn-icon btn-delete" onClick={() => handleDeleteTxn(txn._id)} title="Delete">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══ Summary Tab ═══ */}
      {activeTab === 'summary' && (
        <section className="mgmt-section">
          <h3 className="section-title">Financial Summary</h3>

          {!summary ? (
            <div className="empty-feature-state">
              <span className="empty-icon">📊</span>
              <p>No financial data yet. Add transactions to see your summary.</p>
            </div>
          ) : (
            <>
              <div className="summary-cards">
                <div className="summary-card summary-income">
                  <span className="summary-card-icon">📥</span>
                  <div>
                    <p className="summary-card-label">Total Income</p>
                    <p className="summary-card-value">{formatCurrency(summary.totalIncome)}</p>
                  </div>
                </div>
                <div className="summary-card summary-expense">
                  <span className="summary-card-icon">📤</span>
                  <div>
                    <p className="summary-card-label">Total Expenses</p>
                    <p className="summary-card-value">{formatCurrency(summary.totalExpense)}</p>
                  </div>
                </div>
                <div className={`summary-card ${summary.netProfit >= 0 ? 'summary-profit' : 'summary-loss'}`}>
                  <span className="summary-card-icon">{summary.netProfit >= 0 ? '📈' : '📉'}</span>
                  <div>
                    <p className="summary-card-label">Net {summary.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
                    <p className="summary-card-value">{formatCurrency(Math.abs(summary.netProfit))}</p>
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="chart-card card">
                  <h4>Breakdown by Category</h4>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                        <Tooltip
                          formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.type === 'income' ? '#16a34a' : CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ═══ Inventory Tab ═══ */}
      {activeTab === 'inventory' && (
        <section className="mgmt-section">
          <div className="section-header">
            <h3 className="section-title">Inventory</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvForm(!showInvForm)}>
              {showInvForm ? '✕ Cancel' : '+ Add Item'}
            </button>
          </div>

          {showInvForm && (
            <div className="card booking-form-card" style={{ marginTop: '0.75rem' }}>
              <form onSubmit={handleAddInv} className="booking-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Item Name *</label>
                    <input type="text" className="form-input" value={invForm.itemName}
                      onChange={(e) => setInvForm({ ...invForm, itemName: e.target.value })}
                      required placeholder="e.g. DAP Fertilizer" />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-select" value={invForm.category}
                      onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}>
                      {INVENTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input type="number" className="form-input" value={invForm.quantity}
                      onChange={(e) => setInvForm({ ...invForm, quantity: e.target.value })}
                      min="0" step="0.1" required placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select className="form-select" value={invForm.unit}
                      onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Low Stock Threshold <span className="label-optional">optional</span></label>
                    <input type="number" className="form-input" value={invForm.lowStockThreshold}
                      onChange={(e) => setInvForm({ ...invForm, lowStockThreshold: e.target.value })}
                      min="0" step="0.1" placeholder="Alert when below this" />
                  </div>
                  <div className="form-group"></div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding…' : '📦 Add Item'}
                </button>
              </form>
            </div>
          )}

          {inventory.length === 0 ? (
            <div className="empty-feature-state">
              <span className="empty-icon">📦</span>
              <p>No inventory items yet. Track your seeds, fertilizers, and more!</p>
            </div>
          ) : (
            <div className="inv-grid">
              {inventory.map(item => (
                <div key={item._id} className={`inv-card ${item.isLowStock ? 'inv-low-stock' : ''}`}>
                  <div className="inv-card-header">
                    <h4>{item.itemName}</h4>
                    <span className="inv-category-badge">{item.category}</span>
                  </div>
                  <div className="inv-card-body">
                    <div className="inv-quantity">
                      <button className="btn-icon qty-btn" onClick={() => handleInvQuantity(item._id, -1)}>−</button>
                      <span className="inv-qty-value">
                        {item.quantity} <small>{item.unit}</small>
                      </span>
                      <button className="btn-icon qty-btn" onClick={() => handleInvQuantity(item._id, 1)}>+</button>
                    </div>
                    {item.isLowStock && (
                      <span className="low-stock-badge">⚠️ Low Stock</span>
                    )}
                  </div>
                  <div className="inv-card-footer">
                    <span className="inv-threshold">
                      {item.lowStockThreshold !== null ? `Alert below ${item.lowStockThreshold} ${item.unit}` : 'No threshold set'}
                    </span>
                    <button className="btn-icon btn-delete" onClick={() => handleDeleteInv(item._id)} title="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
