import { fetchWeather } from '../services/weatherService.js';

export async function getWeather(req, res, next) {
  try {
    const { lat, lng, location } = req.query;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameters "lat" and "lng" are required.'
      });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinate values. Latitude must be between -90 and 90, longitude between -180 and 180.'
      });
    }

    const weatherData = await fetchWeather(parsedLat, parsedLng, location || 'Farm Coordinates');

    return res.status(200).json({
      status: 'ok',
      data: weatherData
    });
  } catch (error) {
    next(error);
  }
}
