import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Star, Plus, Edit2, Copy, Trash2, Sliders, Search, 
  Sparkles, Palette, Moon, Sun, Flame, Compass, Layers, Zap, Clock,
  Eye, CheckCircle2, Bookmark, ShieldCheck, X
} from 'lucide-react';
import { 
  BUILTIN_THEMES, ThemeDefinition, CustomPalette, MoodCategory 
} from '../../theme/tokens';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CustomPaletteEditor } from './CustomPaletteEditor';
import { previewTheme, revertThemePreview } from '../../theme/applyTheme';
import clsx from 'clsx';

type FilterCategory = 
  | 'ALL' 
  | 'EDITORIAL' 
  | 'ANALOG' 
  | 'NATURAL' 
  | 'DIGITAL' 
  | 'CLASSIC'
  | 'DARK' 
  | 'LIGHT' 
  | 'FAVORITES' 
  | 'CUSTOM';

const CATEGORY_TABS: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'ALL', label: 'All Themes', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'EDITORIAL', label: 'Editorial & Artistic', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'ANALOG', label: 'Analog & Nostalgic', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'NATURAL', label: 'Natural & Atmospheric', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'DIGITAL', label: 'Digital & Experimental', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'CLASSIC', label: 'Classic & Curated', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'DARK', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  { id: 'LIGHT', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'FAVORITES', label: 'Pinned Favorites', icon: <Star className="w-3.5 h-3.5" /> },
  { id: 'CUSTOM', label: 'Your Custom', icon: <Sliders className="w-3.5 h-3.5" /> },
];

const SECTION_DESCRIPTIONS: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
  EDITORIAL: {
    title: 'Editorial and Artistic',
    subtitle: 'Precise typography, exhibition monographs, architectural layouts, and bold print heritage.',
    icon: <Layers className="w-4 h-4 text-accent-primary" />
  },
  ANALOG: {
    title: 'Analog and Nostalgic',
    subtitle: 'Aged paper, darkroom silver, walnut library parchment, and period-inspired digital memories.',
    icon: <Compass className="w-4 h-4 text-accent-primary" />
  },
  NATURAL: {
    title: 'Natural and Atmospheric',
    subtitle: 'Sage, moss, clay terracotta, cold slate alpine peaks, and twilight plumage.',
    icon: <Flame className="w-4 h-4 text-accent-primary" />
  },
  DIGITAL: {
    title: 'Digital and Experimental',
    subtitle: 'Monospace terminals, cybernetic graphite, iridescent prismatic films, and liquid chrome.',
    icon: <Zap className="w-4 h-4 text-accent-primary" />
  },
  CLASSIC: {
    title: 'Classic & Additional Curated Palettes',
    subtitle: 'Essential minimal foundations, deep obsidian, clean paper, and vibrant tonal moods.',
    icon: <Sparkles className="w-4 h-4 text-accent-primary" />
  },
};

