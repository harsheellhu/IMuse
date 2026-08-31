import React, { useState, useEffect } from 'react';
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
 * 2. Elegant progressive loading with a smooth shimmer skeleton.
 * 3. Soft fade-in and scale animation when fully rendered.
 * 4. Refined error fallback state with editorial styling.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  optimizeOptions = {},
  aspectRatio,
  fallbackText,
  showSkeleton = true,
  priority = false,
  onError,
  onLoad,
  ...imgProps
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Compute optimized WebP URL
  const optimizedSrc = React.useMemo(() => {
    return toWebPUrl(src, { format: 'webp', ...optimizeOptions });
  }, [src, optimizeOptions]);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [optimizedSrc]);

  if (!src || hasError) {
    return (
      <div 
        className={clsx(
          "w-full h-full bg-bg-secondary flex flex-col items-center justify-center p-4 text-center border border-border-subtle/50 select-none",
          containerClassName
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <div className="w-10 h-10 rounded-full bg-bg-elevated/80 flex items-center justify-center mb-2 shadow-xs">
          <ImageOff className="w-4 h-4 text-text-muted stroke-[1.5]" />
        </div>
        <span className="text-[11px] font-serif italic text-text-muted line-clamp-1 max-w-[80%]">
          {fallbackText || alt || 'Unavailable'}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={clsx("relative overflow-hidden w-full h-full", containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Sleek Loading Shimmer Skeleton */}
      {showSkeleton && !isLoaded && (
        <div 
          className="absolute inset-0 bg-bg-secondary overflow-hidden z-10 pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-full h-full animate-pulse bg-gradient-to-r from-bg-secondary via-bg-elevated/40 to-bg-secondary" />
        </div>
      )}

      <img
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
          "w-full h-full object-cover transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isLoaded ? "opacity-100 scale-100 filter-none" : "opacity-0 scale-[1.02] blur-xs",
          className
        )}
        {...imgProps}
      />
    </div>
  );
}
