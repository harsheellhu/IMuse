import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Check, FileImage, Sparkles, Loader2 } from 'lucide-react';
import { downloadImageAsFormat, DownloadFormat } from '../../utils/imageOptimization';
import clsx from 'clsx';

export interface ImageDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  creator?: string;
}

export function ImageDownloadModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  creator
}: ImageDownloadModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>('webp');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      await downloadImageAsFormat(imageUrl, title, selectedFormat);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formats: { id: DownloadFormat; label: string; tag: string; description: string }[] = [
    {
      id: 'webp',
      label: 'WebP',
      tag: 'Recommended',
      description: 'Ultra-lightweight, 80% smaller load with sharp details'
    },
    {
      id: 'jpg',
      label: 'JPG / JPEG',
      tag: 'Universal',
      description: 'Standard format, compatible with all devices and editors'
    },
    {
      id: 'png',
      label: 'PNG',
      tag: 'Lossless',
      description: 'High-fidelity lossless raster quality'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md bg-bg-elevated border border-border-subtle rounded-2xl shadow-2xl overflow-hidden p-6 md:p-7"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle/50">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-text-primary" />
              <h3 className="font-serif text-lg text-text-primary tracking-tight font-medium">
                Download Artwork
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Artwork Info Snippet */}
          <div className="my-5 flex items-center gap-4 bg-bg-secondary/60 p-3 rounded-xl border border-border-subtle/40">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface shrink-0">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-serif text-sm font-medium text-text-primary truncate">
                {title || 'Untitled Image'}
              </h4>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">
                {creator ? `${creator}` : 'High Resolution Visual'}
              </p>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2 mb-6">
            <label className="text-[10px] tracking-[0.2em] uppercase text-text-muted font-medium block mb-2">
              Select Download Format
            </label>
            {formats.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormat(f.id)}
                className={clsx(
                  "w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer",
                  selectedFormat === f.id
                    ? "border-text-primary bg-text-primary/[0.03] shadow-xs"
                    : "border-border-subtle hover:border-text-muted bg-transparent"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-text-primary">
                      .{f.label}
                    </span>
                    <span className={clsx(
                      "text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium",
                      f.id === 'webp' 
                        ? "bg-accent-soft text-text-primary"
                        : "bg-bg-secondary text-text-muted"
                    )}>
                      {f.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1 font-light">
                    {f.description}
                  </p>
                </div>
                <div className={clsx(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ml-3",
                  selectedFormat === f.id
                    ? "border-text-primary bg-text-primary text-bg-base"
                    : "border-border-strong"
                )}>
                  {selectedFormat === f.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            ))}
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={clsx(
              "w-full py-3.5 px-6 rounded-full font-medium text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md cursor-pointer",
              downloadSuccess
                ? "bg-color-success text-white"
                : "bg-text-primary text-bg-base hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            )}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing .{selectedFormat.toUpperCase()}...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Downloaded as .{selectedFormat.toUpperCase()}!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download as .{selectedFormat.toUpperCase()}</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-text-muted/70 text-center mt-3 font-light">
            File is generated and downloaded to your device only when chosen.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