export function ThemePaletteCarousel() {
  const {
    appearance,
    customPalettes,
    favoritePalettes,
    recentPalettes,
    setAppearance,
    createCustomPalette,
    updateCustomPalette,
    deleteCustomPalette,
    duplicatePalette,
    toggleFavoritePalette,
  } = useSettingsStore();

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingThemeId, setPreviewingThemeId] = useState<string | null>(null);
  
  // Custom Editor state
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    initialPalette?: CustomPalette | null;
    baseThemeId?: string;
  }>({
    isOpen: false,
    initialPalette: null,
    baseThemeId: 'default',
  });

  const builtinList = useMemo(() => Object.values(BUILTIN_THEMES), []);

  // Filter built-in themes based on active category and search
  const filteredBuiltins = useMemo(() => {
    return builtinList.filter((theme) => {
      let matchesCategory = true;

      if (activeCategory === 'EDITORIAL') matchesCategory = theme.category === 'EDITORIAL';
      else if (activeCategory === 'ANALOG') matchesCategory = theme.category === 'ANALOG';
      else if (activeCategory === 'NATURAL') matchesCategory = theme.category === 'NATURAL';
      else if (activeCategory === 'DIGITAL') matchesCategory = theme.category === 'DIGITAL';
      else if (activeCategory === 'CLASSIC') {
        matchesCategory = ['LIGHT', 'DARK', 'EARTH', 'CINEMATIC', 'COLORFUL', 'ARCHIVAL', 'FUTURISTIC'].includes(theme.category);
      } else if (activeCategory === 'DARK') matchesCategory = theme.isDark;
      else if (activeCategory === 'LIGHT') matchesCategory = !theme.isDark;
      else if (activeCategory === 'FAVORITES') matchesCategory = favoritePalettes.includes(theme.id);
      else if (activeCategory === 'CUSTOM') matchesCategory = false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q || 
        theme.name.toLowerCase().includes(q) ||
        theme.mood.toLowerCase().includes(q) ||
        theme.id.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [builtinList, activeCategory, searchQuery, favoritePalettes]);

  // Grouped themes for "ALL" tab view
  const groupedThemes = useMemo(() => {
    if (activeCategory !== 'ALL' || searchQuery.trim()) return null;

    const editorial = builtinList.filter(t => t.category === 'EDITORIAL');
    const analog = builtinList.filter(t => t.category === 'ANALOG');
    const natural = builtinList.filter(t => t.category === 'NATURAL');
    const digital = builtinList.filter(t => t.category === 'DIGITAL' || t.id === 'tron');
    const classic = builtinList.filter(t => 
      !['EDITORIAL', 'ANALOG', 'NATURAL', 'DIGITAL'].includes(t.category) && t.id !== 'tron'
    );

    return [
      { key: 'EDITORIAL', list: editorial },
      { key: 'ANALOG', list: analog },
      { key: 'NATURAL', list: natural },
      { key: 'DIGITAL', list: digital },
      { key: 'CLASSIC', list: classic },
    ];
  }, [builtinList, activeCategory, searchQuery]);

  // Favorited themes
  const favoritesList = useMemo(() => {
    return favoritePalettes.map((id) => {
      if (BUILTIN_THEMES[id]) return BUILTIN_THEMES[id];
      return customPalettes.find((p) => p.id === id);
    }).filter(Boolean) as (ThemeDefinition | CustomPalette)[];
  }, [favoritePalettes, customPalettes]);

  // Recent themes
  const recentsList = useMemo(() => {
    return recentPalettes
      .filter((id) => id !== appearance)
      .slice(0, 6)
      .map((id) => {
        if (BUILTIN_THEMES[id]) return BUILTIN_THEMES[id];
        return customPalettes.find((p) => p.id === id);
      }).filter(Boolean) as (ThemeDefinition | CustomPalette)[];
  }, [recentPalettes, customPalettes, appearance]);

  const handleOpenNewCustom = () => {
    setEditorState({
      isOpen: true,
      initialPalette: null,
      baseThemeId: appearance.startsWith('custom-') ? 'default' : appearance,
    });
  };

  const handleCustomizeBuiltin = (theme: ThemeDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorState({
      isOpen: true,
      initialPalette: null,
      baseThemeId: theme.id,
    });
  };

  const handleEditCustom = (custom: CustomPalette, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorState({
      isOpen: true,
      initialPalette: custom,
      baseThemeId: custom.baseThemeId || 'default',
    });
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicatePalette(id);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this custom theme?')) {
      deleteCustomPalette(id);
    }
  };

  // Full-Interface Live Preview handlers
  const handleLivePreview = (themeDef: ThemeDefinition | CustomPalette, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewingThemeId(themeDef.id);
    previewTheme(themeDef.tokens, themeDef.isDark, {
      themeId: themeDef.id,
      radiusBase: themeDef.tokens.radiusBase,
      borderWidth: themeDef.tokens.borderWidth,
      glowColor: themeDef.tokens.glowColor,
      glowIntensity: themeDef.tokens.glowIntensity,
    });
  };

  const handleApplyPreview = () => {
    if (previewingThemeId) {
      setAppearance(previewingThemeId);
      setPreviewingThemeId(null);
    }
  };

  const handleExitPreview = () => {
    revertThemePreview(appearance, customPalettes);
    setPreviewingThemeId(null);
  };

  return (
    <div className="space-y-8">
      
      {/* Live Preview Persistent Banner */}
      <AnimatePresence>
        {previewingThemeId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-16 z-40 bg-accent-primary text-accent-contrast px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-border-subtle"
          >
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-medium">
                Live Previewing: <strong className="font-semibold underline ml-1">{BUILTIN_THEMES[previewingThemeId]?.name || customPalettes.find(p => p.id === previewingThemeId)?.name || previewingThemeId}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExitPreview}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
              >
                Revert & Exit
              </button>
              <button
                onClick={handleApplyPreview}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-background text-text-primary shadow-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply as Active Theme</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Filter Controls & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-hide">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0",
                activeCategory === tab.id
                  ? "bg-text-primary text-background shadow-sm font-semibold"
                  : "bg-surface/80 hover:bg-background-elevated text-text-secondary hover:text-text-primary border border-border-subtle"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search input & New Custom Theme Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 50+ themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:border-text-primary w-44 md:w-56"
            />
          </div>

          <button
            onClick={handleOpenNewCustom}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-primary text-accent-contrast text-xs font-medium shadow-sm hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom</span>
          </button>
        </div>
      </div>

      {/* Pinned Favorites Row */}
      {favoritesList.length > 0 && (activeCategory === 'ALL' || activeCategory === 'FAVORITES') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Pinned Favorites ({favoritesList.length})</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {favoritesList.map((item) => (
              <MiniThemeCard
                key={`fav-${item.id}`}
                item={item}
                isSelected={appearance === item.id}
                isFavorited={favoritePalettes.includes(item.id)}
                onSelect={() => setAppearance(item.id)}
                onToggleFavorite={() => toggleFavoritePalette(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Used Themes Row */}
      {recentsList.length > 0 && activeCategory === 'ALL' && !searchQuery.trim() && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span>Recently Selected</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {recentsList.map((item) => (
              <MiniThemeCard
                key={`recent-${item.id}`}
                item={item}
                isSelected={appearance === item.id}
                isFavorited={favoritePalettes.includes(item.id)}
                onSelect={() => setAppearance(item.id)}
                onToggleFavorite={() => toggleFavoritePalette(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Themes Section */}
      {(activeCategory === 'ALL' || activeCategory === 'CUSTOM') && customPalettes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-accent-primary" />
              <span>Your Custom Themes</span>
            </div>
            <span className="text-[11px] text-text-muted">{customPalettes.length} saved</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customPalettes.map((custom) => (
              <PaletteCard
                key={custom.id}
                theme={custom}
                title={custom.name}
                mood={`Custom (${custom.isDark ? 'Dark Surface' : 'Light Surface'})`}
                tokens={custom.tokens}
                isDark={custom.isDark}
                isSelected={appearance === custom.id}
                isFavorited={favoritePalettes.includes(custom.id)}
                onSelect={() => setAppearance(custom.id)}
                onToggleFavorite={() => toggleFavoritePalette(custom.id)}
                onLivePreview={(e) => handleLivePreview(custom, e)}
                onEdit={(e) => handleEditCustom(custom, e)}
                onDuplicate={(e) => handleDuplicate(custom.id, e)}
                onDelete={(e) => handleDeleteCustom(custom.id, e)}
                isCustom
              />
            ))}
          </div>
        </div>
      )}

      {/* Grouped Visual Directions (when viewing "ALL" without active search) */}
      {groupedThemes ? (
        <div className="space-y-10">
          {groupedThemes.map((group) => {
            const desc = SECTION_DESCRIPTIONS[group.key] || { title: group.key, subtitle: '', icon: null };
            return (
              <div key={group.key} className="space-y-4">
                <div className="border-b border-border-subtle/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    {desc.icon}
                    <h3 className="text-sm font-serif font-bold text-text-primary tracking-tight">
                      {desc.title}
                    </h3>
                    <span className="text-[11px] text-text-muted">({group.list.length})</span>
                  </div>
                  {desc.subtitle && (
                    <p className="text-xs text-text-muted mt-0.5">{desc.subtitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.list.map((theme) => (
                    <PaletteCard
                      key={theme.id}
                      theme={theme}
                      title={theme.name}
                      mood={theme.mood}
                      tokens={theme.tokens}
                      isDark={theme.isDark}
                      isSelected={appearance === theme.id}
                      isFavorited={favoritePalettes.includes(theme.id)}
                      onSelect={() => setAppearance(theme.id)}
                      onToggleFavorite={() => toggleFavoritePalette(theme.id)}
                      onLivePreview={(e) => handleLivePreview(theme, e)}
                      onCustomize={(e) => handleCustomizeBuiltin(theme, e)}
                      onDuplicate={(e) => handleDuplicate(theme.id, e)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Filtered List (when category tab or search is active) */
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle/80 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <Palette className="w-4 h-4 text-text-muted" />
              <span>Matching Themes</span>
            </div>
            <span className="text-[11px] text-text-muted">{filteredBuiltins.length} available</span>
          </div>

          {filteredBuiltins.length === 0 ? (
            <div className="p-12 text-center bg-surface/40 rounded-2xl border border-border-subtle text-text-muted text-xs space-y-2">
              <p>No themes matching "{searchQuery}" in this category.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                className="px-4 py-1.5 rounded-full bg-surface text-text-primary border border-border-subtle text-xs hover:bg-background-elevated transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBuiltins.map((theme) => (
                <PaletteCard
                  key={theme.id}
                  theme={theme}
                  title={theme.name}
                  mood={theme.mood}
                  tokens={theme.tokens}
                  isDark={theme.isDark}
                  isSelected={appearance === theme.id}
                  isFavorited={favoritePalettes.includes(theme.id)}
                  onSelect={() => setAppearance(theme.id)}
                  onToggleFavorite={() => toggleFavoritePalette(theme.id)}
                  onLivePreview={(e) => handleLivePreview(theme, e)}
                  onCustomize={(e) => handleCustomizeBuiltin(theme, e)}
                  onDuplicate={(e) => handleDuplicate(theme.id, e)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dedicated Custom Theme Editor Modal */}
      <CustomPaletteEditor
        isOpen={editorState.isOpen}
        initialPalette={editorState.initialPalette}
        baseThemeId={editorState.baseThemeId}
        onClose={() => setEditorState({ isOpen: false, initialPalette: null, baseThemeId: 'default' })}
        onSave={(paletteData, idToUpdate) => {
          if (idToUpdate) {
            updateCustomPalette(idToUpdate, paletteData);
          } else {
            createCustomPalette(paletteData);
          }
        }}
        onDuplicate={(id) => duplicatePalette(id)}
        onDelete={(id) => deleteCustomPalette(id)}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Full Theme Card with Accurate Live Swatches & Typography Specimen
// ----------------------------------------------------------------------------
interface PaletteCardProps {
  key?: React.Key;
  theme: ThemeDefinition | CustomPalette;
  title: string;
  mood: string;
  tokens: any;
  isDark: boolean;
  isSelected: boolean;
  isFavorited: boolean;
  isCustom?: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onLivePreview: (e: React.MouseEvent) => void;
  onCustomize?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

function PaletteCard({
  theme,
  title,
  mood,
  tokens,
  isDark,
  isSelected,
  isFavorited,
  isCustom = false,
  onSelect,
  onToggleFavorite,
  onLivePreview,
  onCustomize,
  onEdit,
  onDuplicate,
  onDelete,
}: PaletteCardProps) {
  const typoClass = (theme as ThemeDefinition).defaultTypography 
    ? `typo-${(theme as ThemeDefinition).defaultTypography}` 
    : ((theme as CustomPalette).typography ? `typo-${(theme as CustomPalette).typography}` : 'typo-neutral');

  const shapeDesc = (theme as ThemeDefinition).defaultShape 
    ? (theme as ThemeDefinition).defaultShape 
    : ((theme as CustomPalette).shapeLanguage || 'rounded');

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={clsx(
        "relative rounded-2xl border p-4 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 shadow-sm group",
        isSelected
          ? "border-text-primary ring-2 ring-text-primary/25 shadow-md bg-surface/90"
          : "border-border-subtle hover:border-text-secondary bg-surface/40 hover:bg-surface/70"
      )}
    >
      {/* Visual Mockup Box */}
      <div 
        className={clsx(
          "w-full h-28 rounded-xl border p-2.5 mb-3 flex flex-col justify-between overflow-hidden shadow-inner relative transition-transform duration-300 group-hover:scale-[1.01]",
          typoClass
        )}
        style={{
          backgroundColor: tokens.background,
          color: tokens.text,
          borderColor: tokens.border || 'rgba(0,0,0,0.1)',
          borderRadius: tokens.radiusBase || '8px',
        }}
      >
        {/* Mock top bar with active indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tokens.accent }} />
            <span className="text-[10px] font-medium tracking-tight truncate opacity-90">{title}</span>
          </div>

          <div 
            className="px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: tokens.accent,
              color: tokens.accentContrast,
            }}
          >
            Aa
          </div>
        </div>

        {/* Typography Specimen block */}
        <div 
          className="p-1.5 border flex items-center justify-between transition-all"
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.borderSubtle,
            borderRadius: `calc(${tokens.radiusBase || '8px'} * 0.75)`,
          }}
        >
          <div className="min-w-0 flex-1 pr-1">
            <span className="text-display block text-xs font-semibold leading-tight truncate">
              {title}
            </span>
            <span className="text-[8px] truncate block opacity-60" style={{ color: tokens.textMuted }}>
              {mood}
            </span>
          </div>
          <div className="w-3 h-3 rounded-full shrink-0 opacity-80" style={{ backgroundColor: tokens.accent }} />
        </div>

        {/* Multi-tone Color Swatch Ribbon */}
        <div className="flex h-1.5 rounded-full overflow-hidden w-full gap-0.5 opacity-90 shadow-2xs">
          <div className="flex-1" style={{ backgroundColor: tokens.background }} title="Background" />
          <div className="flex-1" style={{ backgroundColor: tokens.surface }} title="Surface" />
          <div className="flex-1" style={{ backgroundColor: tokens.backgroundElevated || tokens.surface }} title="Elevated" />
          <div className="flex-1" style={{ backgroundColor: tokens.accent }} title="Accent" />
          <div className="flex-1" style={{ backgroundColor: tokens.text }} title="Text" />
          <div className="flex-1" style={{ backgroundColor: tokens.textMuted }} title="Muted" />
        </div>
      </div>

      {/* Metadata & Actions */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className={clsx(
            "text-sm font-semibold tracking-tight transition-colors truncate",
            isSelected ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
          )}>
            {title}
          </h4>

          {/* Active selection badge */}
          {isSelected && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-text-primary text-background text-[10px] font-semibold shrink-0"
            >
              <Check className="w-2.5 h-2.5" />
              <span>Active</span>
            </motion.div>
          )}
        </div>

        <p className="text-[11px] text-text-muted line-clamp-1 mb-2">
          {mood}
        </p>

        {/* Visual Language Tag Pill */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-muted uppercase tracking-wider mb-3">
          <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle">{isDark ? 'Dark' : 'Light'}</span>
          <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle capitalize">{shapeDesc}</span>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border-subtle text-xs">
          {/* Favorite & Live Preview */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={clsx(
                "p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer",
                isFavorited ? "text-amber-400" : "text-text-muted hover:text-text-primary"
              )}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={clsx("w-3.5 h-3.5", isFavorited && "fill-amber-400")} />
            </button>

            <button
              onClick={onLivePreview}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
              title="Full-interface live preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Context actions */}
          <div className="flex items-center gap-1">
            {isCustom ? (
              <>
                <button
                  onClick={onEdit}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 border border-border-subtle"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={onDuplicate}
                  className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  title="Duplicate theme"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete theme"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onCustomize}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 border border-border-subtle"
                  title="Customize this theme"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Customize</span>
                </button>
                <button
                  onClick={onDuplicate}
                  className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  title="Duplicate as Custom Theme"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// Mini Theme Card for Pinned Favorites and Recents
// ----------------------------------------------------------------------------
function MiniThemeCard({
  item,
  isSelected,
  isFavorited,
  onSelect,
  onToggleFavorite,
}: {
  key?: React.Key;
  item: ThemeDefinition | CustomPalette;
  isSelected: boolean;
  isFavorited: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-xs gap-1.5 group",
        isSelected 
          ? "border-text-primary bg-background-elevated ring-1 ring-text-primary/20" 
          : "border-border-subtle bg-surface/50 hover:border-text-secondary hover:bg-background-elevated"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div 
          className="w-3.5 h-3.5 rounded-full border border-border-subtle shrink-0" 
          style={{ backgroundColor: item.tokens.accent }} 
        />
        <span className="text-xs font-medium text-text-primary truncate">{item.name}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="text-amber-400 p-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
      >
        <Star className={clsx("w-3 h-3", isFavorited && "fill-amber-400")} />
      </button>
    </div>
  );
}
