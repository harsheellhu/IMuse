/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Perceptual Color Search Engine for iMuse
 * Implements OKLab perceptual color space distance, color families,
 * multi-color matching modes (ALL, ANY, PALETTE_SIMILARITY),
 * and client-side progressive palette extraction with caching.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface OKLab {
  L: number;
  a: number;
  b: number;
}

export interface ColorFamily {
  id: string;
  name: string;
  hex: string;
  category: 'warm' | 'cool' | 'neutral' | 'earth';
  shades: { name: string; hex: string }[];
}

export type ColorMatchMode = 'all' | 'any' | 'similarity';

export interface ColorMatchDetail {
  targetHex: string;
  matchedHex: string;
  distance: number;
  isMatch: boolean;
}

export interface ColorMatchResult {
  score: number; // 0 to 1
  isMatch: boolean;
  closestColor: string;
  details: ColorMatchDetail[];
}

/**
 * Standard Curated Color Families with Nuanced Shades
 */
export const COLOR_FAMILIES: ColorFamily[] = [
  {
    id: 'burgundy',
    name: 'Burgundy & Wine',
    hex: '#6B1D2F',
    category: 'warm',
    shades: [
      { name: 'Deep Burgundy', hex: '#58111A' },
      { name: 'Bordeaux', hex: '#6B1D2F' },
      { name: 'Oxblood', hex: '#4A0E17' },
      { name: 'Dark Cherry', hex: '#7A1C30' }
    ]
  },
  {
    id: 'red',
    name: 'Red & Crimson',
    hex: '#C62828',
    category: 'warm',
    shades: [
      { name: 'Crimson', hex: '#B71C1C' },
      { name: 'Vermilion', hex: '#D32F2F' },
      { name: 'Brick Red', hex: '#A33327' },
      { name: 'Scarlet', hex: '#E53935' }
    ]
  },
  {
    id: 'terracotta',
    name: 'Terracotta & Clay',
    hex: '#C86D51',
    category: 'earth',
    shades: [
      { name: 'Raw Terracotta', hex: '#C86D51' },
      { name: 'Burnt Sienna', hex: '#A0522D' },
      { name: 'Baked Earth', hex: '#BD6B4D' },
      { name: 'Sandstone Clay', hex: '#D98263' }
    ]
  },
  {
    id: 'orange',
    name: 'Orange & Amber',
    hex: '#E65100',
    category: 'warm',
    shades: [
      { name: 'Deep Amber', hex: '#D87A00' },
      { name: 'Warm Ochre', hex: '#C67D28' },
      { name: 'Tangerine', hex: '#EF6C00' },
      { name: 'Rust', hex: '#B7410E' }
    ]
  },
  {
    id: 'yellow',
    name: 'Yellow & Gold',
    hex: '#F9A825',
    category: 'warm',
    shades: [
      { name: 'Muted Gold', hex: '#D4AF37' },
      { name: 'Dijon', hex: '#C49E35' },
      { name: 'Parchment Gold', hex: '#E2BA55' },
      { name: 'Soft Mustard', hex: '#E5B138' }
    ]
  },
  {
    id: 'olive',
    name: 'Olive & Moss',
    hex: '#556B2F',
    category: 'earth',
    shades: [
      { name: 'Dark Olive', hex: '#3E4E24' },
      { name: 'Moss Green', hex: '#5E6B47' },
      { name: 'Forest Moss', hex: '#465333' },
      { name: 'Muted Khaki', hex: '#707A57' }
    ]
  },
  {
    id: 'sage',
    name: 'Sage & Eucalyptus',
    hex: '#7D8D7B',
    category: 'cool',
    shades: [
      { name: 'Muted Sage', hex: '#7D8D7B' },
      { name: 'Silver Pine', hex: '#687766' },
      { name: 'Pale Lichen', hex: '#95A593' },
      { name: 'Dusty Mint', hex: '#879D89' }
    ]
  },
  {
    id: 'green',
    name: 'Forest & Emerald',
    hex: '#2E7D32',
    category: 'cool',
    shades: [
      { name: 'Emerald', hex: '#1B5E20' },
      { name: 'Deep Pine', hex: '#13401F' },
      { name: 'Evergreen', hex: '#235D3A' },
      { name: 'Cypress', hex: '#2A4D39' }
    ]
  },
  {
    id: 'teal',
    name: 'Teal & Sea Glass',
    hex: '#00796B',
    category: 'cool',
    shades: [
      { name: 'Deep Teal', hex: '#004D40' },
      { name: 'Aegean Teal', hex: '#1D676C' },
      { name: 'Sea Glass', hex: '#3B8B88' },
      { name: 'Dark Cyan', hex: '#006064' }
    ]
  },
  {
    id: 'blue',
    name: 'Navy & Cobalt',
    hex: '#1565C0',
    category: 'cool',
    shades: [
      { name: 'Midnight Navy', hex: '#10223D' },
      { name: 'Cobalt', hex: '#194982' },
      { name: 'Cinema Blue', hex: '#23395B' },
      { name: 'Steel Blue', hex: '#46607E' }
    ]
  },
  {
    id: 'indigo',
    name: 'Indigo & Midnight',
    hex: '#283593',
    category: 'cool',
    shades: [
      { name: 'Deep Indigo', hex: '#1A237E' },
      { name: 'Twilight Blue', hex: '#212759' },
      { name: 'Ink Blue', hex: '#1B1F3B' },
      { name: 'Dusk Violet', hex: '#30396B' }
    ]
  },
  {
    id: 'purple',
    name: 'Plum & Violet',
    hex: '#6A1B9A',
    category: 'cool',
    shades: [
      { name: 'Deep Plum', hex: '#4A144E' },
      { name: 'Muted Amethyst', hex: '#5D2E68' },
      { name: 'Blackberry', hex: '#3A153E' },
      { name: 'Dark Aubergine', hex: '#341B39' }
    ]
  },
  {
    id: 'dusty-rose',
    name: 'Dusty Rose & Mauve',
    hex: '#B0727B',
    category: 'warm',
    shades: [
      { name: 'Dusty Rose', hex: '#B0727B' },
      { name: 'Faded Mauve', hex: '#936874' },
      { name: 'Antique Blush', hex: '#C58C96' },
      { name: 'Muted Berry', hex: '#874E59' }
    ]
  },
  {
    id: 'brown',
    name: 'Walnut & Espresso',
    hex: '#4E342E',
    category: 'earth',
    shades: [
      { name: 'Dark Walnut', hex: '#3E2723' },
      { name: 'Espresso', hex: '#2D1F1C' },
      { name: 'Chestnut', hex: '#5D4037' },
      { name: 'Cacao', hex: '#43281C' }
    ]
  },
  {
    id: 'beige',
    name: 'Beige & Linen',
    hex: '#D7C4B7',
    category: 'neutral',
    shades: [
      { name: 'Warm Linen', hex: '#E0D4C8' },
      { name: 'Parchment', hex: '#D2C0B0' },
      { name: 'Oatmeal', hex: '#C5B5A5' },
      { name: 'Raw Canvas', hex: '#ECE4DB' }
    ]
  },
  {
    id: 'ivory',
    name: 'Ivory & Paper',
    hex: '#F4F1EA',
    category: 'neutral',
    shades: [
      { name: 'Museum Ivory', hex: '#F7F5F0' },
      { name: 'Aged Paper', hex: '#EBE5D8' },
      { name: 'Warm White', hex: '#FAF9F6' },
      { name: 'Alabaster', hex: '#F0ECE1' }
    ]
  },
  {
    id: 'grey',
    name: 'Slate & Silver',
    hex: '#757575',
    category: 'neutral',
    shades: [
      { name: 'Slate Grey', hex: '#546E7A' },
      { name: 'Pewter', hex: '#616161' },
      { name: 'Cool Silver', hex: '#9E9E9E' },
      { name: 'Graphite', hex: '#424242' }
    ]
  },
  {
    id: 'charcoal',
    name: 'Charcoal & Obsidian',
    hex: '#2B2D42',
    category: 'neutral',
    shades: [
      { name: 'Deep Charcoal', hex: '#232533' },
      { name: 'Obsidian', hex: '#1C1D24' },
      { name: 'Darkroom Noir', hex: '#18191F' },
      { name: 'Carbon Black', hex: '#111215' }
    ]
  }
];

