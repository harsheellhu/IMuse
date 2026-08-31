import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { useMusicStore } from '../store/useMusicStore';
import { Song } from '../types';
import { Play, Pause, Music as MusicIcon, Clock, MoreVertical, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useSettingsStore } from '../store/useSettingsStore';
import { EditSongModal } from '../components/music/EditSongModal';
import { musicDB } from '../utils/musicDB';

export function Music() {
  const { setBgGradient } = useStore();
  const { appearance } = useSettingsStore();
  const { loadLibrary, playSong, currentSong, isPlaying, togglePlay } = useMusicStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  useEffect(() => {
    loadLibrary().then(setSongs);
  }, [loadLibrary]);

  useEffect(() => {
    setBgGradient(null);
  }, [currentSong, setBgGradient]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      await musicDB.deleteSong(id);
      loadLibrary().then(setSongs);
    }
  };

  return (
    <div className="w-full h-full max-w-[1600px] mx-auto px-6 md:px-12 py-12 md:py-20 flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-text-primary">
          Local Audio
        </h1>
        <p className="text-sm font-light max-w-xl text-text-secondary">
          Your private collection. Playing directly from your device storage.
        </p>
      </motion.div>

      {songs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-border-subtle rounded-2xl bg-surface/50 backdrop-blur-sm">
          <MusicIcon className="w-12 h-12 text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No audio found</h3>
          <p className="text-sm text-text-secondary">Click the + menu to import songs from your device.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songs.map((song, i) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col gap-3"
            >
              <div 
                onClick={() => {
                  if (currentSong?.id === song.id) {
                    togglePlay();
                  } else {
                    playSong(song, songs);
                  }
                }}
                className="aspect-square w-full rounded-xl overflow-hidden relative cursor-pointer group/art bg-surface border border-border-subtle shadow-[0_0_15px_var(--shadow-accent,transparent)]"
              >
                {song.artworkUrl ? (
                  <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/art:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-text-muted/20 to-transparent flex items-center justify-center">
                    <MusicIcon className="w-12 h-12 text-text-muted opacity-50" />
                  </div>
                )}
                
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-overlay/40 opacity-0 group-hover/art:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md bg-accent-soft text-accent border border-accent">
                    {currentSong?.id === song.id && isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-1" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium truncate text-sm text-text-primary" title={song.title}>
                    {song.title}
                  </h4>
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === song.id ? null : song.id)}
                      className="text-text-muted hover:text-text-primary mt-0.5"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === song.id && (
                      <div className="absolute right-0 top-6 w-36 bg-background-elevated border border-border-subtle rounded-lg shadow-lg py-1 z-10 flex flex-col">
                        <button 
                          onClick={() => {
                            setEditingSong(song);
                            setOpenMenuId(null);
                          }}
                          className="px-4 py-2 text-left text-[13px] text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                        >
                          Edit Details
                        </button>
                        <button 
                          onClick={() => {
                            handleDelete(song.id);
                            setOpenMenuId(null);
                          }}
                          className="px-4 py-2 text-left text-[13px] text-error hover:text-error hover:bg-error/10"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs truncate text-text-secondary" title={song.artist}>
                  {song.artist}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {editingSong && (
        <EditSongModal 
          song={editingSong} 
          isOpen={true} 
          onClose={() => setEditingSong(null)} 
          onSave={() => loadLibrary().then(setSongs)} 
        />
      )}
    </div>
  );
}
