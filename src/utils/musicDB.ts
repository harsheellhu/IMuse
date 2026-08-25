import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Song } from '../types';

interface MusicDBSchema extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: { 'by-artist': string };
  };
  blobs: {
    key: string;
    value: Blob;
  };
}

let dbPromise: Promise<IDBPDatabase<MusicDBSchema>>;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MusicDBSchema>('imuse_music', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('by-artist', 'artist');
        }
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs');
        }
      },
    });
  }
  return dbPromise;
};

export const musicDB = {
  async saveSong(song: Song, audioBlob: Blob): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['songs', 'blobs'], 'readwrite');
    
    // Save metadata
    await tx.objectStore('songs').put({
      ...song,
      blobId: song.id // Link to blob
    });
    
    // Save blob
    await tx.objectStore('blobs').put(audioBlob, song.id);
    
    await tx.done;
  },

  async getSong(id: string): Promise<{ song: Song; blob: Blob } | null> {
    const db = await getDB();
    const tx = db.transaction(['songs', 'blobs'], 'readonly');
    
    const song = await tx.objectStore('songs').get(id);
    if (!song) return null;
    
    const blob = await tx.objectStore('blobs').get(id);
    if (!blob) return null;
    
    return { song, blob };
  },

  async getAllSongs(): Promise<Song[]> {
    const db = await getDB();
    return db.getAll('songs');
  },

  async deleteSong(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['songs', 'blobs'], 'readwrite');
    
    await tx.objectStore('songs').delete(id);
    await tx.objectStore('blobs').delete(id);
    
    await tx.done;
  },
  
  async updateSong(id: string, updates: Partial<Song>): Promise<void> {
    const db = await getDB();
    const song = await db.get('songs', id);
    if (song) {
      await db.put('songs', { ...song, ...updates });
    }
  }
};
