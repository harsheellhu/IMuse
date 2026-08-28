import express from 'express';
import { MuseumService } from '../services/museumService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/me/museum
router.get('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const museum = MuseumService.getMuseum(userId);
    res.json(museum);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch museum' });
  }
});

// PATCH /api/me/museum
router.patch('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const museum = MuseumService.updateMuseum(userId, req.body);
    res.json(museum);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update museum' });
  }
});

// GET /api/me/museum/rooms
router.get('/rooms', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const museum = MuseumService.getMuseum(userId);
    const rooms = MuseumService.getRooms(museum.id);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/me/museum/rooms/:collectionId/canvas
router.post('/rooms/:collectionId/canvas', requireAuth, (req, res) => {
  try {
    const { collectionId } = req.params;
    const { items } = req.body;
    MuseumService.saveRoomCanvas(collectionId, items);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save canvas' });
  }
});

export default router;
