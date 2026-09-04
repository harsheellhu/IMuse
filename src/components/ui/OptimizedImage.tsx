import React, { useState, useEffect, useRef, useMemo } from 'react';
import clsx from 'clsx';
import { toWebPUrl, ImageOptimizationOptions } from '../../utils/imageOptimization';
import { ImageOff } from 'lucide-react';

export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'onLoad'> {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  optimizeOptions?: ImageOptimizationOptions;
  aspectRatio?: string;
  fallbackText?: string;
  showSkeleton?: boolean;
  priority?: boolean;
  onError?: (e?: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: (e?: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * OptimizedImage provides:
 * 1. Automatic WebP conversion for fast network transfer & lower page weight.
 * 2. Stable memoization by primitive options to eliminate skeleton flicker on re-renders.
 * 3. Instant cache detection: images in browser cache render with zero delay or skeleton flash.
 * 4. Asynchronous image decode and graceful editorial error fallback surface.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  optimizeOptions,
  aspectRatio,
  fallbackText,
  showSkeleton = true,
  priority = false,
  onError,
  onLoad,
  ...imgProps
}: OptimizedImageProps) {
  // Extract primitive properties to prevent object reference thrashing
  const optWidth = optimizeOptions?.width;
  const optHeight = optimizeOptions?.height;
  const optQuality = optimizeOptions?.quality;
  const optFormat = optimizeOptions?.format || 'webp';
  const optFit = optimizeOptions?.fit;

  const optimizedSrc = useMemo(() => {
    return toWebPUrl(src, {
      width: optWidth,
      height: optHeight,
      quality: optQuality,
      format: optFormat,
      fit: optFit
    });
  }, [src, optWidth, optHeight, optQuality, optFormat, optFit]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastSrcRef = useRef<string>(optimizedSrc);

  // When source URL changes, reset state
  useEffect(() => {
    if (lastSrcRef.current !== optimizedSrc) {
      lastSrcRef.current = optimizedSrc;
      setIsLoaded(false);
      setHasError(false);
    }
  }, [optimizedSrc]);

  // Check if image is already cached/complete on mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [optimizedSrc]);

  if (!src || hasError) {
    return (
      <div 
        className={clsx(
          "w-full h-full bg-bg-secondary flex flex-col items-center justify-center p-4 text-center border border-border-subtle/40 select-none",
          containerClassName
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center mb-2 shadow-xs">
          <ImageOff className="w-4 h-4 text-text-muted stroke-[1.5]" />
        </div>
        <span className="text-[11px] font-serif italic text-text-muted line-clamp-1 max-w-[85%]">
          {fallbackText || alt || 'Artwork'}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={clsx("relative overflow-hidden w-full h-full bg-bg-secondary", containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Sleek Loading Shimmer Skeleton (only visible while actively loading for the first time) */}
      {showSkeleton && !isLoaded && (
        <div 
          className="absolute inset-0 bg-bg-secondary overflow-hidden z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-full h-full animate-pulse bg-gradient-to-r from-bg-secondary via-bg-elevated/50 to-bg-secondary" />
        </div>
      )}

      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        className={clsx(
          "w-full h-full object-cover transform transition-opacity duration-500 ease-out",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...imgProps}
      />
    </div>
  );
}
