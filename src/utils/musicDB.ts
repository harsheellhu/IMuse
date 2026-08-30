import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Song, Album } from '../types';

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

function generateDemoWavBlob(): Blob {
  const sampleRate = 44100;
  const duration = 28;
  const numChannels = 2;
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordBase = t < 7 ? 146.83 : t < 14 ? 174.61 : t < 21 ? 220.00 : 196.00;
    const env = Math.sin((Math.PI * (t % 7)) / 7);
    const wave = (
      Math.sin(2 * Math.PI * chordBase * t) * 0.4 +
      Math.sin(2 * Math.PI * (chordBase * 1.5) * t) * 0.25 +
      Math.sin(2 * Math.PI * (chordBase * 2) * t) * 0.15
    ) * env * 0.28;

    const sample = Math.max(-1, Math.min(1, wave));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;

    view.setInt16(offset, intSample, true);
    view.setInt16(offset + 2, intSample, true);
    offset += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export const musicDB = {
  async saveSong(song: Song, audioBlob: Blob): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['songs', 'blobs'], 'readwrite');
    
    // Save metadata
    await tx.objectStore('songs').put({
      ...song,
      blobId: song.id
    });
    
    // Save blob
    await tx.objectStore('blobs').put(audioBlob, song.id);
    
    await tx.done;
  },

  async getSong(id: string): Promise<{ song: Song; blob: Blob | null } | null> {
    const db = await getDB();
    const tx = db.transaction(['songs', 'blobs'], 'readonly');
    
    const song = await tx.objectStore('songs').get(id);
    const blob = await tx.objectStore('blobs').get(id);
    
    if (song && blob) {
      return { song, blob };
    }

    // Check if this is a canonical Purple Rain track
    const prData = await musicDB.loadPurpleRainMetadata();
    if (prData) {
      const prTrack = prData.tracks.find(t => t.id === id);
      if (prTrack) {
        return {
          song: song ? { ...prTrack, ...song } : prTrack,
          blob: blob || null
        };
      }
    }

    if (song) {
      return { song, blob: null };
    }
    
    return null;
  },

  async loadPurpleRainMetadata(): Promise<{ album: Album; tracks: Song[] } | null> {
    try {
      const res = await fetch('/music/purple-rain-2017/metadata.json');
      if (!res.ok) return null;
      const data = await res.json();
      const album: Album = {
        id: data.album.id,
        title: data.album.title,
        artist: data.album.artist,
        type: data.album.type || 'Album',
        year: data.album.year,
        genre: data.album.genre,
        description: data.album.description,
        coverImage: data.album.coverArtwork,
        tracks: data.tracks,
        isLocal: true
      };
      return { album, tracks: data.tracks };
    } catch (e) {
      console.warn('Could not load Purple Rain metadata:', e);
      return null;
    }
  },

  async getAlbums(): Promise<Album[]> {
    const prData = await musicDB.loadPurpleRainMetadata();
    const albums: Album[] = [];
    if (prData) {
      albums.push(prData.album);
    }
    return albums;
  },

  async getAlbum(id: string): Promise<Album | null> {
    if (id === 'purple-rain-2017') {
      const prData = await musicDB.loadPurpleRainMetadata();
      return prData ? prData.album : null;
    }
    return null;
  },

  async getAllSongs(): Promise<Song[]> {
    const db = await getDB();
    let idbSongs = await db.getAll('songs');
    if (!idbSongs || idbSongs.length === 0) {
      const demoSong: Song = {
        id: 'demo-ambient-reverie',
        title: 'Ambient Reverie',
        artist: 'iMuse Audio',
        album: 'Inner Dimensions',
        duration: 28,
        artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400',
        addedAt: new Date().toISOString(),
        playCount: 1,
        isFavorite: true,
        lyrics: [
          { time: 0, text: 'Drifting into visual resonance...' },
          { time: 6, text: 'Frequencies aligning with memory' },
          { time: 13, text: 'Soundwaves carving architecture in silence' },
          { time: 20, text: 'Every tone a room worth remembering' },
          { time: 26, text: 'Echoes settling into stillness' }
        ]
      };
      const blob = generateDemoWavBlob();
      await musicDB.saveSong(demoSong, blob);
      idbSongs = [demoSong];
    }

    // Integrate local album tracks
    const prData = await musicDB.loadPurpleRainMetadata();
    if (!prData) return idbSongs;

    // Merge IDB metadata with canonical tracks
    const idbMap = new Map(idbSongs.map(s => [s.id, s]));
    const canonicalTracks = prData.tracks.map(track => {
      const existing = idbMap.get(track.id);
      if (existing) {
        return {
          ...track,
          ...existing,
          artworkUrl: existing.artworkUrl || track.artworkUrl,
          audioSource: track.audioSource,
          isLocal: true,
          sourceType: 'local' as const
        };
      }
      return track;
    });

    // Combine canonical tracks with non-Purple Rain custom songs
    const otherSongs = idbSongs.filter(s => !s.id.startsWith('purple-rain-2017'));
    return [...canonicalTracks, ...otherSongs];
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
    } else {
      // If it's a Purple Rain track not yet in IDB, save updates to IDB
      const prData = await musicDB.loadPurpleRainMetadata();
      const track = prData?.tracks.find(t => t.id === id);
      if (track) {
        await db.put('songs', { ...track, ...updates });
      }
    }
  }
};
