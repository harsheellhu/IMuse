import { LandingFeature } from '../types';

/**
 * Curated high-resolution imagery specifically for the immersive Landing Page slideshow.
 * Precomputed color palettes provide 0ms instant ambient backdrop without blocking CPU canvas extraction.
 * Image URLs use optimized 1920px WebP formats with crisp detail and rapid startup loading.
 */
export const landingFeatures: LandingFeature[] = [
  {
    id: 'lf-01',
    title: 'The Brutalist Monolith',
    category: 'Architecture',
    description: 'A study in concrete textures and dramatic light casting.',
    palette: {
      primary: 'rgb(140, 135, 125)',
      secondary: 'rgb(85, 80, 75)',
      accent: 'rgb(210, 195, 175)',
      background: 'rgb(24, 22, 20)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Brutalist concrete architecture',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-02',
    title: 'Neon Nights in Tokyo',
    category: 'Cinema',
    description: 'Cinematic street photography in the heart of Shinjuku.',
    palette: {
      primary: 'rgb(0, 210, 255)',
      secondary: 'rgb(220, 20, 120)',
      accent: 'rgb(255, 230, 80)',
      background: 'rgb(10, 15, 30)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Tokyo street at night',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-03',
    title: 'Nordic Minimalism',
    category: 'Design',
    description: 'Clean lines, muted colors, and intentional space.',
    palette: {
      primary: 'rgb(190, 180, 165)',
      secondary: 'rgb(120, 110, 100)',
      accent: 'rgb(230, 220, 205)',
      background: 'rgb(28, 25, 22)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Minimalist interior design',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-04',
    title: 'Dune Formation',
    category: 'Nature',
    description: 'Wind-swept sand patterns in the Namib desert.',
    palette: {
      primary: 'rgb(215, 140, 75)',
      secondary: 'rgb(160, 95, 45)',
      accent: 'rgb(245, 190, 130)',
      background: 'rgb(35, 20, 10)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Desert sand dunes',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-05',
    title: 'The Last Detail',
    category: 'Film',
    description: 'High-contrast moody portraiture.',
    palette: {
      primary: 'rgb(165, 125, 105)',
      secondary: 'rgb(90, 65, 55)',
      accent: 'rgb(220, 185, 160)',
      background: 'rgb(22, 18, 16)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Portrait photography',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-06',
    title: 'Abstract Typography',
    category: 'Art',
    description: 'Ink, paper, and the structure of letterforms.',
    palette: {
      primary: 'rgb(180, 175, 165)',
      secondary: 'rgb(80, 75, 70)',
      accent: 'rgb(240, 235, 225)',
      background: 'rgb(18, 18, 18)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Typography print layout',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-07',
    title: 'Metropolis',
    category: 'Urban Life',
    description: 'Steel and glass cutting through the sky.',
    palette: {
      primary: 'rgb(110, 150, 180)',
      secondary: 'rgb(60, 90, 115)',
      accent: 'rgb(180, 215, 240)',
      background: 'rgb(15, 22, 28)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Urban city skyline looking up',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-08',
    title: 'Ocean Swell',
    category: 'Nature',
    description: 'The raw power of the Atlantic captured at high shutter speed.',
    palette: {
      primary: 'rgb(40, 140, 175)',
      secondary: 'rgb(20, 85, 115)',
      accent: 'rgb(145, 215, 235)',
      background: 'rgb(8, 20, 28)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Ocean wave breaking',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-09',
    title: 'Industrial Precision',
    category: 'Design',
    description: 'Machined metal and engineered components.',
    palette: {
      primary: 'rgb(150, 155, 160)',
      secondary: 'rgb(85, 90, 95)',
      accent: 'rgb(215, 220, 225)',
      background: 'rgb(20, 22, 24)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Industrial design elements',
      source: 'Unsplash'
    }
  },
  {
    id: 'lf-10',
    title: 'The Archive',
    category: 'Books',
    description: 'Endless rows of history and knowledge.',
    palette: {
      primary: 'rgb(175, 130, 90)',
      secondary: 'rgb(105, 75, 50)',
      accent: 'rgb(230, 190, 150)',
      background: 'rgb(24, 18, 14)'
    },
    image: {
      thumbnailUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&fit=crop&fm=webp',
      previewUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1280&fit=crop&fm=webp',
      fullUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=85&w=1920&fit=crop&fm=webp',
      mobileUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=768&fit=crop&fm=webp',
      width: 1920,
      height: 1280,
      alt: 'Library stacks',
      source: 'Unsplash'
    }
  }
];
