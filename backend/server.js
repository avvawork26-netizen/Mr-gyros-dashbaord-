/**
 * Ava Real Estate Assistant — Express Backend
 * Serves the REST API for the dashboard and chat widget.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:4173',  // Vite preview
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/leads', require('./routes/leads'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/api/health', (req, res) => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    status: 'ok',
    ava: 'online',
    apiKeyConfigured: hasApiKey,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve static frontend build (for production) ────────────────────────────
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'), (err) => {
      if (err) res.status(404).json({ error: 'Frontend not built. Run: cd frontend && npm run build' });
    });
  }
});

// ── Start server & scheduler ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 Ava Real Estate Assistant`);
  console.log(`   Backend running on http://localhost:${PORT}`);
  console.log(`   API health: http://localhost:${PORT}/api/health`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('\n⚠️  WARNING: ANTHROPIC_API_KEY is not set!');
    console.warn('   Copy .env.example to backend/.env and add your key.\n');
  }

  // Start the follow-up scheduler
  const { startScheduler } = require('./services/followupScheduler');
  startScheduler();
});

module.exports = app;
