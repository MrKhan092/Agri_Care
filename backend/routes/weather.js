const express = require('express');

const router = express.Router();

// In-memory cache: key -> { data, timestamp }
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// WMO Weather Code mapping to readable labels and icons
const weatherCodeMap = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Dense freezing drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌦️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Light freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Light rain showers', icon: '🌦️' },
  81: { label: 'Moderate rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers', icon: '🌧️' },
  85: { label: 'Light snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with light hail', icon: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

function getWeatherInfo(code) {
  return weatherCodeMap[code] || { label: 'Unknown', icon: '🌡️' };
}

function getCacheKey(lat, lon) {
  // Round to 2 decimals to group nearby locations
  return `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

// GET /api/weather?lat=...&lon=...
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // Validate parameters
    if (!lat || !lon) {
      return res.status(400).json({ message: 'lat and lon query parameters are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'lat and lon must be valid numbers' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'lat must be between -90 and 90, lon between -180 and 180' });
    }

    // Check cache
    const cacheKey = getCacheKey(latitude, longitude);
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Fetch from Open-Meteo
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '5');

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('Open-Meteo API error:', response.status);
      return res.status(502).json({ message: 'Failed to fetch weather data' });
    }

    const json = await response.json();

    // Build current weather
    const weatherInfo = getWeatherInfo(json.current.weather_code);
    const current = {
      temperature: json.current.temperature_2m,
      temperatureUnit: json.current_units.temperature_2m,
      humidity: json.current.relative_humidity_2m,
      windSpeed: json.current.wind_speed_10m,
      windSpeedUnit: json.current_units.wind_speed_10m,
      condition: weatherInfo.label,
      icon: weatherInfo.icon,
      time: json.current.time,
    };

    // Build 5-day forecast
    const forecast = json.daily.time.map((date, i) => {
      const dayWeather = getWeatherInfo(json.daily.weather_code[i]);
      return {
        date,
        tempMax: json.daily.temperature_2m_max[i],
        tempMin: json.daily.temperature_2m_min[i],
        temperatureUnit: json.daily_units.temperature_2m_max,
        condition: dayWeather.label,
        icon: dayWeather.icon,
        precipitationProbability: json.daily.precipitation_probability_max[i],
      };
    });

    const result = {
      location: {
        latitude: json.latitude,
        longitude: json.longitude,
        timezone: json.timezone,
        elevation: json.elevation,
      },
      current,
      forecast,
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);
  } catch (error) {
    console.error('Weather error:', error.message);
    res.status(500).json({ message: 'Server error fetching weather data', error: error.message });
  }
});

module.exports = router;
