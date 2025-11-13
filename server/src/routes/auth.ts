/**
 * Authentication Routes
 * Guardian Grove Server
 */

import { Router } from 'express';
import { register, login, getMe, googleCallback } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import passport from '../config/passport';

const router = Router();

// Register new user
router.post('/register', register);

// Login
router.post('/login', login);

// Get current user (protected route)
router.get('/me', authenticateToken, getMe);

// Google OAuth
router.get('/google', (req, res, next) => {
  // Verificar se Google OAuth está configurado
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    // Redirecionar de volta ao frontend com erro ao invés de retornar JSON
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }

  // Se configurado, proceder com autenticação
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', (req, res, next) => {
  // Verificar se Google OAuth está configurado
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }

  // Se configurado, proceder com callback
  passport.authenticate('google', { 
    session: false,
    failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=auth_failed'
  })(req, res, next);
}, googleCallback);

// Logout (client-side - just remove token)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

export default router;

