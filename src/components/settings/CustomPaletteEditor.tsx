import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, RotateCcw, Wand2, Image as ImageIcon, Sparkles, 
  Download, Upload, Sliders, ChevronDown, ChevronUp, AlertTriangle, 
  CheckCircle2, Copy, Edit2, Palette, ShieldCheck, Sun, Moon
} from 'lucide-react';
import { 
  ThemeTokens, CustomPalette, BUILTIN_THEMES, 
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
}

export function CustomPaletteEditor({
  isOpen,
  onClose,
  initialPalette,
  baseThemeId = 'default',
  onSave,
}: CustomPaletteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine initial tokens
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

  const [name, setName] = useState(initialPalette?.name || 'My Palette');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDark, setIsDark] = useState(getInitialIsDark());
  const [tokens, setTokens] = useState<ThemeTokens>(getInitialTokens());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExtractingImage, setIsExtractingImage] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync state whenever opened / initialPalette changes
  useEffect(() => {
    if (isOpen) {
      const initialTokens = getInitialTokens();
      const initialDark = getInitialIsDark();
      setTokens(initialTokens);
      setIsDark(initialDark);
      setName(initialPalette?.name || (BUILTIN_THEMES[baseThemeId] ? `${BUILTIN_THEMES[baseThemeId].name} Custom` : 'My Palette'));
      previewTheme(initialTokens, initialDark);
    }
  }, [isOpen, initialPalette, baseThemeId]);

  // Live preview on every token change
  const updateToken = (key: keyof ThemeTokens, value: string, autoDerive = false) => {
    const nextTokens = { ...tokens, [key]: value };
    
    if (autoDerive) {
      // If user changed accent, background, text or surface, re-derive secondary states
      if (key === 'accent' || key === 'background' || key === 'text' || key === 'surface') {
        const derived = deriveCompleteThemeTokens({
          background: key === 'background' ? value : tokens.background,
          surface: key === 'surface' ? value : tokens.surface,
          text: key === 'text' ? value : tokens.text,
          accent: key === 'accent' ? value : tokens.accent,
          isDark,
        });
        setTokens(derived);
        previewTheme(derived, isDark);
        return;
      }
    }

    setTokens(nextTokens);
    previewTheme(nextTokens, isDark);
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
    previewTheme(next, isDark);
    showNotification('Contrast optimized for readability');
  };

  const handleRandomize = () => {
    const randomTokens = generateTastefulPalette(isDark);
    setTokens(randomTokens);
    previewTheme(randomTokens, isDark);
    showNotification('Generated new harmonious palette');
  };

  const handleBalance = (harmony: 'complementary' | 'analogous' | 'monochrome' | 'triadic') => {
    const balanced = balancePalette(tokens.accent, harmony);
    const derived = deriveCompleteThemeTokens({
      background: tokens.background,
      text: tokens.text,
      accent: balanced.accent,
      isDark,
    });
    setTokens(derived);
    previewTheme(derived, isDark);
    showNotification(`Balanced with ${harmony} harmony`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtractingImage(true);
      const extracted = await extractPaletteFromImage(file);
      setTokens(extracted);
      setIsDark(true);
      previewTheme(extracted, true);
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
        previewTheme(imported.tokens, imported.isDark);
        showNotification(`Imported "${imported.name}" successfully`);
      } else {
        showNotification('Invalid or corrupted theme JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToBase = () => {
    const initialTokens = getInitialTokens();
    const initialDark = getInitialIsDark();
    setTokens(initialTokens);
    setIsDark(initialDark);
    previewTheme(initialTokens, initialDark);
    showNotification('Restored base theme colors');
  };

  const handleCancel = () => {
    revertThemePreview(initialPalette?.id || baseThemeId);
    onClose();
  };

  const handleSave = () => {
    onSave(
      {
        name: name.trim() || 'My Palette',
        baseThemeId,
        isDark,
        tokens,
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
          className="w-full max-w-5xl h-[92vh] md:h-[86vh] bg-surface border border-border-subtle rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-primary text-accent-contrast flex items-center justify-center">
                <Palette className="w-4 h-4" />
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
                    title="Click to rename"
                  >
                    <h2 className="text-base font-serif font-medium text-text-primary group-hover:text-accent-primary transition-colors">
                      {name}
                    </h2>
                    <Edit2 className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                  <span>Custom Color Palette</span>
                  <span>•</span>
                  <span className="uppercase">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors border border-border-subtle"
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

              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background-elevated transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification Toast */}
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

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-background/50 border-b border-border-subtle text-xs overflow-x-auto gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRandomize}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-elevated hover:bg-surface border border-border-subtle text-text-primary transition-all cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-accent-primary" />
                <span>Generate Palette</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-elevated hover:bg-surface border border-border-subtle text-text-primary transition-all cursor-pointer">
                <ImageIcon className="w-3.5 h-3.5 text-accent-primary" />
                <span>{isExtractingImage ? 'Analyzing...' : 'From Image'}</span>
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
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background-elevated hover:bg-surface border border-border-subtle text-text-primary transition-all cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                  <span>Balance</span>
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

            {/* Contrast Check & Auto-improve */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-text-muted">Text Contrast:</span>
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
              </div>

              {!textContrast.isGood && (
                <button
                  onClick={handleImproveContrast}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Improve Contrast</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Body (Grid: Left controls, Right preview) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
            
            {/* Left Controls Column */}
            <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto">
              
              {/* Core Essential Colors */}
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-3 flex items-center justify-between">
                  <span>Primary Atmosphere</span>
                  <span className="text-[10px] text-text-muted font-normal">Auto-derives hover & state variants</span>
                </h3>

                <div className="space-y-3 bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle">
                  <ColorPickerRow
                    label="Background"
                    description="Main background canvas"
                    value={tokens.background}
                    onChange={(val) => updateToken('background', val, true)}
                  />
                  <ColorPickerRow
                    label="Surface"
                    description="Cards, panels, and sidebars"
                    value={tokens.surface}
                    onChange={(val) => updateToken('surface', val)}
                  />
                  <ColorPickerRow
                    label="Elevated Surface"
                    description="Modals, dropdowns, and elevated cards"
                    value={tokens.backgroundElevated}
                    onChange={(val) => updateToken('backgroundElevated', val)}
                  />
                  <ColorPickerRow
                    label="Primary Text"
                    description="Main headings and body typography"
                    value={tokens.text}
                    onChange={(val) => updateToken('text', val, true)}
                  />
                  <ColorPickerRow
                    label="Muted Text"
                    description="Secondary metadata and captions"
                    value={tokens.textMuted}
                    onChange={(val) => updateToken('textMuted', val)}
                  />
                  <ColorPickerRow
                    label="Accent Color"
                    description="Primary buttons, focus, and highlight active elements"
                    value={tokens.accent}
                    onChange={(val) => updateToken('accent', val, true)}
                  />
                  <ColorPickerRow
                    label="Accent Contrast"
                    description="Text/icons drawn directly on top of accent color"
                    value={tokens.accentContrast}
                    onChange={(val) => updateToken('accentContrast', val)}
                  />
                  <ColorPickerRow
                    label="Border"
                    description="Card outlines and divider rules"
                    value={tokens.border}
                    onChange={(val) => updateToken('border', val)}
                  />
                </div>
              </div>

              {/* Advanced Tokens Toggle */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-background-elevated/30 hover:bg-background-elevated/60 border border-border-subtle rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent-primary" />
                    <span>Advanced Semantic Tokens (24+ Variables)</span>
                  </div>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showAdvanced && (
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
                        <ColorPickerRow label="Text Subtle" value={tokens.textSubtle} onChange={(v) => updateToken('textSubtle', v)} />
                        <ColorPickerRow label="Text Inverse" value={tokens.textInverse} onChange={(v) => updateToken('textInverse', v)} />
                      </div>

                      <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                        <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Borders & Accent States</h4>
                        <ColorPickerRow label="Border Subtle" value={tokens.borderSubtle} onChange={(v) => updateToken('borderSubtle', v)} />
                        <ColorPickerRow label="Border Strong" value={tokens.borderStrong} onChange={(v) => updateToken('borderStrong', v)} />
                        <ColorPickerRow label="Accent Hover" value={tokens.accentHover} onChange={(v) => updateToken('accentHover', v)} />
                        <ColorPickerRow label="Accent Active" value={tokens.accentActive} onChange={(v) => updateToken('accentActive', v)} />
                        <ColorPickerRow label="Accent Soft" value={tokens.accentSoft} onChange={(v) => updateToken('accentSoft', v)} />
                      </div>

                      <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-3">
                        <h4 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Interactive & Feedback</h4>
                        <ColorPickerRow label="Focus Ring" value={tokens.focus} onChange={(v) => updateToken('focus', v)} />
                        <ColorPickerRow label="Text Selection" value={tokens.selection} onChange={(v) => updateToken('selection', v)} />
                        <ColorPickerRow label="Success" value={tokens.success} onChange={(v) => updateToken('success', v)} />
                        <ColorPickerRow label="Warning" value={tokens.warning} onChange={(v) => updateToken('warning', v)} />
                        <ColorPickerRow label="Error" value={tokens.error} onChange={(v) => updateToken('error', v)} />
                        <ColorPickerRow label="Info" value={tokens.info} onChange={(v) => updateToken('info', v)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Right Live Preview Column */}
            <div className="lg:col-span-5 p-6 bg-background/30 flex flex-col justify-between overflow-y-auto space-y-6">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-3 flex items-center justify-between">
                  <span>Interactive Real-Time Preview</span>
                  <span className="text-[10px] text-accent-primary font-medium">Live Render</span>
                </h3>

                {/* Mockup UI Canvas */}
                <div 
                  className="rounded-2xl border p-5 space-y-4 shadow-xl overflow-hidden transition-all"
                  style={{
                    backgroundColor: tokens.background,
                    color: tokens.text,
                    borderColor: tokens.border,
                  }}
                >
                  {/* Mock Navbar */}
                  <div 
                    className="rounded-xl px-4 py-2.5 flex items-center justify-between border"
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.borderSubtle,
                    }}
                  >
                    <span className="font-serif font-medium text-sm tracking-tight">iMuse</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">Feed</span>
                      <span className="text-xs opacity-70">Music</span>
                      <div 
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: tokens.accent,
                          color: tokens.accentContrast,
                        }}
                      >
                        Action
                      </div>
                    </div>
                  </div>

                  {/* Mock Card */}
                  <div 
                    className="rounded-xl p-4 border space-y-3"
                    style={{
                      backgroundColor: tokens.backgroundElevated,
                      borderColor: tokens.border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: tokens.accentSoft,
                          color: tokens.accent,
                        }}
                      >
                        Archival Visual
                      </span>
                      <span className="text-xs opacity-60" style={{ color: tokens.textMuted }}>No. 084</span>
                    </div>

                    <h4 className="font-serif text-base font-semibold leading-tight">
                      Symphony of Form & Space
                    </h4>

                    <p className="text-xs leading-relaxed opacity-80" style={{ color: tokens.textMuted }}>
                      An exploratory study on structural elegance and harmonic atmosphere.
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t" style={{ borderColor: tokens.borderSubtle }}>
                      <span className="text-[11px] font-medium" style={{ color: tokens.accent }}>
                        Explore Details →
                      </span>
                      <div className="flex gap-1.5">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tokens.accent }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tokens.surface }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tokens.textMuted }} />
                      </div>
                    </div>
                  </div>

                  {/* Mock Input & Buttons */}
                  <div className="space-y-2">
                    <div 
                      className="w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between"
                      style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.borderStrong,
                        color: tokens.text,
                      }}
                    >
                      <span>Search cultural archives...</span>
                      <span className="opacity-40">⌘K</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-center shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                        style={{
                          backgroundColor: tokens.accent,
                          color: tokens.accentContrast,
                        }}
                      >
                        Primary Accent
                      </button>
                      <button 
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-center border transition-opacity hover:opacity-90 cursor-pointer"
                        style={{
                          backgroundColor: tokens.surface,
                          borderColor: tokens.border,
                          color: tokens.text,
                        }}
                      >
                        Secondary Surface
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Swatch Quick View */}
              <div className="bg-background-elevated/40 rounded-2xl p-4 border border-border-subtle space-y-2">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Palette Palette Swatch Bar</span>
                <div className="flex h-8 rounded-xl overflow-hidden border border-border-subtle">
                  <div className="flex-1" style={{ backgroundColor: tokens.background }} title="Background" />
                  <div className="flex-1" style={{ backgroundColor: tokens.surface }} title="Surface" />
                  <div className="flex-1" style={{ backgroundColor: tokens.backgroundElevated }} title="Elevated" />
                  <div className="flex-1" style={{ backgroundColor: tokens.accent }} title="Accent" />
                  <div className="flex-1" style={{ backgroundColor: tokens.text }} title="Text" />
                  <div className="flex-1" style={{ backgroundColor: tokens.textMuted }} title="Muted" />
                  <div className="flex-1" style={{ backgroundColor: tokens.border }} title="Border" />
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface/90 backdrop-blur-md">
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
                <span>Apply & Save Palette</span>
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Subcomponent: Color picker input row
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

  // Convert rgba / string to 6-digit hex for native color picker
  const getPickerHex = (val: string) => {
    if (val.startsWith('#')) return val.slice(0, 7);
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
        {/* Native color picker trigger */}
        <label className="relative w-8 h-8 rounded-lg overflow-hidden border border-border-strong cursor-pointer shadow-xs shrink-0 block">
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

        {/* HEX Input */}
        <input
          type="text"
          value={localHex}
          onChange={handleTextChange}
          className="w-24 text-xs font-mono bg-background px-2.5 py-1.5 rounded-lg border border-border-subtle text-text-primary focus:outline-none focus:border-accent-primary"
          placeholder="#000000"
          maxLength={28}
        />
      </div>
    </div>
  );
}
