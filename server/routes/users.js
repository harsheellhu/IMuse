import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.patch('/me', requireAuth, (req, res) => {
  const { username, bio, avatar_url } = req.body;
  
  try {
    db.prepare('UPDATE users SET username = COALESCE(?, username), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(username, bio, avatar_url, req.user.id);
      
    const updatedUser = db.prepare('SELECT id, username, email, avatar_url, bio FROM users WHERE id = ?').get(req.user.id);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

export default router;
