import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import preferencesRoutes from './routes/preferences.js';
import contentRoutes from './routes/content.js';
import discoveryRoutes from './routes/discovery.js';
import searchRoutes from './routes/search.js';
import collectionsRoutes from './routes/collections.js';
import savedRoutes from './routes/saved.js';
import historyRoutes from './routes/history.js';
import jobsRoutes from './routes/jobs.js';
import experiencesRoutes from './routes/experiences.js';
import patternsRoutes from './routes/patterns.js';
import replayRoutes from './routes/replay.js';
import discoveryEngineRoutes from './routes/discoveryEngine.js';
import museumRoutes from './routes/museum.js';
import dnaRoutes from './routes/dna.js';
import trailsRoutes from './routes/trails.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/me/collections', collectionsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/me/saved', savedRoutes);
app.use('/api/me/history', historyRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/me/experiences', experiencesRoutes);
app.use('/api/me/patterns', patternsRoutes);
app.use('/api/me/replay', replayRoutes);
app.use('/api/engine', discoveryEngineRoutes); // Using /api/engine for the new intelligence layer
app.use('/api/me/museum', museumRoutes);
app.use('/api/me/dna', dnaRoutes);
app.use('/api/me/trails', trailsRoutes);
app.use('/api/trails', trailsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', db: 'connected' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    }
  });
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA Fallback: Any non-API route returns index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API Route Not Found' } });
  }
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) {
      res.status(404).send('Cannot find frontend build. Did you run npm run build?');
    }
  });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠ Port ${PORT} in use — attempting to free it...`);
    const { execSync } = require('child_process');
    try {
      // Find and kill the process holding the port (Windows)
      const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
      const lines = result.trim().split('\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && !isNaN(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try { execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' }); } catch(e) {}
      }
      // Retry after a brief delay
      setTimeout(() => {
        app.listen(PORT, () => {
          console.log(`Backend server running on http://localhost:${PORT} (recovered)`);
        });
      }, 1000);
    } catch (e) {
      console.error(`Could not free port ${PORT}. Please manually kill the process using it.`);
      process.exit(1);
    }
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
