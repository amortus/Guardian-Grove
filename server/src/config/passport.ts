/**
 * Passport Configuration for Google OAuth
 * Guardian Grove Server
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { query } from '../db/connection';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

// Only configure Google OAuth if credentials are provided
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const displayName = profile.displayName;

        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Check if user exists by Google ID
        let result = await query(
          'SELECT id, email, display_name, google_id FROM users WHERE google_id = $1',
          [googleId]
        );

        if (result.rows.length > 0) {
          // User exists, return it
          return done(null, result.rows[0]);
        }

        // Check if user exists by email
        result = await query(
          'SELECT id, email, display_name, google_id FROM users WHERE email = $1',
          [email]
        );

        if (result.rows.length > 0) {
          // User exists with same email, link Google account
          const updateResult = await query(
            'UPDATE users SET google_id = $1 WHERE email = $2 RETURNING id, email, display_name, google_id',
            [googleId, email]
          );
          return done(null, updateResult.rows[0]);
        }

        // Create new user
        const createResult = await query(
          `INSERT INTO users (email, google_id, display_name)
           VALUES ($1, $2, $3)
           RETURNING id, email, display_name, google_id`,
          [email, googleId, displayName]
        );

        return done(null, createResult.rows[0]);
      } catch (error) {
      return done(error as Error);
    }
  }
  )
);
} else {
  console.log('[OAuth] Google OAuth disabled - GOOGLE_CLIENT_ID not configured');
}

// Serialize user for session (not used with JWT, but required by Passport)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await query(
      'SELECT id, email, display_name, google_id FROM users WHERE id = $1',
      [id]
    );
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

export default passport;

