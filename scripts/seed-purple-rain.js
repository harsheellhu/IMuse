import db from '../server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seedPurpleRain() {
  console.log('Seeding Purple Rain (2017 Remaster) local album and tracks into database...');

  const metadataPath = path.resolve(__dirname, '../public/music/purple-rain-2017/metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error('metadata.json not found at', metadataPath);
    return;
  }

  const { album, tracks } = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // Database transaction for atomic, idempotent seed
  const seedTx = db.transaction(() => {
    // 1. Seed Album
    const albumStmt = db.prepare(`
      INSERT INTO content (id, type, title, description, creator, image_url, source_url, category, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        creator = excluded.creator,
        image_url = excluded.image_url,
        source_url = excluded.source_url,
        category = excluded.category,
        metadata = excluded.metadata,
        updated_at = CURRENT_TIMESTAMP
    `);

    albumStmt.run(
      album.id,
      'album',
      album.title,
      album.description,
      album.artist,
      album.coverArtwork,
      '/music/album/' + album.id,
      'Music',
      JSON.stringify({
        year: album.year,
        genre: album.genre,
        isLocal: true,
        sourceType: 'local',
        trackCount: tracks.length,
        discCount: album.discCount
      })
    );

    // Album Tags
    const albumTags = ['Prince', 'The Revolution', 'Purple Rain', '2017 Remaster', 'Album', 'Music', 'Vinyl', 'Rock', 'Pop', 'R&B'];
    const insertTag = db.prepare(`INSERT OR IGNORE INTO content_tags (content_id, tag) VALUES (?, ?)`);
    for (const tag of albumTags) {
      insertTag.run(album.id, tag);
    }

    // 2. Clean up old tracks from previous multi-track seed
    const activeTrackIds = tracks.map(t => t.id);
    const placeholders = activeTrackIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM content WHERE id LIKE 'purple-rain-2017-%' AND id NOT IN (${placeholders})`).run(...activeTrackIds);
    db.prepare(`DELETE FROM content_tags WHERE content_id LIKE 'purple-rain-2017-%' AND content_id NOT IN (${placeholders})`).run(...activeTrackIds);

    // 3. Seed Track
    const trackStmt = db.prepare(`
      INSERT INTO content (id, type, title, description, creator, image_url, source_url, category, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        creator = excluded.creator,
        image_url = excluded.image_url,
        source_url = excluded.source_url,
        category = excluded.category,
        metadata = excluded.metadata,
        updated_at = CURRENT_TIMESTAMP
    `);

    for (const track of tracks) {
      trackStmt.run(
        track.id,
        'track',
        track.title,
        `${track.title} by ${track.artist} from ${track.album}`,
        track.artist,
        track.artworkUrl,
        track.audioSource,
        'Music',
        JSON.stringify({
          album: track.album,
          albumId: album.id,
          trackNumber: track.trackNumber,
          discNumber: track.discNumber,
          year: track.year,
          genre: track.genre,
          audioSource: track.audioSource,
          fileName: track.fileName,
          duration: track.duration,
          isLocal: true,
          sourceType: 'local'
        })
      );

      // Track Tags
      const trackTags = ['Prince', 'Purple Rain', 'Track', 'Music', 'Rock', 'Ballad'];
      for (const tag of trackTags) {
        insertTag.run(track.id, tag);
      }
    }
  });

  seedTx();
  console.log(`Successfully seeded ${album.title} with only the track '${tracks[0]?.title}' into database.`);
}

// If executed directly from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedPurpleRain();
}
