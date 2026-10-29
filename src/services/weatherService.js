/**
 * Frontend Weather Service for FasalMitra AI
 * 
 * Communicates with the FasalMitra Backend Gateway (/api/weather)
 * keeping frontend completely decoupled from third-party weather APIs.
 * 
 * Supports:
 * - Real-time weather lookup by latitude and longitude
 * - Graceful fallback labeled strictly as 'Development data — live weather unavailable'
 * - Clean normalized weather object
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Helper to interpret WMO weather interpretation codes for client-side direct fallback
function getWmoCondition(code) {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Heavy Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Variable Conditions';
}

/**
 * Returns clearly labelled development/fallback weather data.
 * Used when network fails, in offline testing, or when API is unreachable.
 */
export function getFallbackWeatherData(lat = 30.9, lng = 75.8, locationName = 'Farm Coordinates') {
  return {
    temperature: 28,
    humidity: 72,
    rainProbability: 35,
    rainfall: 0.0,
    windSpeed: 14,
    condition: 'Partly Cloudy',
    timestamp: new Date().toISOString(),
    latitude: Number(lat),
    longitude: Number(lng),
    location: locationName,
    isDevelopmentData: true,
    dataSource: 'Development data — live weather unavailable'
  };
}

/**
 * Fetch weather using the farmer's latitude and longitude.
 * Queries FasalMitra Backend Gateway (/api/weather).
 */
export async function getWeatherByCoordinates(lat, lng, locationName = 'Current Location') {
  if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
    throw new Error('Valid latitude and longitude coordinates are required for weather retrieval.');
  }

  // 1. Primary Route: Call FasalMitra Backend Gateway
  try {
    const backendEndpoint = `${BACKEND_URL}/api/weather?lat=${lat}&lng=${lng}&location=${encodeURIComponent(locationName)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s — must exceed backend's 7s Open-Meteo timeout

    const response = await fetch(backendEndpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'ok' && result.data) {
        return {
          temperature: result.data.temperature,
          humidity: result.data.humidity,
          rainProbability: result.data.rainProbability,
          rainfall: result.data.rainfall,
          windSpeed: result.data.windSpeed,
          condition: result.data.condition,
          timestamp: result.data.timestamp,
          latitude: Number(result.data.latitude ?? lat),
          longitude: Number(result.data.longitude ?? lng),
          location: result.data.location || locationName,
          isDevelopmentData: Boolean(result.data.isDevelopmentData),
          dataSource: result.data.dataSource || (result.data.isDevelopmentData ? 'Development data — live weather unavailable' : 'Live Weather')
        };
      }
    }
  } catch (backendError) {
    console.warn(`weatherService: Backend at ${BACKEND_URL} unreachable (${backendError.message}). Attempting direct meteorological fallback...`);
  }

  // 2. Direct Client-Side Meteorological Fallback (if backend is offline during standalone UI testing)
  try {
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const omResponse = await fetch(openMeteoUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (omResponse.ok) {
      const data = await omResponse.json();
      const current = data.current || {};
      const daily = data.daily || {};

      const rainProb = Array.isArray(daily.precipitation_probability_max) && daily.precipitation_probability_max.length > 0
        ? daily.precipitation_probability_max[0]
        : (current.precipitation > 0 ? 80 : 25);

      return {
        temperature: Math.round(current.temperature_2m ?? 27),
        humidity: Math.round(current.relative_humidity_2m ?? 70),
        rainProbability: rainProb ?? 30,
        rainfall: current.precipitation ?? 0.0,
        windSpeed: Math.round(current.wind_speed_10m ?? 12),
        condition: getWmoCondition(current.weather_code),
        timestamp: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
        latitude: Number(lat),
        longitude: Number(lng),
        location: locationName,
        isDevelopmentData: false,
        dataSource: 'Live Meteorological Feed (Open-Meteo Direct)'
      };
    }
  } catch (directError) {
    console.warn('weatherService: Direct meteorological lookup failed:', directError.message);
  }

  // 3. Fallback: Labeled strictly as Development data
  const fallback = getFallbackWeatherData(lat, lng, locationName);
  return fallback;
}

/**
 * Fetch weather by District object (from DISTRICTS dataset)
 */
export async function getWeatherByDistrict(district) {
  if (!district || typeof district.lat !== 'number' || typeof district.lng !== 'number') {
    throw new Error('Invalid district selected for weather lookup');
  }
  const label = `${district.name}, ${district.state}`;
  return getWeatherByCoordinates(district.lat, district.lng, label);
}

// Retain default export for backwards compatibility
export const weatherService = {
  getWeatherByCoordinates,
  getWeatherByDistrict,
  getFallbackWeatherData,
  getCurrentWeather: async (lat, lng, label) => getWeatherByCoordinates(lat, lng, label),
  getForecast: async () => null
};

export default weatherService;
