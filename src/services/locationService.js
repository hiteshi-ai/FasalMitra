/**
 * Location Service for FasalMitra AI
 * 
 * Provides reverse geocoding via OpenStreetMap Nominatim:
 * - Obtains human-readable location (e.g., "Ludhiana, Punjab") from coordinates
 * - Free keyless approach respecting Nominatim usage guidelines
 * - Robust 3.5s timeout and fallback to "Current Device Location (Auto-detected)"
 * - Does not break or delay weather fetching
 */

export async function reverseGeocodeCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return 'Current Device Location (Auto-detected)';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const locality = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district || '';
      const state = addr.state || '';

      if (locality && state) {
        return `${locality}, ${state}`;
      } else if (locality) {
        return locality;
      } else if (state) {
        return state;
      }
    }
  } catch (err) {
    console.warn('reverseGeocodeCoordinates: Fallback activated:', err.message);
  }

  return 'Current Device Location (Auto-detected)';
}

export default {
  reverseGeocodeCoordinates
};
