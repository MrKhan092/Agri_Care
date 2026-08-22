import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import indianStates from '../data/indianStates';

export default function LandRecords() {
  const { user, logout } = useAuth();
  const [state, setState] = useState(user?.state || '');

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
        <span className="feature-hero-icon">📜</span>
        <div>
          <h2>Land Records</h2>
          <p>Access official land records (Bhulekh) for your state</p>
        </div>
      </section>

      {/* State Selector */}
      <section className="land-state-selector">
        <div className="filter-group">
          <label htmlFor="land-state">Select State</label>
          <select
            id="land-state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="form-select"
          >
            <option value="">Select your state</option>
            {indianStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Content based on state selection */}
      <section className="land-content">
        {!state && (
          <div className="empty-feature-state">
            <span className="empty-icon">👆</span>
            <p>Select your state above to check land records availability.</p>
          </div>
        )}

        {state === 'Uttar Pradesh' && (
          <div className="land-up-section">
            <div className="card land-instructions-card">
              <h3>📋 UP Bhulekh — How to Check Your Land Records</h3>
              <p className="land-instructions-intro">
                Follow these steps on the official UP Bhulekh portal to view your land records:
              </p>
              <ol className="land-steps">
                <li>
                  <strong>Select your District</strong> — Choose your district (जनपद) from the dropdown menu.
                </li>
                <li>
                  <strong>Select your Tehsil</strong> — Choose your tehsil (तहसील) from the list.
                </li>
                <li>
                  <strong>Select your Village</strong> — Choose your village (ग्राम) from the options.
                </li>
                <li>
                  <strong>Search by one of these methods:</strong>
                  <ul className="land-sub-steps">
                    <li>🔢 <strong>Khasra/Gata number</strong> (खसरा/गाटा संख्या)</li>
                    <li>👤 <strong>Owner name</strong> (खातेदार का नाम)</li>
                    <li>📄 <strong>Account number</strong> (खाता संख्या)</li>
                  </ul>
                </li>
                <li>
                  <strong>View your Record of Rights (ROR)</strong> — The portal will display your land ownership details.
                </li>
              </ol>

              <a
                href="https://upbhulekh.gov.in/#/selection"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-bhulekh"
              >
                🔗 Open UP Bhulekh Portal
              </a>
            </div>

            <div className="land-disclaimer">
              <span className="disclaimer-icon">ℹ️</span>
              <p>
                This button links to the <strong>official UP government portal</strong>. 
                AgriCare does not store, access, or modify any land record data. 
                All records are maintained by the Revenue Department, Government of Uttar Pradesh.
              </p>
            </div>
          </div>
        )}

        {state && state !== 'Uttar Pradesh' && (
          <div className="land-coming-soon">
            <div className="card land-coming-soon-card">
              <span className="coming-soon-icon">🚧</span>
              <h3>Coming Soon for {state}</h3>
              <p>
                Land records access for <strong>{state}</strong> is currently under development. 
                We're working on integrating state-specific land record portals.
              </p>
              <p className="coming-soon-note">
                Currently, this feature is only available for <strong>Uttar Pradesh</strong> (UP Bhulekh).
                Support for more states will be added in future updates.
              </p>
            </div>

            <div className="land-disclaimer">
              <span className="disclaimer-icon">ℹ️</span>
              <p>
                AgriCare provides links to official government portals for land records. 
                We do not store, access, or modify any land record data.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
