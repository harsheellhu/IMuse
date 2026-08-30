import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { useMusicStore } from '../store/useMusicStore';
import { Song, Album } from '../types';
import { Play, Pause, Music as MusicIcon, Disc, ChevronLeft, ArrowRight, MoreVertical, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useSettingsStore } from '../store/useSettingsStore';
import { EditSongModal } from '../components/music/EditSongModal';
import { musicDB } from '../utils/musicDB';

export function Music() {
  const { setBgGradient } = useStore();
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';
  const { loadLibrary, playSong, playAlbum, currentSong, isPlaying, togglePlay } = useMusicStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'albums'>('all');

  useEffect(() => {
    loadLibrary().then(setSongs);
    musicDB.getAlbums().then(setAlbums);
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

  const handlePlayAlbum = (album: Album) => {
    if (album.tracks && album.tracks.length > 0) {
      playAlbum(album.tracks);
    }
  };

  return (
    <div className="w-full h-full max-w-[1600px] mx-auto px-6 md:px-12 py-12 md:py-20 flex flex-col min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-text-primary">
              Music Library
            </h1>
            <span className={clsx(
              "text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-mono font-medium",
              isTron 
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" 
                : "bg-surface text-text-secondary border border-border-subtle"
            )}>
              Local-First
            </span>
          </div>
          <p className="text-sm font-light max-w-xl text-text-secondary">
            Your private music vault. Operating 100% offline directly from local audio storage.
          </p>
        </div>

        {/* View Tabs */}
        {!selectedAlbum && (
          <div className="flex items-center gap-2 bg-surface/60 p-1.5 rounded-xl border border-border-subtle backdrop-blur-sm self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTab === 'all'
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              All Tracks ({songs.length})
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                activeTab === 'albums'
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Disc className="w-3.5 h-3.5" />
              Albums ({albums.length})
            </button>
          </div>
        )}
      </motion.div>

      {/* Album Detail View */}
      <AnimatePresence mode="wait">
        {selectedAlbum ? (
          <motion.div
            key="album-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-8 mb-16"
          >
            {/* Back Button */}
            <button
              onClick={() => setSelectedAlbum(null)}
              className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors self-start px-3 py-1.5 rounded-lg bg-surface/50 border border-border-subtle hover:bg-surface"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Library
            </button>

            {/* Album Header Banner */}
            <div className={clsx(
              "grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 p-6 md:p-8 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-xl",
              isTron 
                ? "bg-black/60 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]" 
                : "bg-surface/70 border-border-subtle"
            )}>
              {/* Cover Artwork */}
              <div className="aspect-square w-full max-w-[300px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                <img
                  src={selectedAlbum.coverImage}
                  alt={selectedAlbum.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handlePlayAlbum(selectedAlbum)}
                    className="w-14 h-14 rounded-full bg-accent text-accent-contrast flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
                  >
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </button>
                </div>
              </div>

              {/* Album Metadata */}
              <div className="flex flex-col justify-between py-2 min-w-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono tracking-widest uppercase text-text-muted">
                      {selectedAlbum.type} • {selectedAlbum.year}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                      Paisley Park Master
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-text-primary leading-tight">
                    {selectedAlbum.title}
                  </h2>

                  <p className="text-lg text-text-secondary font-light">
                    {selectedAlbum.artist}
                  </p>

                  <p className="text-sm text-text-secondary/80 max-w-2xl font-light leading-relaxed mt-2">
                    {selectedAlbum.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={() => handlePlayAlbum(selectedAlbum)}
                    className="px-6 py-3 rounded-full bg-text-primary text-bg-base font-medium text-sm flex items-center gap-2.5 transition-transform hover:scale-[1.02] shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play Album
                  </button>

                  <span className="text-xs text-text-muted">
                    {selectedAlbum.tracks.length} {selectedAlbum.tracks.length === 1 ? 'Track' : 'Tracks'} • Local-First
                  </span>
                </div>
              </div>
            </div>

            {/* Tracklist Table */}
            <div className="flex flex-col gap-2 mt-4">
              <h3 className="text-lg font-serif font-medium text-text-primary mb-2">
                Tracklist
              </h3>

              <div className="flex flex-col divide-y divide-border-subtle/50 rounded-2xl border border-border-subtle bg-surface/30 overflow-hidden">
                {selectedAlbum.tracks.map((track, idx) => {
                  const isCurrent = currentSong?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playSong(track, selectedAlbum.tracks);
                        }
                      }}
                      className={clsx(
                        "flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover/80 transition-colors cursor-pointer group",
                        isCurrent && "bg-surface-active"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-mono text-text-muted w-6 text-center">
                          {isCurrent && isPlaying ? (
                            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse mx-auto" />
                          ) : (
                            String(track.trackNumber || idx + 1).padStart(2, '0')
                          )}
                        </span>

                        <div className="flex flex-col min-w-0">
                          <span className={clsx(
                            "text-sm font-medium truncate",
                            isCurrent ? "text-accent" : "text-text-primary"
                          )}>
                            {track.title}
                          </span>
                          <span className="text-xs text-text-muted truncate">
                            {track.artist}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {track.duration && (
                          <span className="text-xs font-mono text-text-muted">
                            {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                          </span>
                        )}

                        <span className="text-xs px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-surface border border-border-subtle text-text-muted">
                          {track.genre?.split('/')[0]?.trim()}
                        </span>

                        <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-text-primary">
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Albums Shelf (when not viewing a specific album) */}
      {!selectedAlbum && (activeTab === 'albums' || activeTab === 'all') && albums.length > 0 && (
        <div className="flex flex-col gap-4 mb-14">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif tracking-tight text-text-primary flex items-center gap-2">
              <Disc className="w-5 h-5 text-accent" />
              Featured Albums
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className={clsx(
                  "group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-4",
                  isTron 
                    ? "bg-black/50 border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]" 
                    : "bg-surface/50 border-border-subtle hover:bg-surface hover:shadow-xl"
                )}
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden relative shadow-md">
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full bg-bg-base/90 text-text-primary text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                      View Album <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <h3 className="font-medium text-sm text-text-primary truncate">
                    {album.title}
                  </h3>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {album.artist}
                  </p>
                  <span className="text-[11px] font-mono text-text-muted mt-2">
                    {album.year} • {album.tracks.length} {album.tracks.length === 1 ? 'track' : 'tracks'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracks Grid (when tab is 'all') */}
      {!selectedAlbum && activeTab === 'all' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif tracking-tight text-text-primary flex items-center gap-2">
              <MusicIcon className="w-5 h-5 text-accent" />
              All Local Tracks
            </h2>
          </div>

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
                  transition={{ delay: i * 0.03 }}
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
                    {song.album && (
                      <p className="text-[11px] text-text-muted truncate mt-0.5">
                        {song.album}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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

