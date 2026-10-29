/**
 * Major Indian agricultural districts for manual location fallback.
 * Includes coordinates to allow microclimate weather retrieval.
 */

export const DISTRICTS = [
  // Punjab
  { id: 'ludhiana', name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573 },
  { id: 'bathinda', name: 'Bathinda', state: 'Punjab', lat: 30.2110, lng: 74.9455 },
  { id: 'amritsar', name: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723 },
  { id: 'patiala', name: 'Patiala', state: 'Punjab', lat: 30.3398, lng: 76.3869 },
  { id: 'sangrur', name: 'Sangrur', state: 'Punjab', lat: 30.2458, lng: 75.8421 },
  { id: 'jalandhar', name: 'Jalandhar', state: 'Punjab', lat: 31.3260, lng: 75.5762 },

  // Haryana
  { id: 'karnal', name: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905 },
  { id: 'hisar', name: 'Hisar', state: 'Haryana', lat: 29.1492, lng: 75.7217 },
  { id: 'ambala', name: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767 },
  { id: 'sirsa', name: 'Sirsa', state: 'Haryana', lat: 29.5349, lng: 75.0298 },

  // Uttar Pradesh
  { id: 'meerut', name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { id: 'bareilly', name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304 },
  { id: 'gorakhpur', name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732 },

  // Madhya Pradesh
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { id: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885 },
  { id: 'jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { id: 'hoshangabad', name: 'Narmadapuram (Hoshangabad)', state: 'Madhya Pradesh', lat: 22.7519, lng: 77.7289 },

  // Rajasthan
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { id: 'sri-ganganagar', name: 'Sri Ganganagar', state: 'Rajasthan', lat: 29.9038, lng: 73.8772 },
  { id: 'kota', name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },

  // Maharashtra
  { id: 'nashik', name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { id: 'aurangabad', name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },

  // Gujarat
  { id: 'rajkot', name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { id: 'surat', name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },

  // Bihar
  { id: 'patna', name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { id: 'muzaffarpur', name: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647 },

  // Andhra Pradesh & Telangana
  { id: 'guntur', name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  { id: 'warangal', name: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941 }
];
