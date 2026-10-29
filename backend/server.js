import express from 'express';
import cors from 'cors';
// NOTE: dotenv is loaded by init-env.js (the real entry point) BEFORE this
// module is imported, so process.env is fully populated here and in all
// transitive imports (supabaseClient.js, etc.).

import healthRoutes from './routes/healthRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import expertRoutes from './routes/expertRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS Middleware with PATCH support and flexible local development origin handling
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, test scripts) or local dev origins
    if (!origin) return callback(null, true);
    if (
      origin === FRONTEND_ORIGIN ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api', weatherRoutes);
app.use('/api', aiRoutes);
app.use('/api', expertRoutes);
app.use('/api', analysisRoutes);
app.use('/api', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'FasalMitra AI Backend Gateway is running.',
    healthEndpoint: '/api/health',
    weatherEndpoint: '/api/weather',
    expertEndpoint: '/api/expert',
    riskEndpoint: '/api/risk-forecast',
    analysesEndpoint: '/api/analyses'
  });
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint "${req.originalUrl}" not found.`
  });
});

// Centralized error handling middleware
app.use((err, req, res, _next) => {
  console.error('[FasalMitra Server Error]:', err.message);
  if (err.status && err.status !== 500) {
    console.error(`  HTTP Status: ${err.status}`);
  }
  if (err.code) console.error(`  Error Code: ${err.code}`);
  if (err.stack) console.error('  Stack:', err.stack.split('\n').slice(0, 4).join('\n'));
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || (statusCode === 500 ? 'Internal server error occurred.' : 'Unknown error')
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[FasalMitra AI] Backend server running on http://localhost:${PORT}`);
  console.log(`[FasalMitra AI] Health check available at: http://localhost:${PORT}/api/health`);
});

export default app;
