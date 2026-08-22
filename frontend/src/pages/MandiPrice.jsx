import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import indianStates from '../data/indianStates';

export default function MandiPrice() {
  const { user, logout } = useAuth();

  const [state, setState] = useState(user?.state || '');
  const [districts, setDistricts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [allRecords, setAllRecords] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');

  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Fetch data when state changes
  const fetchMandiData = async (selectedState) => {
    if (!selectedState) return;
    setLoading(true);
    setError('');
    setSearched(true);
    setDistricts([]);
    setMarkets([]);
    setCommodities([]);
    setSelectedDistrict('');
    setSelectedMarket('');
    setSelectedCommodity('');
    setAllRecords([]);
    setFilteredRecords([]);

    try {
      const res = await api.get('/mandi-price', { params: { state: selectedState } });
      const data = res.data;

      if (data.message && data.records?.length === 0) {
        setError(data.message);
        return;
      }

      setAllRecords(data.records || []);
      setDistricts(data.districts || []);
      setMarkets(data.markets || []);
      setCommodities(data.commodities || []);
      setFilteredRecords(data.records || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mandi prices');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial mount if state is already pre-filled (e.g. from user profile)
  useEffect(() => {
    if (state) {
      fetchMandiData(state);
    }
  }, []); // run once on mount only

  // Filter records locally when dropdown selections change
  useEffect(() => {
    let filtered = [...allRecords];
    if (selectedDistrict) {
      filtered = filtered.filter((r) => r.district === selectedDistrict);
    }
    if (selectedMarket) {
      filtered = filtered.filter((r) => r.market === selectedMarket);
    }
    if (selectedCommodity) {
      filtered = filtered.filter((r) => r.commodity === selectedCommodity);
    }
    setFilteredRecords(filtered);

    // Update dependent dropdowns based on current filter
    if (selectedDistrict) {
      const districtRecords = allRecords.filter((r) => r.district === selectedDistrict);
      setMarkets([...new Set(districtRecords.map((r) => r.market).filter(Boolean))].sort());
    }
  }, [selectedDistrict, selectedMarket, selectedCommodity, allRecords]);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setState(newState);
    if (newState) {
      fetchMandiData(newState);
    }
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
        <span className="feature-hero-icon">🏪</span>
        <div>
          <h2>Mandi Prices</h2>
          <p>Check today's market prices for agricultural commodities across India</p>
        </div>
      </section>

      {/* Filters */}
      <section className="filter-bar">
        <div className="filter-group">
          <label htmlFor="mandi-state">State</label>
          <select
            id="mandi-state"
            value={state}
            onChange={handleStateChange}
            className="form-select"
          >
            <option value="">Select state</option>
            {indianStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="mandi-district">District</label>
          <select
            id="mandi-district"
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedMarket('');
            }}
            className="form-select"
            disabled={districts.length === 0}
          >
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="mandi-market">Market</label>
          <select
            id="mandi-market"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="form-select"
            disabled={markets.length === 0}
          >
            <option value="">All markets</option>
            {markets.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="mandi-commodity">Commodity</label>
          <select
            id="mandi-commodity"
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="form-select"
            disabled={commodities.length === 0}
          >
            <option value="">All commodities</option>
            {commodities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Results */}
      <section className="feature-results">
        {loading && (
          <div className="loading-inline">
            <div className="spinner"></div>
            <p>Fetching mandi prices…</p>
          </div>
        )}

        {error && !loading && (
          <div className="empty-feature-state">
            <span className="empty-icon">📭</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && searched && filteredRecords.length === 0 && (
          <div className="empty-feature-state">
            <span className="empty-icon">🔍</span>
            <p>No mandi price data found for the selected filters.</p>
            <p className="empty-hint">Try changing your state, district, or commodity selection.</p>
          </div>
        )}

        {!loading && !error && !searched && (
          <div className="empty-feature-state">
            <span className="empty-icon">👆</span>
            <p>Select a state above to view today's mandi prices.</p>
          </div>
        )}

        {!loading && filteredRecords.length > 0 && (
          <>
            <p className="results-count">{filteredRecords.length} result{filteredRecords.length !== 1 ? 's' : ''} found</p>
            <div className="mandi-grid">
              {filteredRecords.map((r, i) => (
                <div key={i} className="mandi-card">
                  <div className="mandi-card-header">
                    <h3 className="mandi-commodity">{r.commodity}</h3>
                    {r.variety && r.variety !== 'Other' && (
                      <span className="mandi-variety">{r.variety}</span>
                    )}
                  </div>
                  <div className="mandi-card-body">
                    <div className="mandi-market-info">
                      <span className="mandi-market-icon">📍</span>
                      <span>{r.market}, {r.district}</span>
                    </div>
                    <div className="mandi-prices">
                      <div className="mandi-price-item">
                        <span className="price-label">Min</span>
                        <span className="price-value price-min">₹{r.min_price}</span>
                      </div>
                      <div className="mandi-price-item">
                        <span className="price-label">Modal</span>
                        <span className="price-value price-modal">₹{r.modal_price}</span>
                      </div>
                      <div className="mandi-price-item">
                        <span className="price-label">Max</span>
                        <span className="price-value price-max">₹{r.max_price}</span>
                      </div>
                    </div>
                    <p className="mandi-unit-note">per quintal (100 kg)</p>
                  </div>
                  <div className="mandi-card-footer">
                    <span className="mandi-date">📅 {r.arrival_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}