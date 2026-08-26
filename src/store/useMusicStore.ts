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
  
  // Actions
  setAudioElement: (el: HTMLAudioElement | null) => void;
  setMaximized: (val: boolean) => void;
  playNext: () => void;
  playPrev: () => void;
  playSong: (song: Song, newQueue?: Song[]) => Promise<void>;
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
  
  setAudioElement: (el) => set({ audioElement: el }),
  
  setMaximized: (val) => set({ isMaximized: val }),

  playSong: async (song, newQueue) => {
    // Revoke previous url to prevent memory leaks
    const currentUrl = get().currentBlobUrl;
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    
    // Fetch blob from IDB
    const record = await musicDB.getSong(song.id);
    if (!record) {
      console.error('Song not found in IDB');
      return;
    }
    
    const blobUrl = URL.createObjectURL(record.blob);
    
    // Inject mock lyrics for testing if none exist
    const songWithLyrics = {
      ...song,
      lyrics: song.lyrics || [
        { time: 0, text: "(Instrumental intro)" },
        { time: 5, text: "I've been looking at the turntable" },
        { time: 10, text: "Watching the record spin around" },
        { time: 15, text: "The needle drops, the music plays" },
        { time: 20, text: "Lost inside this giant sound" },
        { time: 30, text: "(Guitar Solo)" },
        { time: 45, text: "And the colors fill the room" },
        { time: 50, text: "Fading from the cover art" },
        { time: 55, text: "Synchronized with every beat" },
        { time: 60, text: "Playing right inside my heart" }
      ]
    };

    set({
      currentSong: songWithLyrics,
      currentBlobUrl: blobUrl,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
      isMiniPlayerVisible: true,
      queue: newQueue || get().queue
    });
    
    // Update play count in DB
    await musicDB.updateSong(song.id, { playCount: song.playCount + 1, lastPlayed: new Date().toISOString() });
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
