import React, { useEffect, useRef } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { useShallow } from 'zustand/react/shallow';
import { musicDB } from '../../utils/musicDB';

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentBlobUrl, isPlaying, volume, updateTime, setDuration, setAudioElement } = useMusicStore(useShallow(s => ({
    currentBlobUrl: s.currentBlobUrl,
    isPlaying: s.isPlaying,
    volume: s.volume,
    updateTime: s.updateTime,
    setDuration: s.setDuration,
    setAudioElement: s.setAudioElement
  })));
  
  useEffect(() => {
    setAudioElement(audioRef.current);
  }, [setAudioElement, currentBlobUrl]); // Re-set if blob url changes just in case, though ref is stable
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Handle play/pause
  useEffect(() => {
    if (audioRef.current && currentBlobUrl) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error("Audio playback failed:", err);
          // If playback fails, sync store state back to paused
          useMusicStore.setState({ isPlaying: false });
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentBlobUrl]);

  // Handle seeking
  useEffect(() => {
    const handleSeek = (e: CustomEvent<number>) => {
      if (audioRef.current) {
        audioRef.current.currentTime = e.detail;
      }
    };
    window.addEventListener('seekAudio', handleSeek as EventListener);
    return () => window.removeEventListener('seekAudio', handleSeek as EventListener);
  }, []);
  
  const lastUpdateRef = useRef(0);
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const now = Date.now();
      // Throttle React state updates to ~250ms (4 times a second is smooth enough for progress bar, but drastically reduces React overhead compared to raw timeupdate)
      if (now - lastUpdateRef.current > 250) {
        updateTime(audioRef.current.currentTime);
        lastUpdateRef.current = now;
      }
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      const current = useMusicStore.getState().currentSong;
      if (current && (!current.duration || current.duration === 0)) {
        useMusicStore.setState({
          currentSong: { ...current, duration: dur }
        });
        musicDB.updateSong(current.id, { duration: dur });
      }
    }
  };

  const handleEnded = () => {
    const { queue, currentSong, playNext, togglePlay } = useMusicStore.getState();
    const currentIndex = queue.findIndex(s => s.id === currentSong?.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      playNext();
    } else {
      togglePlay();
    }
  };

  if (!currentBlobUrl) return null;

  return (
    <audio
      ref={audioRef}
      src={currentBlobUrl}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
    />
  );
}
