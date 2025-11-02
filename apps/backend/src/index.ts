import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from repo root (../../.env relative to apps/backend)
// This allows developers and CI to follow the documented setup in README.md
const envPath = path.resolve(process.cwd(), '../../.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  // Fallback to default behavior if repo root .env is not found
  dotenv.config();
}

import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './api/analyze';

// Debug: Check if API key is loaded (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('GEMINI_API_KEY status:', process.env.GEMINI_API_KEY ? 'present' : 'missing');
}

const app = express();
const port = process.env.PORT || 3001;

// Trust proxy configuration - SECURITY CRITICAL
// Only trust X-Forwarded-For when behind a known reverse proxy (Render, Vercel, etc.)
// Default: false (don't trust any proxy headers - use socket peer address)
// Production: Set TRUST_PROXY env var to number of hops (usually 1) or 'loopback'
// Do NOT set to 'true' as it would trust any client-provided header
if (process.env.TRUST_PROXY) {
  const trustProxy = process.env.TRUST_PROXY;
  // Support numeric values (e.g., "1" for single hop) or special keywords
  const proxyValue = /^\d+$/.test(trustProxy) ? parseInt(trustProxy, 10) : trustProxy;
  app.set('trust proxy', proxyValue);
  console.log(`🔒 Trust proxy enabled: ${proxyValue}`);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' })); // MVPは300KB程度まで想定

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', analyzeRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});
