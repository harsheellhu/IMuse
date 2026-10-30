/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Test Suite for Atmosphere & Color Search Engine
 */

import { 
  isValidHex, 
  normalizeHex, 
  hexToOklab, 
  deltaEOklab, 
  colorDistance, 
  findClosestColorFamily, 
  matchPalette, 
  extractArtifactColors 
} from '../colorSearch';
import { 
  extractQueryAtmosphereConcepts, 
  evaluateArtifactAtmosphere, 
  ALL_CONCEPTS 
} from '../atmosphereSearch';
import { 
  searchDiscovery, 
  normalizeCatalogItem, 
  UnifiedArtifact 
} from '../discoveryEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- RUNNING DISCOVERY ENGINE TEST SUITE ---');

// ==========================================
// 1. HEX VALIDATION & NORMALIZATION TESTS
// ==========================================
console.log('Testing Hex validation and normalization...');
assert(isValidHex('#FFFFFF'), 'Valid 6-digit hex with hash');
assert(isValidHex('FFFFFF'), 'Valid 6-digit hex without hash');
assert(isValidHex('#abc'), 'Valid 3-digit hex');
assert(isValidHex('#7B2D43'), 'Valid burgundy hex');
assert(!isValidHex(''), 'Empty string is invalid hex');
assert(!isValidHex('#GGGGGG'), 'Non-hex character is invalid');
assert(!isValidHex('12345'), '5-digit hex is invalid');
assert(normalizeHex('#fff') === '#FFFFFF', '3-digit hex expands to 6-digit uppercase');
assert(normalizeHex('7b2d43') === '#7B2D43', 'Normalize hex returns uppercase with hash');

// ==========================================
// 2. OKLab PERCEPTUAL COLOR DISTANCE TESTS
// ==========================================
console.log('Testing OKLab perceptual color distance...');
const crimsonLab = hexToOklab('#C62828')!;
const vermilionLab = hexToOklab('#D32F2F')!;
const navyLab = hexToOklab('#10223D')!;

assert(crimsonLab !== null && vermilionLab !== null && navyLab !== null, 'Hex to OKLab conversion');
const distSimilar = deltaEOklab(crimsonLab, vermilionLab);
const distDifferent = deltaEOklab(crimsonLab, navyLab);

assert(distSimilar < distDifferent, 'Similar reds must have lower OKLab distance than red vs navy');
assert(distSimilar < 0.15, `Similar reds should be under 0.15 OKLab distance (was ${distSimilar.toFixed(3)})`);
assert(distDifferent > 0.35, `Red vs Navy should be distinct color distance > 0.35 (was ${distDifferent.toFixed(3)})`);

// Test closest color family
const family = findClosestColorFamily('#7B1E30');
assert(family.id === 'burgundy' || family.id === 'red', `Color family for #7B1E30 should be burgundy/red (was ${family.id})`);

// ==========================================
// 3. PALETTE MATCHING MODES (ALL, ANY, SIMILARITY)
// ==========================================
console.log('Testing Palette matching modes...');
const samplePalette = ['#10223D', '#C86D51', '#F4F1EA']; // Midnight navy, Terracotta, Ivory

// Test Single Color Matching
const singleMatch = matchPalette(['#152C4E'], samplePalette, 'any', 0.28);
assert(singleMatch.isMatch, 'Similar navy should match sample palette in ANY mode');
assert(singleMatch.score > 0.6, `Match score should be high for close shade (was ${singleMatch.score.toFixed(2)})`);

// Test Multi-Color ALL Mode (Success)
const multiAllMatch = matchPalette(['#10223D', '#C86D51'], samplePalette, 'all', 0.28);
assert(multiAllMatch.isMatch, 'Both navy and terracotta exist in sample, ALL mode should pass');

// Test Multi-Color ALL Mode (Failure when one color missing)
const multiAllFail = matchPalette(['#10223D', '#00FF00'], samplePalette, 'all', 0.28); // Green missing
assert(!multiAllFail.isMatch, 'Green is missing from sample, ALL mode must fail isMatch');

// Test Multi-Color ANY Mode
const multiAnyMatch = matchPalette(['#00FF00', '#10223D'], samplePalette, 'any', 0.28);
assert(multiAnyMatch.isMatch, 'ANY mode passes if at least one color matches');

// Test Determinism
const score1 = matchPalette(['#C86D51'], samplePalette, 'similarity', 0.28).score;
const score2 = matchPalette(['#C86D51'], samplePalette, 'similarity', 0.28).score;
assert(score1 === score2, 'Palette similarity must be strictly deterministic');

// ==========================================
// 4. ATMOSPHERE CONCEPT & SYNONYM MAPPING TESTS
// ==========================================
console.log('Testing Atmosphere concepts and synonyms...');
const concepts1 = extractQueryAtmosphereConcepts('A wistful evening looking at old memories');
assert(concepts1.some(c => c.id === 'nostalgic' || c.id === 'melancholic'), 'Wistful should map to nostalgic/melancholic');