// ==========================================
// COLOR CONVERSIONS & OKLab COLOR SPACE MATH
// ==========================================

/**
 * Validates a hexadecimal string format.
 */
export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  const clean = hex.trim().replace(/^#/, '');
  return /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(clean);
}

/**
 * Normalizes any valid hex code into standard `#RRGGBB` format.
 */
export function normalizeHex(hex: string): string | null {
  if (!isValidHex(hex)) return null;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3 || clean.length === 4) {
    clean = clean.split('').slice(0, 3).map(c => c + c).join('');
  } else if (clean.length === 8) {
    clean = clean.slice(0, 6);
  }
  return `#${clean.toUpperCase()}`;
}

/**
 * Converts Hex string to RGB object.
 */
export function hexToRgb(hex: string): RGB | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const intVal = parseInt(normalized.slice(1), 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255
  };
}

/**
 * Converts RGB components to Hex string.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c: number) => clamp(c).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parses generic CSS color string (hex or rgb/rgba) to RGB.
 */
export function parseColorToRgb(colorStr: string): RGB | null {
  if (!colorStr || typeof colorStr !== 'string') return null;
  const s = colorStr.trim();
  if (s.startsWith('#')) return hexToRgb(s);
  
  const rgbMatch = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
  }

  if (isValidHex(s)) return hexToRgb(s);
  return null;
}

