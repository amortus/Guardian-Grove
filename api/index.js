/**
 * Vercel Serverless Function Entry Point
 * This wraps the Express app for serverless deployment
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Register ts-node to handle TypeScript imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

// Import routes directly from TypeScript source
const authRoutes = require('../server/src/routes/auth').default;
const gameRoutes = require('../server/src/routes/game').default;
const passport = require('../server/src/config/passport').default;

const app = express();

// Security
app.use(helmet());

// CORS - Allow Vercel domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes('.vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Guardian Grove API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Export for Vercel
module.exports = app;

