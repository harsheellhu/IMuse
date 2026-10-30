import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, RotateCcw, Wand2, Image as ImageIcon, Sparkles, 
  Download, Upload, Sliders, ChevronDown, ChevronUp, AlertTriangle, 
  CheckCircle2, Copy, Edit2, Palette, ShieldCheck, Sun, Moon,
  Type, Square, Eye, Zap, Layers, Trash2
} from 'lucide-react';
import { 
  ThemeTokens, CustomPalette, BUILTIN_THEMES, ThemeTypography, ThemeShape, ThemeDensity, ThemeTexture,
  deriveCompleteThemeTokens, analyzeContrast, improveContrast, 
  balancePalette, generateTastefulPalette, extractPaletteFromImage,
  exportPaletteToJson, validateAndImportPaletteJson, normalizeColor,
  hexToRgb, rgbToHex
} from '../../theme/tokens';
import { previewTheme, revertThemePreview } from '../../theme/applyTheme';
import clsx from 'clsx';

interface CustomPaletteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPalette?: CustomPalette | null;
  baseThemeId?: string;
  onSave: (palette: Omit<CustomPalette, 'id' | 'createdAt' | 'updatedAt'>, idToUpdate?: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

type EditorTab = 'colors' | 'typography' | 'shape' | 'effects';

const TYPOGRAPHY_OPTIONS: { id: ThemeTypography; label: string; primary: string; secondary: string; sample: string }[] = [
  { id: 'neutral', label: 'Neutral Grotesk', primary: 'Inter', secondary: 'Inter', sample: 'Modern, clean, and invisible UI typography.' },
  { id: 'editorial', label: 'Editorial Serif', primary: 'Inter', secondary: 'Playfair Display', sample: 'Magazine & museum catalogue balance.' },
  { id: 'modern', label: 'Modernist Geometric', primary: 'Outfit', secondary: 'Outfit', sample: 'Geometric architectural forms and clean rhythm.' },
  { id: 'neo-grotesk', label: 'Swiss Neo-Grotesk', primary: 'Helvetica Neue', secondary: 'Helvetica Neue', sample: 'Precise rational typography with tight metrics.' },
  { id: 'humanist', label: 'Humanist Sans', primary: 'Avenir Next', secondary: 'Avenir Next', sample: 'Warm, organic, and welcoming letterforms.' },
  { id: 'classical', label: 'Classical Serif', primary: 'Garamond', secondary: 'Garamond', sample: 'Traditional book typography with timeless dignity.' },
  { id: 'literary', label: 'Literary Journal', primary: 'Georgia', secondary: 'Georgia', sample: 'Rich reading atmosphere and literary heritage.' },
  { id: 'newspaper', label: 'Newspaper Broadsheet', primary: 'Franklin Gothic', secondary: 'Georgia', sample: 'Strong headlines and archival reporting weight.' },
  { id: 'art-book', label: 'Art Book Catalogue', primary: 'Helvetica', secondary: 'Helvetica', sample: 'Monograph titles and gallery exhibition captions.' },
  { id: 'brutalist', label: 'Neo-Brutalist', primary: 'Arial Black', secondary: 'Arial', sample: 'High impact bold contrast and deliberate structure.' },
  { id: 'technical', label: 'Technical Spec', primary: 'Inter', secondary: 'Space Mono', sample: 'Precision engineering with monospace metadata.' },
  { id: 'mono', label: 'Terminal Monospace', primary: 'Space Mono', secondary: 'Space Mono', sample: 'Utilitarian computational aesthetic.' },
  { id: 'futuristic', label: 'Retro Futurism', primary: 'Rajdhani', secondary: 'Rajdhani', sample: 'Period-inspired technological curves.' },
  { id: 'cinema', label: 'Cinematic Title', primary: 'Inter', secondary: 'Helvetica Neue', sample: 'Wide tracked film credits and atmospheric drama.' },
  { id: 'archive', label: 'Analog Archive', primary: 'Courier New', secondary: 'Courier New', sample: 'Typewriter documentation and film log records.' },
  { id: 'contemporary', label: 'Contemporary Luxury', primary: 'Inter', secondary: 'Playfair Display', sample: 'Haute editorial pairing with refined air.' },
  { id: 'minimal', label: 'Ultra Minimal', primary: 'Inter', secondary: 'Inter', sample: 'Generous whitespace with low-weight restraint.' },
];

const SHAPE_OPTIONS: { id: ThemeShape; label: string; radius: string; desc: string }[] = [
  { id: 'sharp', label: 'Sharp Edges', radius: '0px', desc: 'Precise architectural 90° corners' },
  { id: 'subtle', label: 'Subtle Precision', radius: '4px', desc: 'Minimal soft edge for utilitarian clarity' },
  { id: 'rounded', label: 'Modern Balanced', radius: '12px', desc: 'Harmonious ergonomic radius' },
  { id: 'soft', label: 'Organic Soft', radius: '24px', desc: 'Generous pill and pebble curves' },
  { id: 'editorial', label: 'Editorial Outlined', radius: '0px', desc: 'Sharp print borders with fine hairline' },
];

const DENSITY_OPTIONS: { id: ThemeDensity; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: 'High information density, minimal padding' },
  { id: 'dense', label: 'Dense', desc: 'Efficient spacing for deep cataloging' },
  { id: 'balanced', label: 'Balanced', desc: 'Harmonious standard spacing' },
  { id: 'relaxed', label: 'Relaxed', desc: 'Spacious editorial breathing room' },
  { id: 'spacious', label: 'Museum Spacious', desc: 'Gallery exhibition separation' },
];

