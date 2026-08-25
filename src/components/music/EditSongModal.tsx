import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { Song } from '../../types';
import { musicDB } from '../../utils/musicDB';
import clsx from 'clsx';
import { useSettingsStore } from '../../store/useSettingsStore';

interface EditSongModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditSongModal({ song, isOpen, onClose, onSave }: EditSongModalProps) {
  const { appearance } = useSettingsStore();
  const isTron = appearance === 'tron';

  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album || '');
  const [genre, setGenre] = useState(song.genre || '');
  const [year, setYear] = useState(song.year?.toString() || '');
  const [artworkUrl, setArtworkUrl] = useState<string | undefined>(song.artworkUrl);
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when song changes
  useEffect(() => {
    if (isOpen) {
      setTitle(song.title);
      setArtist(song.artist);
      setAlbum(song.album || '');
      setGenre(song.genre || '');
      setYear(song.year?.toString() || '');
      setArtworkUrl(song.artworkUrl);
    }
  }, [song, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setArtworkUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) return;

    setIsSaving(true);
    try {
      await musicDB.updateSong(song.id, {
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || undefined,
        genre: genre.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
        artworkUrl,
      });
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to update song metadata:', err);
      alert('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={clsx(
            "relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl flex flex-col",
            isTron ? "bg-black border border-cyan-500/30" : "bg-bg-elevated border border-border-subtle"
          )}
        >
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-border-subtle/50">
            <h3 className={clsx("text-lg font-medium", isTron ? "text-cyan-400 font-mono uppercase" : "text-text-primary")}>
              Edit Song Details
            </h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
            {/* Artwork Editor */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className={clsx(
                  "relative w-32 h-32 rounded-lg overflow-hidden group cursor-pointer border border-border-subtle",
                  !artworkUrl && "bg-bg-secondary flex items-center justify-center"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {artworkUrl ? (
                  <img src={artworkUrl} alt="Artwork" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-text-muted" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-medium px-2 py-1 bg-black/40 rounded-md backdrop-blur-sm">Change Image</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
              
              {artworkUrl && (
                <button 
                  onClick={() => setArtworkUrl(undefined)}
                  className="text-xs text-text-muted hover:text-red-400 transition-colors"
                >
                  Remove Artwork
                </button>
              )}
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium tracking-wide text-text-secondary uppercase">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className={clsx(
                    "w-full bg-bg-secondary/50 border border-border-subtle rounded-lg px-4 py-2.5 text-sm outline-none transition-colors",
                    isTron ? "focus:border-cyan-500/50 text-cyan-50" : "focus:border-text-muted text-text-primary"
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium tracking-wide text-text-secondary uppercase">Artist</label>
                <input 
                  type="text" 
                  value={artist} 
                  onChange={(e) => setArtist(e.target.value)}
                  className={clsx(
                    "w-full bg-bg-secondary/50 border border-border-subtle rounded-lg px-4 py-2.5 text-sm outline-none transition-colors",
                    isTron ? "focus:border-cyan-500/50 text-cyan-50" : "focus:border-text-muted text-text-primary"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium tracking-wide text-text-secondary uppercase">Album</label>
                  <input 
                    type="text" 
                    value={album} 
                    onChange={(e) => setAlbum(e.target.value)}
                    className={clsx(
                      "w-full bg-bg-secondary/50 border border-border-subtle rounded-lg px-4 py-2.5 text-sm outline-none transition-colors",
                      isTron ? "focus:border-cyan-500/50 text-cyan-50" : "focus:border-text-muted text-text-primary"
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium tracking-wide text-text-secondary uppercase">Year</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                    className={clsx(
                      "w-full bg-bg-secondary/50 border border-border-subtle rounded-lg px-4 py-2.5 text-sm outline-none transition-colors",
                      isTron ? "focus:border-cyan-500/50 text-cyan-50" : "focus:border-text-muted text-text-primary"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-bg-secondary/30 border-t border-border-subtle/50 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !artist.trim()}
              className={clsx(
                "px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                isTron 
                  ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50 disabled:opacity-50" 
                  : "bg-text-primary text-bg-primary hover:bg-text-secondary disabled:opacity-50"
              )}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
