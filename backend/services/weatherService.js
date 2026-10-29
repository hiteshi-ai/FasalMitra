/**
 * Backend Weather Service for FasalMitra AI
 * 
 * Supports:
 * - Real-time meteorological data retrieval by latitude and longitude
 * - Open-Meteo public meteorological API (keyless default)
 * - Custom external weather provider via WEATHER_API_KEY environment variable
 * - Graceful fallback labeled strictly as 'Development data — live weather unavailable'
 */

// Helper to convert WMO weather interpretation code into human-friendly condition
function mapWmoCodeToCondition(code) {
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
 * Fallback weather object when external provider is unreachable or offline
 */
export function getFallbackWeatherData(lat, lng, locationName = 'Farm Coordinates') {
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
 * Fetch real weather by coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} locationName - Optional descriptive location name
 */
export async function fetchWeather(lat, lng, locationName = 'Farm Coordinates') {
  const apiKey = process.env.WEATHER_API_KEY;
  const provider = (process.env.WEATHER_PROVIDER || 'open-meteo').toLowerCase();

  // If a custom API key and provider is configured (e.g. OpenWeatherMap)
  if (apiKey && provider === 'openweathermap') {
    try {
      const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
      const response = await fetch(owmUrl);
      if (response.ok) {
        const data = await response.json();
        return {
          temperature: Math.round(data.main?.temp ?? 27),
          humidity: Math.round(data.main?.humidity ?? 70),
          rainProbability: data.clouds?.all ?? 30,
          rainfall: data.rain?.['1h'] ?? 0.0,
          windSpeed: Math.round((data.wind?.speed ?? 3.5) * 3.6), // m/s to km/h
          condition: data.weather?.[0]?.main ?? 'Fair',
          timestamp: new Date().toISOString(),
          latitude: Number(lat),
          longitude: Number(lng),
          location: data.name || locationName,
          isDevelopmentData: false,
          dataSource: 'Live Meteorological Feed (OpenWeatherMap)'
        };
      }
    } catch (err) {
      console.warn('weatherService: OpenWeatherMap lookup failed. Trying Open-Meteo fallback:', err.message);
    }
  }

  // Primary Default Provider: Open-Meteo (Open Free Meteorological API)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Meteorological service returned HTTP status ${response.status}`);
    }

    const data = await response.json();
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
      condition: mapWmoCodeToCondition(current.weather_code),
      timestamp: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
      latitude: Number(lat),
      longitude: Number(lng),
      location: locationName,
      isDevelopmentData: false,
      dataSource: 'Live Meteorological Feed (Open-Meteo)'
    };
  } catch (error) {
    console.warn(`weatherService: Live Open-Meteo lookup failed for (${lat}, ${lng}): ${error.message}${error.cause ? ` — cause: ${error.cause.message || error.cause}` : ''}. Returning labeled development fallback.`);
    return getFallbackWeatherData(lat, lng, locationName);
  }
}