export function CustomPaletteEditor({
  isOpen,
  onClose,
  initialPalette,
  baseThemeId = 'default',
  onSave,
  onDuplicate,
  onDelete,
}: CustomPaletteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('colors');

  // Determine initial values from initialPalette or base theme
  const getInitialTokens = (): ThemeTokens => {
    if (initialPalette?.tokens) {
      return { ...initialPalette.tokens };
    }
    if (BUILTIN_THEMES[baseThemeId]) {
      return { ...BUILTIN_THEMES[baseThemeId].tokens };
    }
    return { ...BUILTIN_THEMES.default.tokens };
  };

  const getInitialIsDark = (): boolean => {
    if (initialPalette) return initialPalette.isDark;
    if (BUILTIN_THEMES[baseThemeId]) return BUILTIN_THEMES[baseThemeId].isDark;
    return false;
  };

  const baseTheme = BUILTIN_THEMES[baseThemeId] || BUILTIN_THEMES.default;

  const [name, setName] = useState(initialPalette?.name || `${baseTheme.name} Custom`);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDark, setIsDark] = useState(getInitialIsDark());
  const [tokens, setTokens] = useState<ThemeTokens>(getInitialTokens());
  
  // Art direction attributes
  const [typography, setTypography] = useState<ThemeTypography>(
    initialPalette?.typography || baseTheme.defaultTypography || 'neutral'
  );
  const [shapeLanguage, setShapeLanguage] = useState<ThemeShape>(
    initialPalette?.shapeLanguage || baseTheme.defaultShape || 'rounded'
  );
  const [radiusBase, setRadiusBase] = useState<string>(
    initialPalette?.radiusBase || tokens.radiusBase || '8px'
  );
  const [borderWidth, setBorderWidth] = useState<string>(
    initialPalette?.borderWidth || tokens.borderWidth || '1px'
  );
  const [density, setDensity] = useState<ThemeDensity>(
    initialPalette?.density || baseTheme.defaultDensity || 'balanced'
  );
  const [glassIntensity, setGlassIntensity] = useState<number>(
    initialPalette?.glassIntensity !== undefined ? initialPalette.glassIntensity : 0.8
  );
  const [shadowIntensity, setShadowIntensity] = useState<number>(
    initialPalette?.shadowIntensity !== undefined ? initialPalette.shadowIntensity : 1
  );
  const [glowIntensity, setGlowIntensity] = useState<number>(
    initialPalette?.glowIntensity !== undefined ? initialPalette.glowIntensity : (baseTheme.glowIntensity || 0)
  );
  const [glowColor, setGlowColor] = useState<string>(
    tokens.glowColor || baseTheme.glowColor || '#00FFFF'
  );
  const [animationIntensity, setAnimationIntensity] = useState<'static' | 'minimal' | 'smooth' | 'cinematic'>(
    initialPalette?.animationIntensity || 'smooth'
  );

  const [showAdvancedColors, setShowAdvancedColors] = useState(false);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state whenever opened / initialPalette changes
  useEffect(() => {
    if (isOpen) {
      const initialTok = getInitialTokens();
      const initialDark = getInitialIsDark();
      setTokens(initialTok);
      setIsDark(initialDark);
      setName(initialPalette?.name || `${baseTheme.name} Custom`);
      setTypography(initialPalette?.typography || baseTheme.defaultTypography || 'neutral');
      setShapeLanguage(initialPalette?.shapeLanguage || baseTheme.defaultShape || 'rounded');
      setRadiusBase(initialPalette?.radiusBase || initialTok.radiusBase || '8px');
      setBorderWidth(initialPalette?.borderWidth || initialTok.borderWidth || '1px');
      setDensity(initialPalette?.density || baseTheme.defaultDensity || 'balanced');
      setGlassIntensity(initialPalette?.glassIntensity !== undefined ? initialPalette.glassIntensity : 0.8);
      setShadowIntensity(initialPalette?.shadowIntensity !== undefined ? initialPalette.shadowIntensity : 1);
      setGlowIntensity(initialPalette?.glowIntensity !== undefined ? initialPalette.glowIntensity : (baseTheme.glowIntensity || 0));
      setGlowColor(initialTok.glowColor || baseTheme.glowColor || '#00FFFF');
      setAnimationIntensity(initialPalette?.animationIntensity || 'smooth');

      previewTheme(initialTok, initialDark, {
        themeId: 'custom-preview',
        radiusBase: initialPalette?.radiusBase || initialTok.radiusBase,
        borderWidth: initialPalette?.borderWidth || initialTok.borderWidth,
        glassIntensity: initialPalette?.glassIntensity,
        shadowIntensity: initialPalette?.shadowIntensity,
        glowIntensity: initialPalette?.glowIntensity,
        glowColor: initialTok.glowColor,
      });
    }
  }, [isOpen, initialPalette, baseThemeId]);

  // Live preview on every token / option change
  const triggerPreview = (updatedTokens: ThemeTokens, darkState: boolean) => {
    previewTheme(updatedTokens, darkState, {
      themeId: 'custom-preview',
      radiusBase,
      borderWidth,
      glassIntensity,
      shadowIntensity,
      glowIntensity,
      glowColor,
    });
  };

  const updateToken = (key: keyof ThemeTokens, value: string, autoDerive = false) => {
    if (autoDerive) {
      if (key === 'accent' || key === 'background' || key === 'text' || key === 'surface') {
        const derived = deriveCompleteThemeTokens({
          background: key === 'background' ? value : tokens.background,
          surface: key === 'surface' ? value : tokens.surface,
          text: key === 'text' ? value : tokens.text,
          accent: key === 'accent' ? value : tokens.accent,
          radiusBase,
          borderWidth,
          glowColor,
          glowIntensity,
          isDark,
        });
        setTokens(derived);
        triggerPreview(derived, isDark);
        return;
      }
    }

    const nextTokens = { ...tokens, [key]: value };
    setTokens(nextTokens);
    triggerPreview(nextTokens, isDark);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Contrast analysis
  const textContrast = analyzeContrast(tokens.text, tokens.background);
  const accentContrast = analyzeContrast(tokens.accentContrast, tokens.accent);

  const handleImproveContrast = () => {
    const improvedText = improveContrast(tokens.text, tokens.background, 4.5);
    const improvedAccentContrast = improveContrast(tokens.accentContrast, tokens.accent, 4.5);
    const next = {
      ...tokens,
      text: improvedText,
      accentContrast: improvedAccentContrast,
    };
    setTokens(next);
    triggerPreview(next, isDark);
    showNotification('Contrast optimized to WCAG AA');
  };

  const handleRandomize = () => {
    const randomTokens = generateTastefulPalette(isDark);
    const updated = {
      ...randomTokens,
      radiusBase,
      borderWidth,
    };
    setTokens(updated);
    triggerPreview(updated, isDark);
    showNotification('Generated harmonious palette');
  };

  const handleBalance = (harmony: 'complementary' | 'analogous' | 'monochrome' | 'triadic') => {
    const balanced = balancePalette(tokens.accent, harmony);
    const derived = deriveCompleteThemeTokens({
      background: tokens.background,
      text: tokens.text,
      accent: balanced.accent,
      radiusBase,
      borderWidth,
      isDark,
    });
    setTokens(derived);
    triggerPreview(derived, isDark);
    showNotification(`Balanced with ${harmony} harmony`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtractingImage(true);
      const extracted = await extractPaletteFromImage(file);
      const withShape = {
        ...extracted,
        radiusBase,
        borderWidth,
      };
      setTokens(withShape);
      setIsDark(true);
      triggerPreview(withShape, true);
      showNotification('Palette extracted from image');
    } catch (err) {
      console.error(err);
      showNotification('Could not extract colors from image');
    } finally {
      setIsExtractingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const json = exportPaletteToJson({
      id: initialPalette?.id || 'custom-export',
      name,
      isDark,
      baseThemeId,
      typography,
      shapeLanguage,
      density,
      radiusBase,
      borderWidth,
      glassIntensity,
      shadowIntensity,
      glowIntensity,
      animationIntensity,
      tokens,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Theme exported as JSON');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = validateAndImportPaletteJson(content);
      if (imported) {
        setName(imported.name);
        setIsDark(imported.isDark);
        setTokens(imported.tokens);
        if (imported.typography) setTypography(imported.typography);
        if (imported.shapeLanguage) setShapeLanguage(imported.shapeLanguage);
        if (imported.radiusBase) setRadiusBase(imported.radiusBase);
        if (imported.borderWidth) setBorderWidth(imported.borderWidth);
        if (imported.density) setDensity(imported.density);
        if (imported.glassIntensity !== undefined) setGlassIntensity(imported.glassIntensity);
        if (imported.shadowIntensity !== undefined) setShadowIntensity(imported.shadowIntensity);
        if (imported.glowIntensity !== undefined) setGlowIntensity(imported.glowIntensity);
        if (imported.animationIntensity) setAnimationIntensity(imported.animationIntensity);

        previewTheme(imported.tokens, imported.isDark, {
          themeId: 'custom-preview',
          radiusBase: imported.radiusBase,
          borderWidth: imported.borderWidth,
          glassIntensity: imported.glassIntensity,
          shadowIntensity: imported.shadowIntensity,
          glowIntensity: imported.glowIntensity,
        });
        showNotification(`Imported "${imported.name}" successfully`);
      } else {
        showNotification('Invalid or corrupted theme JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToBase = () => {
    const initialTok = BUILTIN_THEMES[baseThemeId]?.tokens || BUILTIN_THEMES.default.tokens;
    const initialDark = BUILTIN_THEMES[baseThemeId]?.isDark || false;
    const initialTypo = BUILTIN_THEMES[baseThemeId]?.defaultTypography || 'neutral';
    const initialShape = BUILTIN_THEMES[baseThemeId]?.defaultShape || 'rounded';
    const initialDensity = BUILTIN_THEMES[baseThemeId]?.defaultDensity || 'balanced';

    setTokens({ ...initialTok });
    setIsDark(initialDark);
    setTypography(initialTypo);
    setShapeLanguage(initialShape);
    setRadiusBase(initialTok.radiusBase || '8px');
    setBorderWidth(initialTok.borderWidth || '1px');
    setDensity(initialDensity);
    setGlassIntensity(0.8);
    setShadowIntensity(1);
    setGlowIntensity(BUILTIN_THEMES[baseThemeId]?.glowIntensity || 0);

    triggerPreview(initialTok, initialDark);
    showNotification(`Restored ${BUILTIN_THEMES[baseThemeId]?.name || 'Base'} presets`);
  };

  const handleCancel = () => {
    revertThemePreview(initialPalette?.id || baseThemeId);
    onClose();
  };

  const handleSave = () => {
    onSave(
      {
        name: name.trim() || 'My Theme',
        baseThemeId,
        isDark,
        typography,
        shapeLanguage,
        density,
        radiusBase,
        borderWidth,
        glassIntensity,
        shadowIntensity,
        glowIntensity,
        animationIntensity,
        tokens: {
          ...tokens,
          radiusBase,
          borderWidth,
          glowColor: glowIntensity > 0 ? glowColor : undefined,
          glowIntensity: glowIntensity > 0 ? glowIntensity : undefined,
        },
      },
      initialPalette?.id
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex flex-col justify-end md:justify-center items-center p-0 md:p-6"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full max-w-6xl h-[94vh] md:h-[88vh] bg-surface border border-border-subtle rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-text-primary"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface/90 backdrop-blur-md z-20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center font-serif text-sm font-semibold">
                iM
              </div>
              <div>
                {isEditingName ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                    autoFocus
                    className="text-base font-serif font-medium bg-background-elevated border border-border-strong rounded px-2 py-0.5 text-text-primary focus:outline-none"
                    maxLength={32}
                  />
                ) : (
                  <div 
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-2 cursor-pointer group"
                    title="Click to rename theme"
                  >
                    <h2 className="text-base font-serif font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                      {name}
                    </h2>
                    <Edit2 className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                  <span>Custom Theme Studio</span>
                  <span>•</span>
                  <span className="capitalize">{typography.replace('-', ' ')}</span>
                  <span>•</span>
                  <span className="uppercase">{isDark ? 'Dark Surface' : 'Light Surface'}</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors border border-border-subtle cursor-pointer"
                title="Export theme JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              <label className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors border border-border-subtle cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              {initialPalette?.id && onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Delete theme "${name}"?`)) {
                      onDelete(initialPalette.id);
                      onClose();
                    }
                  }}
                  className="p-2 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete this custom theme"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors ml-1 cursor-pointer"
                title="Close editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-accent-primary text-accent-contrast text-xs font-medium px-4 py-1.5 text-center z-30"
              >
                {notification}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Category Tabs */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-background/60 border-b border-border-subtle text-xs gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('colors')}
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer",
                  activeTab === 'colors'
                    ? "bg-text-primary text-background shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                )}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colors & Palette</span>
              </button>

              <button
                onClick={() => setActiveTab('typography')}
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer",
                  activeTab === 'typography'
                    ? "bg-text-primary text-background shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                )}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Typography</span>
              </button>

              <button
                onClick={() => setActiveTab('shape')}
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer",
                  activeTab === 'shape'
                    ? "bg-text-primary text-background shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                )}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Shape & Borders</span>
              </button>

              <button
                onClick={() => setActiveTab('effects')}
                className={clsx(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer",
                  activeTab === 'effects'
                    ? "bg-text-primary text-background shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Atmosphere & Effects</span>
              </button>
            </div>

            {/* Quick Dark / Light toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nextDark = !isDark;
                  setIsDark(nextDark);
                  const inverted = deriveCompleteThemeTokens({
                    background: nextDark ? '#0A0A0A' : '#FAFAFA',
                    surface: nextDark ? '#141414' : '#F0F0EE',
                    text: nextDark ? '#F0F0F0' : '#141414',
                    accent: tokens.accent,
                    radiusBase,
                    borderWidth,
                    isDark: nextDark,
                  });
                  setTokens(inverted);
                  triggerPreview(inverted, nextDark);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border-subtle bg-surface hover:bg-background-elevated text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-xs"
              >
                {isDark ? <Moon className="w-3.5 h-3.5 text-cyan-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Left editor controls, Right live interface preview */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle min-h-0">
            
            {/* Left Controls Column */}
            <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto">
              
              {/* TAB 1: COLORS */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  {/* Color Helpers Toolbar */}
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleRandomize}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-elevated hover:bg-surface border border-border-subtle text-text-primary text-xs transition-all cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-accent-primary" />
                        <span>Harmonize</span>
                      </button>

                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-elevated hover:bg-surface border border-border-subtle text-text-primary text-xs transition-all cursor-pointer">
                        <ImageIcon className="w-3.5 h-3.5 text-accent-primary" />
                        <span>{isExtractingImage ? 'Extracting...' : 'From Artwork'}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isExtractingImage}
                          className="hidden"
                        />
                      </label>

                      <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-elevated hover:bg-surface border border-border-subtle text-text-primary text-xs transition-all cursor-pointer">
                          <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                          <span>Harmony</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-background-elevated border border-border-subtle rounded-xl shadow-xl p-1 z-40 min-w-[140px]">
                          <button onClick={() => handleBalance('analogous')} className="px-3 py-1.5 text-left text-xs rounded hover:bg-surface text-text-primary">Analogous</button>
                          <button onClick={() => handleBalance('complementary')} className="px-3 py-1.5 text-left text-xs rounded hover:bg-surface text-text-primary">Complementary</button>
                          <button onClick={() => handleBalance('monochrome')} className="px-3 py-1.5 text-left text-xs rounded hover:bg-surface text-text-primary">Monochrome</button>
                          <button onClick={() => handleBalance('triadic')} className="px-3 py-1.5 text-left text-xs rounded hover:bg-surface text-text-primary">Triadic</button>
                        </div>
                      </div>
                    </div>

                    {/* WCAG Contrast Meter */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={clsx(
                        "font-mono font-medium px-2 py-0.5 rounded text-[10px]",
                        textContrast.isGood 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : textContrast.isAcceptable
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse"
                      )}>
                        {textContrast.ratio}:1 ({textContrast.status})
                      </span>
                      {!textContrast.isGood && (
                        <button
                          onClick={handleImproveContrast}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Fix</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Core Atmosphere Palette */}
                  <div className="space-y-3 bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-2">
                      Primary Atmosphere Colors
                    </h3>
                    <ColorPickerRow label="Background" description="Main canvas environment" value={tokens.background} onChange={(val) => updateToken('background', val, true)} />
                    <ColorPickerRow label="Surface" description="Cards, panels and feeds" value={tokens.surface} onChange={(val) => updateToken('surface', val)} />
                    <ColorPickerRow label="Elevated Surface" description="Modals, popovers, dropdown menus" value={tokens.backgroundElevated} onChange={(val) => updateToken('backgroundElevated', val)} />
                    <ColorPickerRow label="Subtle Canvas" description="Nested sub-panels" value={tokens.backgroundSubtle} onChange={(val) => updateToken('backgroundSubtle', val)} />
                    <ColorPickerRow label="Primary Text" description="Main titles and body text" value={tokens.text} onChange={(val) => updateToken('text', val, true)} />
                    <ColorPickerRow label="Muted Text" description="Secondary captions and metadata" value={tokens.textMuted} onChange={(val) => updateToken('textMuted', val)} />
                    <ColorPickerRow label="Accent Color" description="Primary action buttons and focal highlights" value={tokens.accent} onChange={(val) => updateToken('accent', val, true)} />
                    <ColorPickerRow label="Accent Contrast" description="Text drawn on top of accent color" value={tokens.accentContrast} onChange={(val) => updateToken('accentContrast', val)} />
                    <ColorPickerRow label="Border Tone" description="Card dividers and bounding lines" value={tokens.border} onChange={(val) => updateToken('border', val)} />
                    <ColorPickerRow label="Divider Tone" description="Subtle hairline section breaks" value={tokens.divider} onChange={(val) => updateToken('divider', val)} />
                  </div>

                  {/* Advanced Color System */}
                  <div>
                    <button
                      onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-background-elevated/30 hover:bg-background-elevated/60 border border-border-subtle rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-accent-primary" />
                        <span>Detailed State Colors & Ambient Gradients</span>
                      </div>
                      {showAdvancedColors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <AnimatePresence>
                      {showAdvancedColors && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4 pt-4"
                        >
                          <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                            <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Surface States</h4>
                            <ColorPickerRow label="Surface Hover" value={tokens.surfaceHover} onChange={(v) => updateToken('surfaceHover', v)} />
                            <ColorPickerRow label="Surface Active" value={tokens.surfaceActive} onChange={(v) => updateToken('surfaceActive', v)} />
                            <ColorPickerRow label="Secondary Surface" value={tokens.surfaceSecondary} onChange={(v) => updateToken('surfaceSecondary', v)} />
                            <ColorPickerRow label="Text Subtle" value={tokens.textSubtle} onChange={(v) => updateToken('textSubtle', v)} />
                            <ColorPickerRow label="Text Inverse" value={tokens.textInverse} onChange={(v) => updateToken('textInverse', v)} />
                          </div>

                          <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                            <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Accent & Control States</h4>
                            <ColorPickerRow label="Accent Hover" value={tokens.accentHover} onChange={(v) => updateToken('accentHover', v)} />
                            <ColorPickerRow label="Accent Active" value={tokens.accentActive} onChange={(v) => updateToken('accentActive', v)} />
                            <ColorPickerRow label="Accent Soft" value={tokens.accentSoft} onChange={(v) => updateToken('accentSoft', v)} />
                            <ColorPickerRow label="Control Background" value={tokens.controlBg} onChange={(v) => updateToken('controlBg', v)} />
                            <ColorPickerRow label="Control Border" value={tokens.controlBorder} onChange={(v) => updateToken('controlBorder', v)} />
                          </div>

                          <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                            <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Atmosphere & Gradient</h4>
                            <div className="space-y-1.5">
                              <span className="text-xs font-medium text-text-primary block">Ambient Theme Gradient</span>
                              <input
                                type="text"
                                value={tokens.themeGradient}
                                onChange={(e) => updateToken('themeGradient', e.target.value)}
                                placeholder="radial-gradient(...) or linear-gradient(...)"
                                className="w-full text-xs font-mono bg-background px-3 py-2 rounded-lg border border-border-subtle text-text-primary focus:outline-none"
                              />
                            </div>
                            <ColorPickerRow label="Canvas Grid" value={tokens.canvasGridColor} onChange={(v) => updateToken('canvasGridColor', v)} />
                            <ColorPickerRow label="Canvas Node Border" value={tokens.canvasNodeBorder} onChange={(v) => updateToken('canvasNodeBorder', v)} />
                            <ColorPickerRow label="Scrollbar Thumb" value={tokens.scrollbarThumb} onChange={(v) => updateToken('scrollbarThumb', v)} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* TAB 2: TYPOGRAPHY */}
              {activeTab === 'typography' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                      Typography Pairing & Architecture
                    </h3>
                    <span className="text-[11px] text-text-muted">{TYPOGRAPHY_OPTIONS.length} Curated Pairings</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TYPOGRAPHY_OPTIONS.map((typo) => {
                      const isSelected = typography === typo.id;
                      return (
                        <div
                          key={typo.id}
                          onClick={() => {
                            setTypography(typo.id);
                            showNotification(`Typography set to ${typo.label}`);
                          }}
                          className={clsx(
                            "p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-2.5",
                            isSelected
                              ? "bg-background-elevated border-text-primary ring-2 ring-text-primary/10 shadow-sm"
                              : "bg-background-elevated/40 border-border-subtle hover:border-text-secondary hover:bg-background-elevated"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary">{typo.label}</span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-text-primary text-background flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>

                          <div className={`p-2.5 rounded-lg bg-surface/60 border border-border-subtle/50 typo-${typo.id}`}>
                            <span className="text-display block text-xl leading-none text-text-primary font-medium mb-1">
                              Aa Bb Cc 123
                            </span>
                            <span className="text-body block text-[11px] text-text-muted line-clamp-1">
                              {typo.sample}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
                            <span>Display: {typo.secondary}</span>
                            <span>Body: {typo.primary}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: SHAPE & BORDERS */}
              {activeTab === 'shape' && (
                <div className="space-y-6">
                  {/* Corner Shape Selection */}
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                      Corner Curvature & Shape Language
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {SHAPE_OPTIONS.map((s) => {
                        const isSelected = shapeLanguage === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              setShapeLanguage(s.id);
                              setRadiusBase(s.radius);
                              triggerPreview({ ...tokens, radiusBase: s.radius }, isDark);
                              showNotification(`Corner curvature: ${s.label}`);
                            }}
                            className={clsx(
                              "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-2",
                              isSelected
                                ? "bg-background-elevated border-text-primary ring-2 ring-text-primary/10"
                                : "bg-background-elevated/40 border-border-subtle hover:border-text-secondary"
                            )}
                          >
                            <div 
                              className="w-12 h-12 bg-text-primary/10 border-2 border-text-primary/50 shadow-xs"
                              style={{ borderRadius: s.radius }}
                            />
                            <div>
                              <span className="text-xs font-semibold text-text-primary block">{s.label}</span>
                              <span className="text-[10px] text-text-muted">{s.radius} • {s.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Border Width / Strength */}
                  <div className="space-y-3 bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                      Border Strength & Structure
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { width: '0px', label: 'Borderless' },
                        { width: '1px', label: 'Fine (1px)' },
                        { width: '2px', label: 'Defined (2px)' },
                        { width: '3px', label: 'Bold (3px)' },
                      ].map((b) => (
                        <button
                          key={b.width}
                          onClick={() => {
                            setBorderWidth(b.width);
                            triggerPreview({ ...tokens, borderWidth: b.width }, isDark);
                          }}
                          className={clsx(
                            "py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                            borderWidth === b.width
                              ? "bg-text-primary text-background border-text-primary"
                              : "bg-surface border-border-subtle text-text-secondary hover:text-text-primary"
                          )}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Density */}
                  <div className="space-y-3 bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                      Feed & Interface Density
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DENSITY_OPTIONS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setDensity(d.id);
                            showNotification(`Content density: ${d.label}`);
                          }}
                          className={clsx(
                            "p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                            density === d.id
                              ? "bg-text-primary text-background border-text-primary"
                              : "bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:bg-background-elevated"
                          )}
                        >
                          <span className="text-xs font-medium block">{d.label}</span>
                          <span className={clsx("text-[10px] block opacity-70", density === d.id ? "text-background" : "text-text-muted")}>
                            {d.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ATMOSPHERE & EFFECTS */}
              {activeTab === 'effects' && (
                <div className="space-y-6">
                  {/* Glass & Surface Transparency */}
                  <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">Surface Glass & Transparency</span>
                        <span className="text-[10px] text-text-muted">Backdrop blur and translucent elevation</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-accent-primary">{Math.round(glassIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={glassIntensity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setGlassIntensity(val);
                        triggerPreview(tokens, isDark);
                      }}
                      className="w-full accent-accent-primary cursor-pointer"
                    />
                  </div>

                  {/* Shadow Intensity */}
                  <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">Shadow Depth & Elevation</span>
                        <span className="text-[10px] text-text-muted">Card and modal shadow prominence</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-accent-primary">{Math.round(shadowIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={shadowIntensity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setShadowIntensity(val);
                        triggerPreview(tokens, isDark);
                      }}
                      className="w-full accent-accent-primary cursor-pointer"
                    />
                  </div>

                  {/* Glow Intensity & Color */}
                  <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">Ambient Luminous Glow</span>
                        <span className="text-[10px] text-text-muted">Cybernetic, Tron, and luminous highlights</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-accent-primary">{Math.round(glowIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={glowIntensity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setGlowIntensity(val);
                        triggerPreview(tokens, isDark);
                      }}
                      className="w-full accent-accent-primary cursor-pointer"
                    />

                    {glowIntensity > 0 && (
                      <ColorPickerRow
                        label="Glow Tint Color"
                        description="Color of radiant borders and focus rings"
                        value={glowColor}
                        onChange={(val) => {
                          setGlowColor(val);
                          triggerPreview({ ...tokens, glowColor: val }, isDark);
                        }}
                      />
                    )}
                  </div>

                  {/* Animation Intensity */}
                  <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                      Motion & Animation Intensity
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'static', label: 'Static (0ms)' },
                        { id: 'minimal', label: 'Minimal (Fast)' },
                        { id: 'smooth', label: 'Smooth (Default)' },
                        { id: 'cinematic', label: 'Cinematic (Deep)' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setAnimationIntensity(m.id as any)}
                          className={clsx(
                            "py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center",
                            animationIntensity === m.id
                              ? "bg-text-primary text-background border-text-primary"
                              : "bg-surface border-border-subtle text-text-secondary hover:text-text-primary"
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Live Interface Preview Column */}
            <div className="lg:col-span-5 p-6 bg-background/40 flex flex-col justify-between overflow-y-auto space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-accent-primary" />
                    <span>Live Responsive Preview</span>
                  </h3>
                  <span className="text-[10px] font-mono text-accent-primary font-semibold uppercase">
                    {name}
                  </span>
                </div>

                {/* Mockup UI Window Shell */}
                <div 
                  className={clsx(
                    "border p-4 space-y-4 shadow-2xl transition-all duration-300 overflow-hidden",
                    `typo-${typography}`
                  )}
                  style={{
                    backgroundColor: tokens.background,
                    color: tokens.text,
                    borderColor: tokens.border,
                    borderRadius: radiusBase,
                    borderWidth: borderWidth,
                    boxShadow: shadowIntensity > 0 ? `0 20px 40px ${tokens.shadow || 'rgba(0,0,0,0.15)'}` : 'none',
                  }}
                >
                  {/* 1. Mock Navigation Bar */}
                  <div 
                    className="px-3.5 py-2 flex items-center justify-between transition-all"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.borderSubtle,
                      borderRadius: radiusBase,
                      borderWidth: borderWidth,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-semibold text-xs tracking-tight">iMuse</span>
                      <div className="h-3 w-px opacity-30" style={{ backgroundColor: tokens.borderStrong }} />
                      <span className="text-[10px] font-medium" style={{ color: tokens.accent }}>Feed</span>
                      <span className="text-[10px] opacity-60">Library</span>
                      <span className="text-[10px] opacity-60">Music</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div 
                        className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-all"
                        style={{
                          backgroundColor: tokens.accent,
                          color: tokens.accentContrast,
                          borderRadius: radiusBase,
                        }}
                      >
                        Action
                      </div>
                      <div 
                        className="w-5 h-5 rounded-full border flex items-center justify-center text-[9px]"
                        style={{
                          backgroundColor: tokens.backgroundElevated,
                          borderColor: tokens.borderSubtle,
                          color: tokens.textMuted,
                        }}
                      >
                        U
                      </div>
                    </div>
                  </div>

                  {/* 2. Mock Hero Typography Heading */}
                  <div className="px-1 py-1">
                    <span 
                      className="text-[9px] uppercase tracking-widest font-semibold block mb-1"
                      style={{ color: tokens.accent }}
                    >
                      Editorial Monograph No. 042
                    </span>
                    <h3 className="text-display text-xl md:text-2xl font-bold leading-tight line-clamp-2">
                      The Architecture of Visual Memory
                    </h3>
                    <p 
                      className="text-body text-[11px] leading-relaxed mt-1 line-clamp-2"
                      style={{ color: tokens.textMuted }}
                    >
                      A continuous inquiry into form, archival stillness, and the harmonic resonance of spaces.
                    </p>
                  </div>

                  {/* 3. Cultural Artifact Card Mockup */}
                  <div 
                    className="p-3 border flex gap-3 transition-all"
                    style={{
                      backgroundColor: tokens.backgroundElevated,
                      borderColor: tokens.border,
                      borderRadius: radiusBase,
                      borderWidth: borderWidth,
                      boxShadow: shadowIntensity > 0 ? `0 4px 12px ${tokens.shadow || 'rgba(0,0,0,0.08)'}` : 'none',
                    }}
                  >
                    <div 
                      className="w-16 h-20 shrink-0 border overflow-hidden flex items-center justify-center relative"
                      style={{
                        backgroundColor: tokens.artworkBg || tokens.surface,
                        borderColor: tokens.borderSubtle,
                        borderRadius: `calc(${radiusBase} * 0.75)`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                      <span className="font-serif text-lg font-light text-white/80">01</span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: tokens.accentSoft,
                              color: tokens.accent,
                            }}
                          >
                            Architecture
                          </span>
                          <span className="text-[9px]" style={{ color: tokens.textSubtle }}>1968</span>
                        </div>
                        <h4 className="font-semibold text-xs mt-1 truncate">Brutalist Monolith at Dusk</h4>
                        <span className="text-[10px] truncate block opacity-70" style={{ color: tokens.textMuted }}>Marcel Breuer • Concrete</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: tokens.borderSubtle }}>
                        <span className="text-[10px] font-medium" style={{ color: tokens.accent }}>View Artifact →</span>
                        <div className="flex gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tokens.accent }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tokens.surface }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Interactive Controls: Buttons & Inputs */}
                  <div className="space-y-2">
                    <div 
                      className="w-full px-3 py-1.5 border text-[11px] flex items-center justify-between"
                      style={{
                        backgroundColor: tokens.controlBg || tokens.surface,
                        borderColor: tokens.controlBorder || tokens.border,
                        borderRadius: radiusBase,
                        color: tokens.text,
                      }}
                    >
                      <span>Search cultural universe...</span>
                      <span className="opacity-40 font-mono text-[9px]">⌘K</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        className="flex-1 py-1.5 text-[11px] font-medium text-center shadow-xs transition-opacity hover:opacity-90"
                        style={{
                          backgroundColor: tokens.accent,
                          color: tokens.accentContrast,
                          borderRadius: radiusBase,
                        }}
                      >
                        Primary Action
                      </button>

                      <button 
                        className="flex-1 py-1.5 text-[11px] font-medium text-center border transition-opacity hover:opacity-90"
                        style={{
                          backgroundColor: tokens.surface,
                          borderColor: tokens.border,
                          color: tokens.text,
                          borderRadius: radiusBase,
                          borderWidth: borderWidth,
                        }}
                      >
                        Secondary Surface
                      </button>
                    </div>
                  </div>

                  {/* 5. Mini Dialog / Popover Mockup */}
                  <div 
                    className="p-3 border space-y-2"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.borderSubtle,
                      borderRadius: radiusBase,
                      borderWidth: borderWidth,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium">Curator Annotation</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.accent }} />
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: tokens.textMuted }}>
                      Preserving geometric proportion through deliberate tonal contrast.
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete Palette Swatch Ribbon */}
              <div className="bg-background-elevated/40 rounded-2xl p-3.5 border border-border-subtle space-y-2">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                  Theme Palette Swatch Ribbon
                </span>
                <div className="flex h-7 rounded-xl overflow-hidden border border-border-subtle shadow-xs">
                  <div className="flex-1" style={{ backgroundColor: tokens.background }} title="Background" />
                  <div className="flex-1" style={{ backgroundColor: tokens.surface }} title="Surface" />
                  <div className="flex-1" style={{ backgroundColor: tokens.backgroundElevated }} title="Elevated" />
                  <div className="flex-1" style={{ backgroundColor: tokens.accent }} title="Accent" />
                  <div className="flex-1" style={{ backgroundColor: tokens.text }} title="Text" />
                  <div className="flex-1" style={{ backgroundColor: tokens.textMuted }} title="Muted" />
                  <div className="flex-1" style={{ backgroundColor: tokens.border }} title="Border" />
                  <div className="flex-1" style={{ backgroundColor: tokens.accentContrast }} title="Contrast" />
                </div>
              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface/95 backdrop-blur-md shrink-0">
            <button
              onClick={handleResetToBase}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Base</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-5 py-2 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-full text-xs font-medium bg-accent-primary text-accent-contrast shadow-md hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Theme</span>
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Subcomponent: Color picker row with hex input and native color swatch
function ColorPickerRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [localHex, setLocalHex] = useState(value);

  useEffect(() => {
    setLocalHex(value);
  }, [value]);

  const getPickerHex = (val: string) => {
    if (val.startsWith('#') && (val.length === 7 || val.length === 4)) return val;
    if (val.startsWith('rgb')) {
      const parts = val.match(/\d+/g);
      if (parts && parts.length >= 3) {
        return rgbToHex(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
      }
    }
    return '#888888';
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalHex(raw);
    const normalized = normalizeColor(raw, '');
    if (normalized) {
      onChange(normalized);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-text-primary block truncate">{label}</span>
        {description && (
          <span className="text-[10px] text-text-muted block truncate">{description}</span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-border-strong cursor-pointer shadow-xs shrink-0 block">
          <input
            type="color"
            value={getPickerHex(value)}
            onChange={(e) => {
              setLocalHex(e.target.value);
              onChange(e.target.value);
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
          <div className="w-full h-full" style={{ backgroundColor: value }} />
        </label>

        <input
          type="text"
          value={localHex}
          onChange={handleTextChange}
          className="w-24 text-xs font-mono bg-background px-2 py-1 rounded-lg border border-border-subtle text-text-primary focus:outline-none focus:border-accent-primary"
          placeholder="#000000"
          maxLength={28}
        />
      </div>
    </div>
  );
}
