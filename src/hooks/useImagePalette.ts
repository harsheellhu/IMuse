import { useState, useEffect } from 'react';

interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

const paletteCache = new Map<string, Palette>();

export function useImagePalette(imageUrl: string | null) {
  const [palette, setPalette] = useState<Palette | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!imageUrl) {
      setPalette(null);
      return;
    }

    if (paletteCache.has(imageUrl)) {
      setPalette(paletteCache.get(imageUrl)!);
      return;
    }

    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          setIsLoading(false);
          return;
        }

        // Scale down for performance
        const MAX_DIMENSION = 64;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const colorCounts = new Map<string, number>();
        let maxCount = 0;
        let primaryColor = { r: 0, g: 0, b: 0 };
        
        // Simple color clustering
        const step = 4; // Sample every 4th pixel for speed
        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          if (a < 128) continue; // Ignore transparent
          
          // Ignore near white / near black unless it's a prominent feature, but simple for now
          // We round to nearest 16 to cluster colors
          const cr = Math.round(r / 16) * 16;
          const cg = Math.round(g / 16) * 16;
          const cb = Math.round(b / 16) * 16;
          
          const rgb = `${cr},${cg},${cb}`;
          const count = (colorCounts.get(rgb) || 0) + 1;
          colorCounts.set(rgb, count);
        }

        // Sort colors by frequency
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([rgbStr]) => {
            const [r, g, b] = rgbStr.split(',').map(Number);
            return { r, g, b };
          });

        // Filter out colors that are too dark or too light (to get vibrant palettes)
        const vibrantColors = sortedColors.filter(c => {
          const brightness = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
          return brightness > 30 && brightness < 220; // Ignore pure black and pure white
        });

        // Fallback to any color if no vibrant colors
        const finalColors = vibrantColors.length >= 3 ? vibrantColors : sortedColors;

        const primary = finalColors[0] || { r: 128, g: 128, b: 128 };
        // Try to find a secondary color that has some distance from primary
        const secondary = finalColors.find(c => 
          Math.abs(c.r - primary.r) + Math.abs(c.g - primary.g) + Math.abs(c.b - primary.b) > 60
        ) || finalColors[1] || primary;

        const accent = finalColors.find(c => 
          (Math.abs(c.r - primary.r) + Math.abs(c.g - primary.g) + Math.abs(c.b - primary.b) > 100) &&
          (Math.abs(c.r - secondary.r) + Math.abs(c.g - secondary.g) + Math.abs(c.b - secondary.b) > 100)
        ) || finalColors[2] || secondary;

        const newPalette: Palette = {
          primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
          secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`,
          accent: `rgb(${accent.r}, ${accent.g}, ${accent.b})`,
          background: `rgb(${Math.floor(primary.r * 0.3)}, ${Math.floor(primary.g * 0.3)}, ${Math.floor(primary.b * 0.3)})`,
        };

        paletteCache.set(imageUrl, newPalette);
        setPalette(newPalette);
      } catch (err) {
        console.error("Failed to extract color palette", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    img.onerror = () => {
      setIsLoading(false);
    };

    // To avoid CORS issues if caching fails
    img.src = imageUrl;
    
    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return { palette, isLoading };
}