/**
 * Converts sRGB channel [0..255] to Linear sRGB [0..1]
 */
function sRgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Converts RGB to OKLab perceptual color space coordinates.
 * Reference: Björn Ottosson, "A perceptual color space for image processing" (2020)
 */
export function rgbToOklab(rgb: RGB): OKLab {
  const lr = sRgbToLinear(rgb.r);
  const lg = sRgbToLinear(rgb.g);
  const lb = sRgbToLinear(rgb.b);

  // Cone response
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  };
}

export function hexToOklab(hex: string): OKLab | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToOklab(rgb) : null;
}

/**
 * Calculates Euclidean perceptual distance between two colors in OKLab space (ΔE_OKLab).
 * Distance scale:
 * 0.00 - 0.04: Near identical / Imperceptible
 * 0.04 - 0.12: Very close match
 * 0.12 - 0.22: Same color family / harmonious nuance
 * 0.22 - 0.35: Noticeably distinct shade
 * > 0.35: Different color
 */
export function deltaEOklab(c1: OKLab, c2: OKLab): number {
  const dL = c1.L - c2.L;
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Calculates perceptual distance directly between two hex / CSS color strings.
 */
export function colorDistance(colorA: string, colorB: string): number {
  const rgbA = parseColorToRgb(colorA);
  const rgbB = parseColorToRgb(colorB);
  if (!rgbA || !rgbB) return 1.0;
  return deltaEOklab(rgbToOklab(rgbA), rgbToOklab(rgbB));
}

/**
 * Finds the closest predefined ColorFamily for any arbitrary color.
 */
export function findClosestColorFamily(color: string): ColorFamily {
  const targetLab = hexToOklab(color);
  if (!targetLab) return COLOR_FAMILIES[0];

  let minDistance = Infinity;
  let closestFamily = COLOR_FAMILIES[0];

  for (const family of COLOR_FAMILIES) {
    const familyLab = hexToOklab(family.hex);
    if (!familyLab) continue;
    
    // Check main family centroid
    let dist = deltaEOklab(targetLab, familyLab);
    
    // Check shades for closer match
    for (const shade of family.shades) {
      const shadeLab = hexToOklab(shade.hex);
      if (shadeLab) {
        dist = Math.min(dist, deltaEOklab(targetLab, shadeLab));
      }
    }

    if (dist < minDistance) {
      minDistance = dist;
      closestFamily = family;
    }
  }

  return closestFamily;
}

// ==========================================
// PALETTE MATCHING & SEARCH RANKING ALGORITHM
// ==========================================

/**
 * Extracts a normalized list of hex colors from an artifact's palette metadata.
 */
export function extractArtifactColors(palette: any): string[] {
  if (!palette) return [];
  const colors: string[] = [];

  const addIfValid = (val: any) => {
    if (!val || typeof val !== 'string') return;
    const rgb = parseColorToRgb(val);
    if (rgb) {
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      if (!colors.includes(hex)) colors.push(hex);
    }
  };

  if (typeof palette === 'string') {
    addIfValid(palette);
  } else if (Array.isArray(palette)) {
    palette.forEach(addIfValid);
  } else if (typeof palette === 'object') {
    addIfValid(palette.primary);
    addIfValid(palette.secondary);
    addIfValid(palette.accent);
    addIfValid(palette.background);
    if (Array.isArray(palette.colors)) {
      palette.colors.forEach(addIfValid);
    }
  }

  return colors;
}

/**
 * Compares one or more target colors against an artifact's palette.
 * 
 * @param targetHexes Array of user-selected query colors
 * @param artifactColors Array of colors extracted from the artifact
 * @param mode 'all' | 'any' | 'similarity'
 * @param threshold Max distance considered a positive match (default ~0.26 in OKLab)
 */
export function matchPalette(
  targetHexes: string[],
  artifactColors: string[],
  mode: ColorMatchMode = 'any',
  threshold: number = 0.26
): ColorMatchResult {
  if (!targetHexes || targetHexes.length === 0 || !artifactColors || artifactColors.length === 0) {
    return { score: 0, isMatch: false, closestColor: '', details: [] };
  }

  const targetLabs = targetHexes
    .map(hex => ({ hex, lab: hexToOklab(hex) }))
    .filter(t => t.lab !== null) as { hex: string; lab: OKLab }[];

  const artifactLabs = artifactColors
    .map(hex => ({ hex, lab: hexToOklab(hex) }))
    .filter(a => a.lab !== null) as { hex: string; lab: OKLab }[];

  if (targetLabs.length === 0 || artifactLabs.length === 0) {
    return { score: 0, isMatch: false, closestColor: '', details: [] };
  }

  // Calculate distance matrix between each target color and artifact colors
  const details: ColorMatchDetail[] = targetLabs.map(target => {
    let bestDist = Infinity;
    let bestHex = artifactLabs[0].hex;

    for (const art of artifactLabs) {
      const dist = deltaEOklab(target.lab, art.lab);
      if (dist < bestDist) {
        bestDist = dist;
        bestHex = art.hex;
      }
    }

    return {
      targetHex: target.hex,
      matchedHex: bestHex,
      distance: bestDist,
      isMatch: bestDist <= threshold
    };
  });

  const closestColor = details.reduce((prev, curr) => 
    curr.distance < prev.distance ? curr : prev
  , details[0]).matchedHex;

  if (mode === 'all') {
    // Mode ALL: Every target color must match an artifact color within threshold
    const allMatched = details.every(d => d.isMatch);
    if (!allMatched) {
      // Soft score penalty for unmatched targets
      const matchedCount = details.filter(d => d.isMatch).length;
      const baseRatio = matchedCount / details.length;
      const avgDist = details.reduce((s, d) => s + d.distance, 0) / details.length;
      const score = Math.max(0, baseRatio * (1 - avgDist / 0.7) * 0.4);
      return { score, isMatch: false, closestColor, details };
    }

    // High score when all match, inversely proportional to maximum distance
    const maxDist = Math.max(...details.map(d => d.distance));
    const score = Math.max(0.4, 1 - (maxDist / threshold) * 0.5);
    return { score, isMatch: true, closestColor, details };
  }

  if (mode === 'any') {
    // Mode ANY: At least one target matches; score is driven by best matching color
    const matchedItems = details.filter(d => d.isMatch);
    const isMatch = matchedItems.length > 0;
    const bestDist = Math.min(...details.map(d => d.distance));
    
    // Additional boost if multiple targets match
    const multipleBoost = matchedItems.length > 1 ? (matchedItems.length - 1) * 0.08 : 0;
    const baseScore = Math.max(0, 1 - (bestDist / (threshold * 1.5)));
    const score = Math.min(1.0, Math.max(0, isMatch ? (baseScore + multipleBoost) : (baseScore * 0.5)));

    return { score, isMatch, closestColor, details };
  }

  // Mode 'similarity': Overall palette harmony and relationship
  // Uses two-way average minimum distance
  const targetToArtDistances = details.map(d => d.distance);
  const avgTargetDist = targetToArtDistances.reduce((a, b) => a + b, 0) / targetToArtDistances.length;

  // Artifact-to-target coverage
  let artToTargetSum = 0;
  for (const art of artifactLabs) {
    let minD = Infinity;
    for (const target of targetLabs) {
      const d = deltaEOklab(art.lab, target.lab);
      if (d < minD) minD = d;
    }
    artToTargetSum += minD;
  }
  const avgArtDist = artToTargetSum / artifactLabs.length;
  const overallDist = (avgTargetDist * 0.65) + (avgArtDist * 0.35);

  const score = Math.max(0, 1 - (overallDist / 0.45));
  const isMatch = score >= 0.45;

  return { score, isMatch, closestColor, details };
}

// ==========================================
// CLIENT-SIDE PALETTE EXTRACTION & CACHE
// ==========================================

const memoryPaletteCache = new Map<string, string[]>();

/**
 * Extracts a 3 to 5 swatch representative color palette from an image URL.
 * Automatically downsamples to 48px offscreen canvas and applies color quantization.
 * Results are cached in-memory and in sessionStorage.
 */
export async function extractPaletteFromImageUrl(imageUrl: string): Promise<string[]> {
  if (!imageUrl) return [];

  if (memoryPaletteCache.has(imageUrl)) {
    return memoryPaletteCache.get(imageUrl)!;
  }

  // Check sessionStorage
  try {
    const cached = sessionStorage.getItem(`imuse_palette_${imageUrl}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryPaletteCache.set(imageUrl, parsed);
        return parsed;
      }
    }
  } catch {
    // SessionStorage may be restricted
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve([]);
          return;
        }

        const size = 48;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBins = new Map<string, { r: number; g: number; b: number; count: number }>();

        for (let i = 0; i < imgData.length; i += 16) { // Sample every 4th pixel
          const a = imgData[i + 3];
          if (a < 128) continue; // Skip transparency

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // Quantize to 24-step color space
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          const existing = colorBins.get(key);
          if (existing) {
            existing.count++;
          } else {
            colorBins.set(key, { r: qr, g: qg, b: qb, count: 1 });
          }
        }

        const sorted = Array.from(colorBins.values())
          .sort((a, b) => b.count - a.count);

        // Pick distinct colors using OKLab distance
        const selectedHexes: string[] = [];
        for (const item of sorted) {
          const hex = rgbToHex(item.r, item.g, item.b);
          const lab = hexToOklab(hex);
          if (!lab) continue;

          // Don't include pure white or pure black unless distinct
          const isTooDark = lab.L < 0.05;
          const isTooLight = lab.L > 0.98;
          if (isTooDark && selectedHexes.some(h => (hexToOklab(h)?.L ?? 0) < 0.15)) continue;
          if (isTooLight && selectedHexes.some(h => (hexToOklab(h)?.L ?? 1) > 0.9)) continue;

          // Check if sufficiently distant from already selected colors
          const isDistinct = selectedHexes.every(existing => {
            const exLab = hexToOklab(existing);
            return exLab ? deltaEOklab(lab, exLab) > 0.14 : true;
          });

          if (isDistinct) {
            selectedHexes.push(hex);
            if (selectedHexes.length >= 4) break;
          }
        }

        // Fallback if not enough distinct colors found
        if (selectedHexes.length === 0 && sorted.length > 0) {
          selectedHexes.push(rgbToHex(sorted[0].r, sorted[0].g, sorted[0].b));
        }

        // Cache results
        memoryPaletteCache.set(imageUrl, selectedHexes);
        try {
          sessionStorage.setItem(`imuse_palette_${imageUrl}`, JSON.stringify(selectedHexes));
        } catch {}

        resolve(selectedHexes);
      } catch (err) {
        console.warn('Canvas palette extraction failed for', imageUrl, err);
        resolve([]);
      }
    };

    img.onerror = () => {
      // Return empty palette gracefully without throwing
      resolve([]);
    };

    img.src = imageUrl;
  });
}

/**
 * Extracts a palette from an uploaded or dropped user image file.
 */
export async function extractPaletteFromFile(file: File): Promise<string[]> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const palette = await extractPaletteFromImageUrl(objectUrl);
    return palette;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
