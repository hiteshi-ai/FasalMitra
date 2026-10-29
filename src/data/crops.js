/**
 * Reusable crop configuration dataset.
 * Designed to be easily extensible as new disease models and regional crops are onboarded.
 */

export const CROP_CATEGORIES = [
  'All',
  'Cereal / Grain',
  'Oilseed',
  'Pulse / Legume',
  'Commercial / Fiber',
  'Vegetable'
];

export const CROPS = [
  {
    id: 'wheat',
    name: 'Wheat',
    hindiName: 'गेहूं (Gehun)',
    punjabiName: 'ਕਣਕ (Kanak)',
    category: 'Cereal / Grain',
    commonDiseases: ['Yellow Rust', 'Brown Rust', 'Powdery Mildew'],
    idealTempRange: '15-25°C'
  },
  {
    id: 'rice',
    name: 'Rice / Paddy',
    hindiName: 'धान / चावल (Dhan)',
    punjabiName: 'ਝੋਨਾ / ਚੌਲ (Jhona)',
    category: 'Cereal / Grain',
    commonDiseases: ['Bacterial Leaf Blight', 'Blast', 'Sheath Blight'],
    idealTempRange: '22-32°C'
  },
  {
    id: 'maize',
    name: 'Maize',
    hindiName: 'मक्का (Makka)',
    punjabiName: 'ਮੱਕੀ (Makki)',
    category: 'Cereal / Grain',
    commonDiseases: ['Northern Corn Leaf Blight', 'Common Rust'],
    idealTempRange: '20-30°C'
  },
  {
    id: 'mustard',
    name: 'Mustard',
    hindiName: 'सरसों (Sarson)',
    punjabiName: 'ਸਰ੍ਹੋਂ (Sarson)',
    category: 'Oilseed',
    commonDiseases: ['White Rust', 'Alternaria Blight', 'Downy Mildew'],
    idealTempRange: '12-25°C'
  },
  {
    id: 'chickpea',
    name: 'Chickpea',
    hindiName: 'चना (Chana)',
    punjabiName: 'ਛੋਲੇ (Chhole)',
    category: 'Pulse / Legume',
    commonDiseases: ['Ascochyta Blight', 'Fusarium Wilt'],
    idealTempRange: '15-28°C'
  },
  {
    id: 'groundnut',
    name: 'Groundnut',
    hindiName: 'मूंगफली (Moongphali)',
    punjabiName: 'ਮੂੰਗਫਲੀ (Moongphali)',
    category: 'Oilseed',
    commonDiseases: ['Tikka Disease', 'Rust', 'Stem Rot'],
    idealTempRange: '22-30°C'
  },
  {
    id: 'soybean',
    name: 'Soybean',
    hindiName: 'सोयाबीन (Soybean)',
    punjabiName: 'ਸੋਇਆਬੀਨ (Soybean)',
    category: 'Oilseed',
    commonDiseases: ['Yellow Mosaic Virus', 'Rust', 'Anthracnose'],
    idealTempRange: '20-30°C'
  },
  {
    id: 'cotton',
    name: 'Cotton',
    hindiName: 'कपास (Kapas)',
    punjabiName: 'ਨਰਮਾ / ਕਪਾਹ (Narma)',
    category: 'Commercial / Fiber',
    commonDiseases: ['Cotton Leaf Curl Virus', 'Bacterial Blight'],
    idealTempRange: '25-35°C'
  },
  {
    id: 'tomato',
    name: 'Tomato',
    hindiName: 'टमाटर (Tamatar)',
    punjabiName: 'ਟਮਾਟਰ (Tamatar)',
    category: 'Vegetable',
    commonDiseases: ['Early Blight', 'Late Blight', 'Leaf Curl Virus'],
    idealTempRange: '18-28°C'
  },
  {
    id: 'potato',
    name: 'Potato',
    hindiName: 'आलू (Aloo)',
    punjabiName: 'ਆਲੂ (Aloo)',
    category: 'Vegetable',
    commonDiseases: ['Late Blight', 'Early Blight', 'Black Scurf'],
    idealTempRange: '15-22°C'
  },
  {
    id: 'onion',
    name: 'Onion',
    hindiName: 'प्याज (Pyaz)',
    punjabiName: 'ਪਿਆਜ਼ (Pyaz)',
    category: 'Vegetable',
    commonDiseases: ['Purple Blotch', 'Stemphylium Blight'],
    idealTempRange: '15-30°C'
  },
  {
    id: 'brinjal',
    name: 'Brinjal',
    hindiName: 'बैंगन (Baingan)',
    punjabiName: 'ਬੈਂਗਣ (Baingan)',
    category: 'Vegetable',
    commonDiseases: ['Phomopsis Blight', 'Little Leaf', 'Bacterial Wilt'],
    idealTempRange: '20-32°C'
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    hindiName: 'फूलगोभी (Phoolgobhi)',
    punjabiName: 'ਫੁੱਲਗੋਭੀ (Phoolgobhi)',
    category: 'Vegetable',
    commonDiseases: ['Downy Mildew', 'Black Rot', 'Alternaria Leaf Spot'],
    idealTempRange: '15-22°C'
  }
];

export const CROP_STAGES = [
  { id: 'seedling', label: 'Seedling', hindiLabel: 'अंकुरण अवस्था', punjabiLabel: 'ਪੁੰਗਰਨ ਅਵਸਥਾ', desc: 'Germination & initial sprout', punjabiDesc: 'ਬੀਜ ਪੁੰਗਰਨਾ ਅਤੇ ਸ਼ੁਰੂਆਤੀ ਫੁੱਟ' },
  { id: 'vegetative', label: 'Vegetative', hindiLabel: 'वानस्पतिक विकास', punjabiLabel: 'ਵਾਧੇ ਦੀ ਅਵਸਥਾ', desc: 'Active leaf and stem growth', punjabiDesc: 'ਪੱਤਿਆਂ ਅਤੇ ਤਣੇ ਦਾ ਸਰਗਰਮ ਵਾਧਾ' },
  { id: 'flowering', label: 'Flowering', hindiLabel: 'फूल आने की अवस्था', punjabiLabel: 'ਫੁੱਲ ਆਉਣ ਦੀ ਅਵਸਥਾ', desc: 'Budding and blooming', punjabiDesc: 'ਕਲੀਆਂ ਅਤੇ ਫੁੱਲ ਖਿੜਨਾ' },
  { id: 'fruiting', label: 'Fruiting', hindiLabel: 'फल / दाना विकास', punjabiLabel: 'ਫਲ / ਦਾਣਾ ਬਣਨ ਦੀ ਅਵਸਥਾ', desc: 'Pod/grain/fruit setting', punjabiDesc: 'ਫਲੀਆਂ, ਦਾਣੇ ਜਾਂ ਫਲ ਬਣਨਾ' },
  { id: 'maturity', label: 'Maturity', hindiLabel: 'परिपक्वता अवस्था', punjabiLabel: 'ਪੱਕਣ ਦੀ ਅਵਸਥਾ', desc: 'Near harvest stage', punjabiDesc: 'ਵਾਢੀ ਦੇ ਨੇੜੇ ਦਾ ਪੜਾਅ' }
];

export function searchCrops(query = '', category = 'All') {
  const q = query.trim().toLowerCase();
  return CROPS.filter((crop) => {
    const matchesCategory = category === 'All' || crop.category === category;
    const matchesQuery =
      !q ||
      crop.name.toLowerCase().includes(q) ||
      crop.hindiName.toLowerCase().includes(q) ||
      (crop.punjabiName && crop.punjabiName.toLowerCase().includes(q)) ||
      crop.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}
