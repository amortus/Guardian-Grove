/**
 * Authentication Controller
 * Guardian Grove Server
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/connection';
import { generateToken } from '../middleware/auth';
import { User, AuthResponse, ApiResponse } from '../types';

/**
 * Register new user with email/password
 */
export async function register(req: Request, res: Response) {
  try {
    const { email, password, displayName } = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and display name are required'
      } as ApiResponse);
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      } as ApiResponse);
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at, updated_at`,
      [email, passwordHash, displayName]
    );

    const user: User = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      displayName: result.rows[0].display_name,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName
    });

    console.log(`[Auth] User registered: ${user.email}`);

    return res.status(201).json({
      success: true,
      data: { token, user }
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user'
    } as ApiResponse);
  }
}

/**
 * Login with email/password
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse);
    }

    // Find user
    const result = await query(
      `SELECT id, email, password_hash, display_name, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse);
    }

    const userRow = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userRow.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse);
    }

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      displayName: userRow.display_name,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at
    };

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName
    });

    console.log(`[Auth] User logged in: ${user.email}`);

    return res.status(200).json({
      success: true,
      data: { token, user }
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to login'
    } as ApiResponse);
  }
}

/**
 * Get current user from token
 */
export async function getMe(req: any, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      } as ApiResponse);
    }

    const result = await query(
      `SELECT id, email, display_name, google_id, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    const user: User = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      displayName: result.rows[0].display_name,
      googleId: result.rows[0].google_id,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    return res.status(200).json({
      success: true,
      data: user
    } as ApiResponse<User>);

  } catch (error) {
    console.error('[Auth] Get me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user'
    } as ApiResponse);
  }
}

/**
 * Google OAuth callback
 */
export async function googleCallback(req: any, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`
      );
    }

    const userObj: User = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      googleId: user.google_id,
      createdAt: user.created_at || new Date(),
      updatedAt: user.updated_at || new Date()
    };

    // Generate JWT token
    const token = generateToken({
      id: userObj.id,
      email: userObj.email,
      displayName: userObj.displayName
    });

    console.log(`[Auth] Google OAuth success: ${userObj.email}`);

    // Redirect to frontend with token
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
    );

  } catch (error) {
    console.error('[Auth] Google callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=server_error`
    );
  }
}

