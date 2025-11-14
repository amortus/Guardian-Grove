/**
 * Guardian Grove Server
 * Main Entry Point
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from './config/passport';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import friendsRoutes from './routes/friends';
import inventoryRoutes from './routes/inventory';
import progressRoutes from './routes/progress';
import { pool } from './db/connection';
import { runMigrations } from './db/migrate';
import { startEventScheduler } from './services/eventScheduler';
import { initializeChatService } from './services/chatService';
import { autoFixSchema } from './db/auto-fix-schema';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ===== MIDDLEWARE =====

// Security
app.use(helmet());

// CORS - Allow Vercel deployments and localhost
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow localhost (development)
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Allow any Vercel deployment URL
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow configured frontend URL
    if (origin === FRONTEND_URL) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====

// Health check (both paths for compatibility)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Guardian Grove Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Guardian Grove Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Game routes
app.use('/api/game', gameRoutes);

// Inventory routes
app.use('/api/inventory', inventoryRoutes);

// Progress routes (quests/achievements)
app.use('/api/progress', progressRoutes);

// Friends routes
app.use('/api/friends', friendsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ===== START SERVER =====

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('[DB] Database connection established');

    // Run pending migrations before starting the server
    await runMigrations();

    // Auto-fix schema (adiciona colunas necessárias se não existirem)
    await autoFixSchema();

    // Create HTTP server for Socket.IO
    const server = createServer(app);

    // Initialize Chat Service (Socket.IO)
    initializeChatService(server);

    // Start listening on all interfaces (required for Railway/Docker)
    server.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log('🎮 Guardian Grove Server');
      console.log('='.repeat(50));
      console.log(`📍 Server: http://0.0.0.0:${PORT}`);
      console.log(`🔗 Frontend: ${FRONTEND_URL}`);
      console.log(`🗄️  Database: Connected`);
      console.log(`💬 Chat: Socket.IO initialized`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
      
      // Start event scheduler (daily cycles, calendar events)
      startEventScheduler();
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();

export default app;

