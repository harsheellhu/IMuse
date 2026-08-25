import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// A simple simulated background job runner using setTimeout
// In a real production environment this would be Redis/BullMQ or a separate worker.
const runDiscoveryJob = async (jobId, packId) => {
  try {
    const updateJob = (status, progress, step, current, total) => {
      db.prepare('UPDATE jobs SET status=?, progress=?, current_step=?, processed_count=?, total_count=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .run(status, progress, step, current, total, jobId);
    };

    updateJob('running', 5, 'fetching', 0, 100);
    await new Promise(r => setTimeout(r, 1500));
    
    // Simulate chunk processing
    const total = 100;
    updateJob('running', 10, 'downloading', 0, total);
    
    for (let i = 0; i < 5; i++) {
      // Check if paused or canceled
      const currentJob = db.prepare('SELECT status FROM jobs WHERE id = ?').get(jobId);
      if (currentJob.status === 'paused') {
        // Handle pause in a real system by returning and saving state, here we just break
        break; // Simplified
      }
      if (currentJob.status === 'failed' || currentJob.status === 'completed') return;

      await new Promise(r => setTimeout(r, 1000));
      updateJob('running', 10 + ((i+1)/5)*80, 'extracting', (i+1)*20, total);
    }

    updateJob('completed', 100, 'finalizing', total, total);
  } catch (err) {
    db.prepare('UPDATE jobs SET status=?, error=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run('failed', err.message, jobId);
  }
};

router.post('/discovery', requireAuth, (req, res) => {
  const { packId } = req.body;
  if (!packId) return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'packId is required' } });

  try {
    const jobId = `job_${Date.now()}`;
    db.prepare('INSERT INTO jobs (id, type, metadata) VALUES (?, ?, ?)')
      .run(jobId, 'discovery_import', JSON.stringify({ packId }));
      
    // Start background job
    runDiscoveryJob(jobId, packId);
    
    res.status(201).json({ id: jobId });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

router.get('/:id', requireAuth, (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
    
    res.json({
      ...job,
      metadata: job.metadata ? JSON.parse(job.metadata) : null
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
  }
});

// Since node doesn't natively pause async functions without generators/promises tricks,
// we just set the DB status. The job runner would check it.
router.post('/:id/pause', requireAuth, (req, res) => {
  db.prepare('UPDATE jobs SET status = "paused" WHERE id = ? AND status = "running"').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/resume', requireAuth, (req, res) => {
  db.prepare('UPDATE jobs SET status = "running" WHERE id = ? AND status = "paused"').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/cancel', requireAuth, (req, res) => {
  db.prepare('UPDATE jobs SET status = "failed", error = "Canceled by user" WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
