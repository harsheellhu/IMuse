import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

// Generate a random ID
const generateId = () => `u${Date.now()}${Math.floor(Math.random() * 1000)}`;

// Google OAuth Setup
const getGoogleClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
  );
};

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Missing fields' } });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Username or email already exists' } });
    }

    const id = generateId();
    const hash = bcrypt.hashSync(password, 10);
    
    db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)')
      .run(id, username, email, hash);

    // Create default preferences
    db.prepare('INSERT INTO preferences (user_id) VALUES (?)').run(id);

    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.status(201).json({ id, username, email });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Missing fields' } });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({ id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// Google OAuth Flow
router.get('/google', (req, res) => {
  const client = getGoogleClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!code) {
    return res.redirect(`${frontendUrl}?error=auth_failed_no_code`);
  }

  try {
    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch user profile from Google
    const { data } = await client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });

    const googleId = data.id;
    const email = data.email;
    const name = data.name;
    const picture = data.picture;

    // Check if identity exists
    let identity = db.prepare('SELECT user_id FROM auth_identities WHERE provider = ? AND provider_user_id = ?')
      .get('google', googleId);

    let userId;

    if (identity) {
      userId = identity.user_id;
    } else {
      // Check if user exists with this email
      let user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

      if (user) {
        // Link identity to existing user
        userId = user.id;
        db.prepare('INSERT INTO auth_identities (id, user_id, provider, provider_user_id) VALUES (?, ?, ?, ?)')
          .run(generateId(), userId, 'google', googleId);
      } else {
        // Create new user
        userId = generateId();
        const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
        
        db.prepare('INSERT INTO users (id, username, email, avatar_url) VALUES (?, ?, ?, ?)')
          .run(userId, username, email, picture);

        // Create default preferences
        db.prepare('INSERT INTO preferences (user_id) VALUES (?)').run(userId);

        // Link identity
        db.prepare('INSERT INTO auth_identities (id, user_id, provider, provider_user_id) VALUES (?, ?, ?, ?)')
          .run(generateId(), userId, 'google', googleId);
      }
    }

    // Generate JWT
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.redirect(frontendUrl);
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.redirect(`${frontendUrl}?error=google_auth_failed`);
  }
});

export default router;
