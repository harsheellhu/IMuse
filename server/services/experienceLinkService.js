import db from '../db.js';
import crypto from 'crypto';

export class ExperienceLinkService {
  /**
   * Run auto-detection when a new event is logged
   */
  static async detectConnections(userId, newEventId) {
    try {
      // 1. Get the new event and its content
      const eventRow = db.prepare(`
        SELECT e.*, c.title, c.creator, c.category, c.type
        FROM experience_events e
        JOIN content c ON e.content_id = c.id
        WHERE e.id = ? AND e.experience_id IN (SELECT id FROM experiences WHERE user_id = ?)
      `).get(newEventId, userId);

      if (!eventRow) return;

      const newContentId = eventRow.content_id;
      const newTitle = eventRow.title.toLowerCase().trim();
      const newCreator = eventRow.creator ? eventRow.creator.toLowerCase().trim() : '';

      // 2. Find all other distinct contents the user has events for (excluding this one)
      const otherContents = db.prepare(`
        SELECT DISTINCT c.id, c.title, c.creator, c.category, c.type, e.experience_id
        FROM experience_events e
        JOIN content c ON e.content_id = c.id
        JOIN experiences exp ON e.experience_id = exp.id
        WHERE exp.user_id = ? AND c.id != ?
      `).all(userId, newContentId);

      for (const other of otherContents) {
        const otherTitle = other.title.toLowerCase().trim();
        const otherCreator = other.creator ? other.creator.toLowerCase().trim() : '';

        let confidence = null;

        // Auto-detection logic:
        // 1. Exact title match (e.g. "The Odyssey")
        if (newTitle === otherTitle && newTitle.length > 3) {
          confidence = 'strong';
        }
        // 2. Substring match + same creator (e.g. "Dune: Part One" and "Dune")
        else if (
          (newTitle.includes(otherTitle) || otherTitle.includes(newTitle)) && 
          newTitle.length > 4 && otherTitle.length > 4 &&
          newCreator && otherCreator && newCreator === otherCreator
        ) {
          confidence = 'possible';
        }

        if (confidence) {
          // Check if this link already exists
          const existingLink = db.prepare(`
            SELECT id FROM experience_links 
            WHERE experience_id = ? 
            AND ((source_content_id = ? AND target_content_id = ?) OR (source_content_id = ? AND target_content_id = ?))
          `).get(other.experience_id, newContentId, other.id, other.id, newContentId);

          if (!existingLink) {
            // If it's a strong connection, we automatically merge this event into the existing experience
            if (confidence === 'strong') {
              const currentExpId = eventRow.experience_id;
              const targetExpId = other.experience_id;

              if (currentExpId !== targetExpId) {
                // Move event to the matched experience
                db.prepare(`UPDATE experience_events SET experience_id = ? WHERE id = ?`).run(targetExpId, newEventId);
                
                // If the old experience is now empty, delete it
                const remaining = db.prepare(`SELECT count(*) as c FROM experience_events WHERE experience_id = ?`).get(currentExpId);
                if (remaining.c === 0) {
                  db.prepare(`DELETE FROM experiences WHERE id = ?`).run(currentExpId);
                }

                // Add link
                db.prepare(`
                  INSERT INTO experience_links (id, experience_id, source_content_id, target_content_id, relationship_type, confidence)
                  VALUES (?, ?, ?, ?, ?, ?)
                `).run(crypto.randomUUID(), targetExpId, newContentId, other.id, 'auto-detected', confidence);
                
                // Update title of target experience if it was a default title
                db.prepare(`UPDATE experiences SET title = ?, status = 'active' WHERE id = ?`).run(eventRow.title, targetExpId);
                
                break; // Stop after merging into one strong match
              }
            } else if (confidence === 'possible') {
              // Create a suggestion link but don't move the event automatically
              db.prepare(`
                INSERT INTO experience_links (id, experience_id, source_content_id, target_content_id, relationship_type, confidence)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(crypto.randomUUID(), other.experience_id, newContentId, other.id, 'auto-detected', confidence);
            }
          }
        }
      }
    } catch (error) {
      console.error('[ExperienceLinkService] Error during detection:', error);
    }
  }
}
