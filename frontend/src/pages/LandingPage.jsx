import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🏪', title: 'Mandi Prices', desc: 'Real-time commodity prices from markets across India' },
  { icon: '🌤️', title: 'Weather Forecast', desc: '5-day hyperlocal forecasts for smarter farming decisions' },
  { icon: '🧪', title: 'Soil Analysis', desc: 'AI-powered soil health reports with actionable recommendations' },
  { icon: '📅', title: 'Crop Calendar', desc: 'Stage-by-stage care timelines for 15+ crops' },
  { icon: '💰', title: 'Farm Management', desc: 'Track expenses, income, and inventory in one place' },
  { icon: '🏛️', title: 'Govt Schemes', desc: 'Central & state subsidies, insurance, and credit info' },
];

const STATS = [
  { value: '15+', label: 'Crop Timelines' },
  { value: '20+', label: 'Govt Schemes' },
  { value: '1000+', label: 'Mandi Markets' },
  { value: 'Free', label: 'AI Analysis' },
];

export default function LandingPage() {
  const { user } = useAuth();

  const dashboardPath = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'supplier'
      ? '/supplier/dashboard'
      : '/farmer/dashboard'
    : null;

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <span className="landing-logo-icon">🌾</span>
            <span className="landing-logo-text">AgriCare</span>
          </Link>
          <div className="landing-nav-links">
            {user ? (
              <Link to={dashboardPath} className="btn-landing btn-landing-primary">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-landing btn-landing-ghost">Login</Link>
                <Link to="/register" className="btn-landing btn-landing-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>
        <div className="hero-content">
          <span className="hero-badge">🚀 India's Smart Farming Platform</span>
          <h1 className="hero-title">
            Empowering Farmers with
            <span className="hero-gradient-text"> Modern Technology</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered soil analysis, real-time mandi prices, crop care timelines, 
            weather forecasts, and government scheme info — all in one app, 
            built for Indian farmers.
          </p>
          <div className="hero-cta">
            {user ? (
              <Link to={dashboardPath} className="btn-landing btn-landing-hero">
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-landing btn-landing-hero">
                  Start Free — No Card Needed
                </Link>
                <Link to="/login" className="btn-landing btn-landing-hero-outline">
                  I have an account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Floating cards decoration */}
        <div className="hero-floating-cards">
          <div className="hero-float-card hfc-1">
            <span>🌾</span>
            <div><strong>Wheat</strong><small>₹2,450/quintal</small></div>
          </div>
          <div className="hero-float-card hfc-2">
            <span>🌤️</span>
            <div><strong>27°C</strong><small>Clear sky</small></div>
          </div>
          <div className="hero-float-card hfc-3">
            <span>🧪</span>
            <div><strong>pH 6.8</strong><small>Optimal</small></div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats">
        {STATS.map((s, i) => (
          <div key={i} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-section-header">
          <span className="section-badge">Features</span>
          <h2>Everything a modern farmer needs</h2>
          <p>From sowing to selling — AgriCare covers your entire farming journey</p>
        </div>
        <div className="features-grid-landing">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card-landing">
              <span className="fcl-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <div className="landing-section-header">
          <span className="section-badge">How It Works</span>
          <h2>Get started in 3 simple steps</h2>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-num">1</div>
            <h3>Create Account</h3>
            <p>Sign up free as a Farmer, Supplier, or Admin — takes 30 seconds</p>
          </div>
          <div className="how-step-connector">→</div>
          <div className="how-step">
            <div className="how-step-num">2</div>
            <h3>Set Up Your Farm</h3>
            <p>Add your farm profile, soil type, crops, and location</p>
          </div>
          <div className="how-step-connector">→</div>
          <div className="how-step">
            <div className="how-step-num">3</div>
            <h3>Start Farming Smarter</h3>
            <p>Get AI recommendations, track expenses, and access mandi prices</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="cta-glow"></div>
        <h2>Ready to transform your farming?</h2>
        <p>Join thousands of Indian farmers using AgriCare to grow smarter, earn more, and farm sustainably.</p>
        {!user && (
          <Link to="/register" className="btn-landing btn-landing-hero">
            Create Free Account →
          </Link>
        )}
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-brand">
            <span>🌾</span> AgriCare
          </div>
          <p>Built with ❤️ for Indian farmers</p>
        </div>
      </footer>
    </div>
  );
}
