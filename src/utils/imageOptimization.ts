/**
 * Image optimization and download utilities for IMuse.
 * Handles automatic WebP transformation, resolution constraint, and on-demand format conversion.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  fit?: 'crop' | 'clip' | 'scale';
}

/**
 * Transforms an image URL to modern WebP format with optional size constraints.
 * Works seamlessly with Unsplash CDN and local assets.
 */
export function toWebPUrl(url?: string | null, options: ImageOptimizationOptions = {}): string {
  if (!url) return '';

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'crop'
  } = options;

  // 1. Handle local poster URLs (/posters/films/films-*.jpg -> .webp)
  if (url.includes('/posters/films/') && url.endsWith('.jpg')) {
    return url.replace(/\.jpg$/i, '.webp');
  }

  // 2. Handle Unsplash URLs
  if (url.includes('images.unsplash.com') || url.includes('plus.unsplash.com')) {
    try {
      const parsed = new URL(url);
      
      // Enforce webp format for Unsplash
      if (format === 'webp') {
        parsed.searchParams.set('fm', 'webp');
        parsed.searchParams.delete('auto'); // eliminate auto=format in favor of explicit fm=webp
      } else if (format === 'jpg') {
        parsed.searchParams.set('fm', 'jpg');
        parsed.searchParams.delete('auto');
      } else if (format === 'png') {
        parsed.searchParams.set('fm', 'png');
        parsed.searchParams.delete('auto');
      }

      if (quality) {
        parsed.searchParams.set('q', quality.toString());
      }

      if (fit) {
        parsed.searchParams.set('fit', fit);
      }

      if (width) {
        parsed.searchParams.set('w', width.toString());
      }

      if (height) {
        parsed.searchParams.set('h', height.toString());
      }

      return parsed.toString();
    } catch {
      // If URL parsing fails, fallback with regex or append
      let result = url.replace(/auto=format/g, 'fm=webp');
      if (!result.includes('fm=')) {
        result += (result.includes('?') ? '&' : '?') + 'fm=webp';
      }
      if (width && !result.includes('w=')) {
        result += `&w=${width}`;
      }
      return result;
    }
  }

  return url;
}

export type DownloadFormat = 'webp' | 'jpg' | 'png';

/**
 * Downloads an image on-demand in the user's chosen format.
 * Uses an offscreen HTML5 canvas to convert cross-origin/remote images into
 * the requested image format (image/webp, image/jpeg, image/png) as a Blob,
 * ensuring the user receives exactly the requested format with a clean file name.
 */
export async function downloadImageAsFormat(
  imageUrl: string,
  filenameBase: string = 'imuse-artwork',
  format: DownloadFormat = 'webp',
  quality: number = 0.92
): Promise<void> {
  const cleanTitle = filenameBase
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'imuse-artwork';

  const ext = format === 'jpg' ? 'jpg' : format === 'png' ? 'png' : 'webp';
  const finalFilename = `${cleanTitle}.${ext}`;

  // If local webp matches format directly, we can fetch directly or draw to canvas
  const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not create canvas 2d context');
        }

        // For JPEG, fill white background to avoid black transparency
        if (format === 'jpg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to dataURL
              try {
                const dataUrl = canvas.toDataURL(mimeType, quality);
                triggerAnchorDownload(dataUrl, finalFilename);
                resolve();
              } catch (e) {
                reject(e);
              }
              return;
            }

            const objectUrl = URL.createObjectURL(blob);
            triggerAnchorDownload(objectUrl, finalFilename);
            setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
            resolve();
          },
          mimeType,
          quality
        );
      } catch (err) {
        // Fallback: direct anchor download
        try {
          triggerAnchorDownload(imageUrl, finalFilename);
          resolve();
        } catch (fallbackErr) {
          reject(fallbackErr);
        }
      }
    };

    img.onerror = (err) => {
      // Fallback: direct download link
      try {
        triggerAnchorDownload(imageUrl, finalFilename);
        resolve();
      } catch (directErr) {
        reject(new Error(`Failed to load image for download: ${err}`));
      }
    };

    // Use full quality source for download
    let fetchUrl = imageUrl;
    if (imageUrl.includes('unsplash.com')) {
      fetchUrl = toWebPUrl(imageUrl, {
        width: 2560,
        quality: 95,
        format: format === 'jpg' ? 'jpg' : format === 'png' ? 'png' : 'webp'
      });
    }

    img.src = fetchUrl;
  });
}

function triggerAnchorDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
