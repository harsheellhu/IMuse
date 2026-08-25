import jwt from 'jsonwebtoken';
import db from '../db.js';

export const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, avatar_url, bio FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'User not found' }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' }
    });
  }
};
