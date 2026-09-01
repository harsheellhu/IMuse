import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Star, Plus, Edit2, Copy, Trash2, Sliders, Search, 
  Sparkles, Palette, Moon, Sun, Flame, Compass, Layers, Zap, Clock
} from 'lucide-react';
import { 
  BUILTIN_THEMES, ThemeDefinition, CustomPalette, MoodCategory 
} from '../../theme/tokens';
import { useSettingsStore } from '../../store/useSettingsStore';
import { CustomPaletteEditor } from './CustomPaletteEditor';
import clsx from 'clsx';

const MOOD_TABS: { id: MoodCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'ALL', label: 'All Palettes', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'DARK', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  { id: 'LIGHT', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'CINEMATIC', label: 'Cinematic', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'EARTH', label: 'Earth & Stone', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'COLORFUL', label: 'Colorful', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'ARCHIVAL', label: 'Archival', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'FUTURISTIC', label: 'Futuristic', icon: <Zap className="w-3.5 h-3.5" /> },
];

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

  const [activeCategory, setActiveCategory] = useState<MoodCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Filter built-in themes
  const filteredBuiltins = useMemo(() => {
    return builtinList.filter((theme) => {
      const matchesCategory = 
        activeCategory === 'ALL' || 
        theme.category === activeCategory ||
        (activeCategory === 'DARK' && theme.isDark) ||
        (activeCategory === 'LIGHT' && !theme.isDark);

      const matchesSearch = 
        !searchQuery.trim() || 
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.mood.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
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
    return recentPalettes.map((id) => {
      if (BUILTIN_THEMES[id]) return BUILTIN_THEMES[id];
      return customPalettes.find((p) => p.id === id);
    }).filter(Boolean) as (ThemeDefinition | CustomPalette)[];
  }, [recentPalettes, customPalettes]);

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
    if (confirm('Delete this custom palette?')) {
      deleteCustomPalette(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls: Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mood Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {MOOD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0",
                activeCategory === tab.id
                  ? "bg-text-primary text-background shadow-sm"
                  : "bg-surface/80 hover:bg-background-elevated text-text-secondary hover:text-text-primary border border-border-subtle"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search input & New Custom Palette button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search palettes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:border-text-primary w-40 md:w-52"
            />
          </div>

          <button
            onClick={handleOpenNewCustom}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-primary text-accent-contrast text-xs font-medium shadow-sm hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Palette</span>
          </button>
        </div>
      </div>

      {/* Pinned Favorites Row (if any exist) */}
      {favoritesList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Pinned Favorites</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

      {/* Custom Themes Section (if user has created any) */}
      {customPalettes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-accent-primary" />
              <span>Your Custom Palettes</span>
            </div>
            <span className="text-[11px] text-text-muted">{customPalettes.length} saved</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {customPalettes.map((custom) => (
              <PaletteCard
                key={custom.id}
                title={custom.name}
                mood={`Custom (${custom.isDark ? 'Dark' : 'Light'})`}
                tokens={custom.tokens}
                isDark={custom.isDark}
                isSelected={appearance === custom.id}
                isFavorited={favoritePalettes.includes(custom.id)}
                onSelect={() => setAppearance(custom.id)}
                onToggleFavorite={() => toggleFavoritePalette(custom.id)}
                onEdit={(e) => handleEditCustom(custom, e)}
                onDuplicate={(e) => handleDuplicate(custom.id, e)}
                onDelete={(e) => handleDeleteCustom(custom.id, e)}
                isCustom
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Built-in Palettes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5 text-text-muted" />
            <span>Built-in Curated Palettes</span>
          </div>
          <span className="text-[11px] text-text-muted">{filteredBuiltins.length} available</span>
        </div>

        {filteredBuiltins.length === 0 ? (
          <div className="p-8 text-center bg-surface/40 rounded-2xl border border-border-subtle text-text-muted text-xs">
            No palettes matching "{searchQuery}" in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBuiltins.map((theme) => (
              <PaletteCard
                key={theme.id}
                title={theme.name}
                mood={theme.mood}
                tokens={theme.tokens}
                isDark={theme.isDark}
                isSelected={appearance === theme.id}
                isFavorited={favoritePalettes.includes(theme.id)}
                onSelect={() => setAppearance(theme.id)}
                onToggleFavorite={() => toggleFavoritePalette(theme.id)}
                onCustomize={(e) => handleCustomizeBuiltin(theme, e)}
                onDuplicate={(e) => handleDuplicate(theme.id, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dedicated Custom Palette Editor Modal */}
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
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Full Palette Card with Mini UI Mockup & Swatches
// ----------------------------------------------------------------------------
interface PaletteCardProps {
  key?: React.Key;
  title: string;
  mood: string;
  tokens: any;
  isDark: boolean;
  isSelected: boolean;
  isFavorited: boolean;
  isCustom?: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onCustomize?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDuplicate?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

function PaletteCard({
  title,
  mood,
  tokens,
  isDark,
  isSelected,
  isFavorited,
  isCustom = false,
  onSelect,
  onToggleFavorite,
  onCustomize,
  onEdit,
  onDuplicate,
  onDelete,
}: PaletteCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={clsx(
        "relative rounded-2xl border p-4 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 shadow-sm group",
        isSelected
          ? "border-text-primary ring-2 ring-text-primary/20 shadow-md"
          : "border-border-subtle hover:border-text-secondary"
      )}
      style={{
        backgroundColor: 'var(--bg-elevated)',
      }}
    >
      {/* Mini Visual UI Mockup Box */}
      <div 
        className="w-full h-24 rounded-xl border p-2.5 mb-3 flex flex-col justify-between overflow-hidden shadow-inner relative transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          backgroundColor: tokens.background,
          color: tokens.text,
          borderColor: tokens.border || 'rgba(0,0,0,0.1)',
        }}
      >
        {/* Mock top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tokens.accent }} />
            <span className="text-[9px] font-serif font-medium tracking-tight opacity-90">{title}</span>
          </div>
          <div 
            className="px-1.5 py-0.5 rounded text-[8px] font-medium"
            style={{
              backgroundColor: tokens.accent,
              color: tokens.accentContrast,
            }}
          >
            Aa
          </div>
        </div>

        {/* Mock card inside */}
        <div 
          className="rounded-md p-1.5 border flex items-center justify-between"
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.borderSubtle || 'rgba(0,0,0,0.05)',
          }}
        >
          <span className="text-[8px] truncate opacity-70" style={{ color: tokens.textMuted }}>
            {mood}
          </span>
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tokens.accent }} />
        </div>

        {/* Swatch color bar */}
        <div className="flex h-1.5 rounded-full overflow-hidden w-full gap-0.5 opacity-90">
          <div className="flex-1" style={{ backgroundColor: tokens.background }} />
          <div className="flex-1" style={{ backgroundColor: tokens.surface }} />
          <div className="flex-1" style={{ backgroundColor: tokens.accent }} />
          <div className="flex-1" style={{ backgroundColor: tokens.text }} />
        </div>
      </div>

      {/* Metadata & Actions */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className={clsx(
            "text-sm font-serif font-semibold tracking-tight transition-colors truncate",
            isSelected ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
          )}>
            {title}
          </h4>

          {/* Selected checkmark */}
          {isSelected && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 rounded-full bg-text-primary text-background flex items-center justify-center shrink-0"
            >
              <Check className="w-2.5 h-2.5" />
            </motion.div>
          )}
        </div>

        <p className="text-[11px] text-text-muted line-clamp-1 mb-3">
          {mood}
        </p>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
          {/* Favorite toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={clsx(
              "p-1 rounded hover:bg-surface transition-colors cursor-pointer",
              isFavorited ? "text-amber-400" : "text-text-muted hover:text-text-primary"
            )}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={clsx("w-3.5 h-3.5", isFavorited && "fill-amber-400")} />
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isCustom ? (
              <>
                <button
                  onClick={onEdit}
                  className="px-2 py-1 rounded text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={onDuplicate}
                  className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  title="Duplicate palette"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete palette"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onCustomize}
                  className="px-2 py-1 rounded text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer flex items-center gap-1"
                  title="Create custom copy"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Customize</span>
                </button>
                <button
                  onClick={onDuplicate}
                  className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  title="Duplicate as Custom"
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
// Mini Theme Card for Pinned Favorites
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
        "p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all shadow-xs",
        isSelected 
          ? "border-text-primary bg-background-elevated" 
          : "border-border-subtle bg-surface/50 hover:border-text-secondary"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div 
          className="w-4 h-4 rounded-full border border-border-subtle shrink-0" 
          style={{ backgroundColor: item.tokens.accent }} 
        />
        <span className="text-xs font-medium text-text-primary truncate">{item.name}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="text-amber-400 p-0.5"
      >
        <Star className="w-3 h-3 fill-amber-400" />
      </button>
    </div>
  );
}
