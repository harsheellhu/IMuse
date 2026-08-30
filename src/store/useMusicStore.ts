import { create } from 'zustand';
import { Song } from '../types';
import { musicDB } from '../utils/musicDB';

interface MusicStoreState {
  currentSong: Song | null;
  currentBlobUrl: string | null;
  isPlaying: boolean;
  volume: number;
  progress: number; // 0 to 1
  duration: number; // in seconds
  currentTime: number; // in seconds
  queue: Song[];
  isMiniPlayerVisible: boolean;
  isMaximized: boolean;
  audioElement: HTMLAudioElement | null;
  fileUnavailableMessage: string | null;
  
  // Actions
  setAudioElement: (el: HTMLAudioElement | null) => void;
  setMaximized: (val: boolean) => void;
  playNext: () => void;
  playPrev: () => void;
  playSong: (song: Song, newQueue?: Song[]) => Promise<void>;
  playAlbum: (albumTracks: Song[]) => Promise<void>;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  setProgress: (prog: number) => void;
  updateTime: (time: number) => void;
  setDuration: (duration: number) => void;
  closePlayer: () => void;
  loadLibrary: () => Promise<Song[]>;
}

export const useMusicStore = create<MusicStoreState>((set, get) => ({
  currentSong: null,
  currentBlobUrl: null,
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  currentTime: 0,
  queue: [],
  isMiniPlayerVisible: false,
  isMaximized: false,
  audioElement: null,
  fileUnavailableMessage: null,
  
  setAudioElement: (el) => set({ audioElement: el }),
  
  setMaximized: (val) => set({ isMaximized: val }),

  playAlbum: async (albumTracks) => {
    if (!albumTracks || albumTracks.length === 0) return;
    await get().playSong(albumTracks[0], albumTracks);
  },

  playSong: async (song, newQueue) => {
    // Revoke previous url if it was an object URL
    const currentUrl = get().currentBlobUrl;
    if (currentUrl && currentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentUrl);
    }
    
    let playableUrl: string | null = null;
    let isFileAvailable = false;

    // 1. Direct local file check (HEAD request to verify file existence in public/)
    if (song.audioSource) {
      try {
        const headRes = await fetch(song.audioSource, { method: 'HEAD' });
        if (headRes.ok) {
          playableUrl = song.audioSource;
          isFileAvailable = true;
        }
      } catch (err) {
        // File not placed yet or network offline
      }
    }

    // 2. Check IndexedDB if user imported audio blob locally
    if (!playableUrl) {
      const record = await musicDB.getSong(song.id);
      if (record && record.blob) {
        playableUrl = URL.createObjectURL(record.blob);
        isFileAvailable = true;
      }
    }

    // Ensure lyrics from canonical metadata are present
    let songLyrics = song.lyrics;
    if (!songLyrics || songLyrics.length <= 1) {
      const prData = await musicDB.loadPurpleRainMetadata();
      const prTrack = prData?.tracks.find(t => t.id === song.id);
      if (prTrack?.lyrics) {
        songLyrics = prTrack.lyrics;
      }
    }

    const songWithLyrics = {
      ...song,
      isAvailable: isFileAvailable,
      lyrics: songLyrics || [
        { time: 0, text: "(Instrumental)" }
      ]
    };

    const targetQueue = newQueue || get().queue;
    const finalQueue = targetQueue.length > 0 ? targetQueue : [songWithLyrics];

    if (isFileAvailable && playableUrl) {
      set({
        currentSong: songWithLyrics,
        currentBlobUrl: playableUrl,
        isPlaying: true,
        progress: 0,
        currentTime: 0,
        duration: song.duration || 0,
        isMiniPlayerVisible: true,
        fileUnavailableMessage: null,
        queue: finalQueue
      });
      
      // Update play count in DB
      await musicDB.updateSong(song.id, {
        playCount: (song.playCount || 0) + 1,
        lastPlayed: new Date().toISOString()
      });
    } else {
      // Missing file handling: DO NOT crash!
      // Render full player, vinyl turntable with center artwork, artist, and status message
      const fileName = song.audioSource ? song.audioSource.split('/').pop() : `${song.title}.mp3`;
      set({
        currentSong: songWithLyrics,
        currentBlobUrl: null,
        isPlaying: false,
        progress: 0,
        currentTime: 0,
        duration: song.duration || 0,
        isMiniPlayerVisible: true,
        fileUnavailableMessage: `Audio file unavailable. Place '${fileName}' in /public/music/purple-rain-2017/ to enable playback.`,
        queue: finalQueue
      });
    }
  },
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  updateTime: (currentTime) => set((state) => ({ 
    currentTime, 
    progress: state.duration > 0 ? currentTime / state.duration : 0 
  })),
  setDuration: (duration) => set({ duration }),
  
  playNext: () => {
    const { currentSong, queue, playSong } = get();
    if (!currentSong || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playSong(queue[currentIndex + 1]);
    }
  },
  
  playPrev: () => {
    const { currentSong, queue, playSong, currentTime } = get();
    if (!currentSong || queue.length === 0) return;
    
    // If we are more than 3 seconds in, just restart the song
    if (currentTime > 3) {
      const seekEvent = new CustomEvent('seekAudio', { detail: 0 });
      window.dispatchEvent(seekEvent);
      return;
    }
    
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex > 0) {
      playSong(queue[currentIndex - 1]);
    }
  },
  
  closePlayer: () => {
    const currentUrl = get().currentBlobUrl;
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    set({
      currentSong: null,
      currentBlobUrl: null,
      isPlaying: false,
      isMiniPlayerVisible: false,
      isMaximized: false
    });
  },
  
  loadLibrary: async () => {
    return await musicDB.getAllSongs();
  }
}));