const concepts2 = extractQueryAtmosphereConcepts('Tokyo night blade runner cyberpunk neon lights');
assert(concepts2.some(c => c.id === 'cyberpunk'), 'Blade runner / neon lights should map to cyberpunk');
assert(concepts2.some(c => c.id === 'nighttime'), 'Tokyo night should map to nighttime');

const concepts3 = extractQueryAtmosphereConcepts('Monolithic raw concrete building in the rain');
assert(concepts3.some(c => c.id === 'brutalist'), 'Raw concrete / monolithic should map to brutalist');
assert(concepts3.some(c => c.id === 'rainy'), 'Rain should map to rainy');

// ==========================================
// 5. UNIFIED DISCOVERY ENGINE SEARCH TESTS
// ==========================================
console.log('Testing Unified Discovery Engine search...');

// Mock catalog with distinct items
const mockCatalog: UnifiedArtifact[] = [
  normalizeCatalogItem({
    id: 'art-1',
    title: 'Rainy Night in Shinjuku',
    description: 'Neon reflections on wet asphalt in late night Tokyo.',
    category: 'Visual',
    tags: ['cyberpunk', 'rainy', 'tokyo', 'neon'],
    metadata: {
      palette: { primary: '#10223D', secondary: '#00E5FF', accent: '#D81B60' } // Navy, Cyan, Neon Pink
    }
  }, 'post'),
  normalizeCatalogItem({
    id: 'art-2',
    title: 'Brutalist Concrete Library',
    author: 'Tadao Ando',
    description: 'A quiet, monolithic university library filled with philosophical texts.',
    category: 'Literature',
    genres: ['Architecture', 'Philosophy', 'dark-academia'],
    metadata: {
      palette: { primary: '#757575', secondary: '#F4F1EA', accent: '#4E342E' } // Grey, Ivory, Dark Walnut
    }
  }, 'book'),
  normalizeCatalogItem({
    id: 'art-3',
    title: 'Mediterranean Sunburst',
    director: 'Luca Guadagnino',
    synopsis: 'A warm, romantic summer afternoon on the Italian coast surrounded by terracotta villas.',
    genres: ['Drama', 'Romance', 'mediterranean'],
    metadata: {
      palette: { primary: '#C86D51', secondary: '#F9A825', accent: '#00796B' } // Terracotta, Gold, Teal
    }
  }, 'film'),
  normalizeCatalogItem({
    id: 'art-4',
    title: 'No Image / Broken Metadata Artifact',
    description: 'Just an empty placeholder with missing fields.'
  }, 'post')
];

// Test 5A: Atmosphere query returns relevant items
const rainResults = searchDiscovery(mockCatalog, { query: 'rainy night in tokyo' });
assert(rainResults.length > 0, 'Rainy night in tokyo must return results');
assert(rainResults[0].artifact.id === 'art-1', `Top result for rainy tokyo should be art-1 (was ${rainResults[0].artifact.id})`);
assert(rainResults[0].reasons.length > 0, 'Must provide transparent reasons for match');

// Test 5B: Empty query generates NO fabricated results
const emptyResults = searchDiscovery(mockCatalog, { query: '', colors: [] });
assert(emptyResults.length === 0, 'Empty query without colors/filters must return 0 results');

// Test 5C: Category filter works
const bookOnlyResults = searchDiscovery(mockCatalog, { 
  query: 'library architecture', 
  category: 'book' 
});
assert(bookOnlyResults.length === 1 && bookOnlyResults[0].artifact.type === 'book', 'Category filter should restrict to books');

// Test 5D: Single Color Query Ranks Correctly
const colorResults = searchDiscovery(mockCatalog, {
  colors: ['#00E5FF'] // Cyan neon
});
assert(colorResults.length > 0, 'Color search should return matching items');
assert(colorResults[0].artifact.id === 'art-1', 'Item with cyan neon palette should rank first');

// Test 5E: Combined Atmosphere + Color Search with tunable balance
const combinedResults = searchDiscovery(mockCatalog, {
  query: 'romantic summer',
  colors: ['#C86D51'], // Terracotta
  colorWeight: 0.5
});
assert(combinedResults.length > 0, 'Combined search should find matching item');
assert(combinedResults[0].artifact.id === 'art-3', 'Art-3 matches both romantic summer and terracotta');
assert(combinedResults[0].isAtmosphereMatch && combinedResults[0].isColorMatch, 'Should flag both matches');

// Test 5F: Missing / Broken items do not crash search
const missingResults = searchDiscovery(mockCatalog, {
  query: 'empty placeholder'
});
assert(missingResults.length > 0, 'Artifact with missing fields must not crash engine');

console.log('--- ALL 5 ENGINE TEST SUITES PASSED CLEANLY ---');
