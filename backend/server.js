const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
const promBundle = require('express-prom-bundle');

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  metricsPath: '/metrics',
  promClient: { collectDefaultMetrics: {} },
});

app.use(metricsMiddleware);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/mandi-price', require('./routes/mandiPrice'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/farm-news', require('./routes/farmNews'));
app.use('/api/soil-test', require('./routes/soilTest'));
app.use('/api/farm', require('./routes/farm'));
app.use('/api/crop-calendar', require('./routes/cropCalendar'));
app.use('/api/farm-management', require('./routes/farmManagement'));
app.use('/api/schemes', require('./routes/schemes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
