import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Wand2, RotateCcw, Palette, Moon, FileText, Star, Hexagon, Cloud, Sun, Contrast, Sparkles, Sunset, Droplets, TreePine, CloudMoon, Zap, Cpu, Plus, Orbit, Layers, LayoutGrid, Film, Disc } from 'lucide-react';
import { useSettingsStore, AppearanceMode, LandingStyle, UniverseLayoutMode, MotionMode, AmbientMode, FeedDensity, ImageStyle, TypographyStyle, ShapeLanguage, BackgroundTexture, NavStyle, HomeLayout, TronIntensity } from '../../store/useSettingsStore';
import { SettingCarousel } from './SettingCarousel';
import { SettingCard } from './SettingCard';
import clsx from 'clsx';

import { DiscoveryPackCarousel } from './DiscoveryPackCarousel';

import { ThemePaletteCarousel } from './ThemePaletteCarousel';

import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

function getThemeIcon(mode: AppearanceMode) {
  switch (mode) {
    case 'default': return <Palette className="w-6 h-6 opacity-70" />;
    case 'obsidian': return <Moon className="w-6 h-6 opacity-70" />;
    case 'paper': return <FileText className="w-6 h-6 opacity-70" />;
    case 'midnight': return <Star className="w-6 h-6 opacity-70" />;
    case 'graphite': return <Hexagon className="w-6 h-6 opacity-70" />;
    case 'ash': return <Cloud className="w-6 h-6 opacity-70" />;
    case 'ivory': return <Sun className="w-6 h-6 opacity-70" />;
    case 'monochrome': return <Contrast className="w-6 h-6 opacity-70" />;
    case 'aurora': return <Sparkles className="w-6 h-6 opacity-70" />;
    case 'sunset': return <Sunset className="w-6 h-6 opacity-70" />;
    case 'ocean': return <Droplets className="w-6 h-6 opacity-70" />;
    case 'forest': return <TreePine className="w-6 h-6 opacity-70" />;
    case 'twilight': return <CloudMoon className="w-6 h-6 opacity-70" />;
    case 'electric': return <Zap className="w-6 h-6 opacity-70" />;
    case 'tron': return <Cpu className="w-6 h-6 opacity-70" />;
    default: return <Palette className="w-6 h-6 opacity-70" />;
  }
}

export function SettingsOverlay() {
  const settings = useSettingsStore();
  useBodyScrollLock(settings.isSettingsOpen);

  return (
    <AnimatePresence>
      {settings.isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-background overflow-y-auto"
        >
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border-subtle px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-text-primary" />
            <h1 className="text-xl font-serif tracking-tight text-text-primary">Experience Settings</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => settings.randomize()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface text-text-primary text-sm hover:bg-background-elevated border border-border-subtle transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden md:inline">Surprise Me</span>
            </button>
            <button 
              onClick={() => settings.resetToDefault()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary text-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>
            <button 
              onClick={() => settings.setSettingsOpen(false)}
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-primary hover:bg-text-primary hover:text-background transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="py-12 max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">
          
          {/* Theme & Palette System */}
          <div className="bg-surface/30 rounded-3xl p-6 md:p-8 space-y-6 border border-border-subtle">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-heading text-xl font-serif text-text-primary">Color Atmosphere & Palettes</h2>
                <p className="text-xs text-text-muted mt-0.5">Explore 28+ curated aesthetics or design your own custom color palette.</p>
              </div>
            </div>

            <ThemePaletteCarousel />
          </div>

          <SettingCarousel title="Your Presets" description="Save and load your favorite configurations.">
            <div className="relative flex-shrink-0 w-48 h-32 rounded-xl border border-border-subtle bg-surface flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-background-elevated transition-colors"
                 onClick={() => {
                   const name = prompt('Name your new preset:');
                   if (name) settings.savePreset(name);
                 }}>
              <Plus className="w-6 h-6 text-text-muted mb-2" />
              <span className="text-sm text-text-secondary font-medium">Save Current</span>
            </div>
            
            {Object.entries(settings.presets).map(([name, preset]) => (
              <div key={name} className="relative flex-shrink-0 w-48 h-32 rounded-xl border border-border-subtle overflow-hidden flex flex-col group cursor-pointer"
                   onClick={() => settings.applyPreset(name)}>
                <div className={`flex-1 flex flex-col justify-end relative p-4 typo-${preset.typography || 'neutral'}`}>
                  <span className="text-display text-text-primary z-10 leading-none">{name}</span>
                  <span className="text-meta text-text-muted z-10 mt-1">{preset.landingStyle}</span>
                  <div className={`absolute inset-0 opacity-10 theme-${preset.appearance} img-style-${preset.imageStyle} bg-accent-primary pointer-events-none`} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); settings.deletePreset(name); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-background-elevated/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                >
                  <X className="w-3 h-3 text-text-secondary hover:text-text-primary" />
                </button>
              </div>
            ))}
            
            {/* Built-in Slideshow Combo Presets */}
            {[
              { name: 'ART BOOK', preset: { landingStyle: 'slideshow', typography: 'art-book', slideshowConfig: { autoplay: 'slow', transition: 'fade' } } },
              { name: 'CINEMA', preset: { landingStyle: 'slideshow', typography: 'cinema', slideshowConfig: { autoplay: 'cinematic', transition: 'dissolve' } } },
              { name: 'LUXURY', preset: { landingStyle: 'slideshow', typography: 'luxury', slideshowConfig: { autoplay: 'slow', transition: 'crossfade' } } },
              { name: 'ARCHIVE', preset: { landingStyle: 'slideshow', typography: 'archive', motion: 'minimal', slideshowConfig: { autoplay: 'slow', transition: 'fade' } } },
              { name: 'PURE', preset: { landingStyle: 'slideshow', typography: 'minimal', slideshowConfig: { autoplay: 'off', transition: 'fade' } } },
            ].map(combo => (
              <div key={combo.name} className="relative flex-shrink-0 w-48 h-32 rounded-xl border border-border-subtle overflow-hidden flex flex-col group cursor-pointer bg-surface hover:bg-background-elevated transition-colors"
                   onClick={() => settings.setSettings(combo.preset as any)}>
                <div className={`flex-1 flex flex-col justify-end relative p-4 typo-${combo.preset.typography}`}>
                  <span className="text-display text-text-primary z-10 leading-none tracking-tight">{combo.name}</span>
                  <span className="text-meta text-text-muted z-10 mt-2">Built-in Preset</span>
                </div>
              </div>
            ))}
          </SettingCarousel>

          <SettingCarousel title="Landing Experience" description="How the main entry point is presented.">
            {(['minimal', 'editorial', 'observatory', 'archive', 'gallery', 'cosmic', 'tron', 'monolith', 'paper', 'terminal', 'slideshow'] as LandingStyle[]).map(style => (
              <SettingCard 
                key={style} id={style} title={style.charAt(0).toUpperCase() + style.slice(1)} 
                isSelected={settings.landingStyle === style}
                onClick={() => settings.setSettings({ landingStyle: style })}
                previewNode={<div className="text-meta text-text-muted">{style}</div>}
              />
            ))}
          </SettingCarousel>
          
          {/* Slideshow Settings (Expandable if slideshow is active) */}
          {settings.landingStyle === 'slideshow' && (
            <div className="bg-surface/50 rounded-2xl p-6 md:p-8 space-y-8 border border-border-subtle">
              <h3 className="text-heading text-xl text-text-primary mb-2">Slideshow Configuration</h3>
              
              <SettingCarousel title="Slideshow Mode" description="Content selection strategy.">
                {(['curated', 'shuffle'] as const).map(mode => (
                  <SettingCard 
                    key={mode} id={mode} title={mode.charAt(0).toUpperCase() + mode.slice(1)} 
                    isSelected={settings.slideshowConfig.mode === mode}
                    onClick={() => { settings.updateDiscoveryTask({} as any); settings.setSettings({ slideshowConfig: { ...settings.slideshowConfig, mode } }) }}
                    previewNode={<div className="text-meta text-text-muted">{mode}</div>}
                  />
                ))}
              </SettingCarousel>

              <SettingCarousel title="Autoplay Speed" description="How fast the slides advance automatically.">
                {(['off', 'slow', 'cinematic', 'fast'] as const).map(speed => (
                  <SettingCard 
                    key={speed} id={speed} title={speed.charAt(0).toUpperCase() + speed.slice(1)} 
                    isSelected={settings.slideshowConfig.autoplay === speed}
                    onClick={() => settings.setSettings({ slideshowConfig: { ...settings.slideshowConfig, autoplay: speed } })}
                    previewNode={<div className="text-meta text-text-muted">{speed}</div>}
                  />
                ))}
              </SettingCarousel>

              <SettingCarousel title="Transition Effect" description="How slides animate between each other.">
                {(['fade', 'crossfade', 'slide', 'depth', 'dissolve'] as const).map(trans => (
                  <SettingCard 
                    key={trans} id={trans} title={trans.charAt(0).toUpperCase() + trans.slice(1)} 
                    isSelected={settings.slideshowConfig.transition === trans}
                    onClick={() => settings.setSettings({ slideshowConfig: { ...settings.slideshowConfig, transition: trans } })}
                    previewNode={<div className="text-meta text-text-muted">{trans}</div>}
                  />
                ))}
              </SettingCarousel>
              
              <SettingCarousel title="Caption Position" description="Where metadata is displayed over the image.">
                {(['bottom-left', 'bottom-right', 'top-left'] as const).map(pos => (
                  <SettingCard 
                    key={pos} id={pos} title={pos.replace('-', ' ')} 
                    isSelected={settings.slideshowConfig.captionPosition === pos}
                    onClick={() => settings.setSettings({ slideshowConfig: { ...settings.slideshowConfig, captionPosition: pos } })}
                    previewNode={<div className="text-meta text-text-muted">{pos}</div>}
                  />
                ))}
              </SettingCarousel>
            </div>
          )}

          <SettingCarousel title="Universe Navigation" description="The spatial layout and interaction model for deep universe exploration.">
            {([
              { id: 'orbit', title: 'Orbit', icon: <Orbit className="w-5 h-5 opacity-80" />, desc: 'Planetary orbit' },
              { id: 'flow', title: 'Flow', icon: <Disc className="w-5 h-5 opacity-80" />, desc: 'Curved spatial path' },
              { id: 'stack', title: 'Stack', icon: <Layers className="w-5 h-5 opacity-80" />, desc: 'Layered 3D cards' },
              { id: 'gallery', title: 'Gallery', icon: <LayoutGrid className="w-5 h-5 opacity-80" />, desc: 'Dominant centerpiece' },
              { id: 'constellation', title: 'Constellation', icon: <Sparkles className="w-5 h-5 opacity-80" />, desc: 'Celestial galaxy graph' },
              { id: 'cinematic', title: 'Cinematic', icon: <Film className="w-5 h-5 opacity-80" />, desc: 'Deep camera perspective' },
              { id: 'auto', title: 'Auto (Smart)', icon: <Wand2 className="w-5 h-5 opacity-80" />, desc: 'Content-driven layout' },
            ] as const).map(item => (
              <SettingCard 
                key={item.id} 
                id={item.id} 
                title={item.title} 
                isSelected={settings.universeLayout === item.id}
                onClick={() => settings.setSettings({ universeLayout: item.id as UniverseLayoutMode })}
                previewNode={
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center gap-1.5 bg-surface/40">
                    {item.icon}
                    <span className="text-[10px] text-text-muted font-mono leading-tight">{item.desc}</span>
                  </div>
                }
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Home Layout" description="The structural arrangement of the feed.">
            {(['masonry', 'editorial', 'magazine', 'gallery', 'grid', 'staggered', 'minimal'] as HomeLayout[]).map(layout => (
              <SettingCard 
                key={layout} id={layout} title={layout.charAt(0).toUpperCase() + layout.slice(1)} 
                isSelected={settings.homeLayout === layout}
                onClick={() => settings.setSettings({ homeLayout: layout })}
                previewNode={<div className="text-text-muted font-serif text-xs">{layout}</div>}
              />
            ))}
          </SettingCarousel>

          {settings.appearance === 'tron' && (
            <SettingCarousel title="TRON Intensity" description="Adjust the neon glow and grid intensity.">
              {(['subtle', 'balanced', 'neon', 'extreme'] as TronIntensity[]).map(intensity => (
                <SettingCard 
                  key={intensity} id={intensity} title={intensity.charAt(0).toUpperCase() + intensity.slice(1)} 
                  isSelected={settings.tronIntensity === intensity}
                  onClick={() => settings.setSettings({ tronIntensity: intensity })}
                  previewNode={<div className={`w-8 h-8 rounded-full theme-tron tron-intensity-${intensity} glow-element`} />}
                />
              ))}
            </SettingCarousel>
          )}

          <SettingCarousel title="Feed Density" description="Spacing and sizing of grid content.">
            {(['spacious', 'relaxed', 'balanced', 'dense', 'compact'] as FeedDensity[]).map(density => (
              <SettingCard 
                key={density} id={density} title={density.charAt(0).toUpperCase() + density.slice(1)} 
                isSelected={settings.feedDensity === density}
                onClick={() => settings.setSettings({ feedDensity: density })}
                previewNode={
                  <div className={`grid grid-cols-2 gap-${density === 'compact' ? '1' : density === 'spacious' ? '6' : '3'} w-full h-full p-4`}>
                    <div className="bg-text-muted/20 rounded" /><div className="bg-text-muted/20 rounded" />
                    <div className="bg-text-muted/20 rounded" /><div className="bg-text-muted/20 rounded" />
                  </div>
                }
              />
            ))}
          </SettingCarousel>
          
          <SettingCarousel title="Image Style" description="Global photographic treatments.">
            {(['original', 'soft', 'editorial', 'cinematic', 'high-contrast', 'monochrome', 'warm', 'cool', 'grain', 'none'] as ImageStyle[]).map(style => (
              <SettingCard 
                key={style} id={style} title={style.charAt(0).toUpperCase() + style.slice(1)} 
                isSelected={settings.imageStyle === style}
                onClick={() => settings.setSettings({ imageStyle: style })}
                previewNode={<div className={`w-16 h-16 bg-text-muted rounded-full img-style-${style}`} />}
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Typography" description="The font system used throughout the app.">
            {(['neutral', 'editorial', 'modern', 'neo-grotesk', 'humanist', 'classical', 'literary', 'newspaper', 'fashion', 'art-book', 'brutalist', 'technical', 'mono', 'futuristic', 'cinema', 'archive', 'contemporary', 'minimal', 'luxury'] as TypographyStyle[]).map(typo => (
              <SettingCard 
                key={typo} id={typo} title={typo.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                isSelected={settings.typography === typo}
                onClick={() => settings.setSettings({ typography: typo })}
                previewNode={
                  <div className={`w-full h-full flex flex-col justify-center items-center p-2 text-center bg-background typo-${typo} overflow-hidden pointer-events-none`}>
                    <span className="text-display leading-none" style={{ fontSize: '2.5rem' }}>Aa</span>
                    <span className="text-meta text-text-muted mt-2 opacity-70">No. 024</span>
                  </div>
                }
              />
            ))}
          </SettingCarousel>
          
          <SettingCarousel title="Shape Language" description="The curvature of elements.">
            {(['sharp', 'subtle', 'rounded', 'soft', 'editorial'] as ShapeLanguage[]).map(shape => (
              <SettingCard 
                key={shape} id={shape} title={shape.charAt(0).toUpperCase() + shape.slice(1)} 
                isSelected={settings.shapeLanguage === shape}
                onClick={() => settings.setSettings({ shapeLanguage: shape })}
                previewNode={<div className={`w-12 h-12 bg-text-muted shape-${shape} border border-border-subtle`} style={{ borderRadius: 'var(--radius-base)' }} />}
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Background Texture" description="Subtle overlays for depth.">
            {(['none', 'fine-grain', 'paper', 'dust', 'grid', 'technical-grid', 'noise', 'fabric', 'film-grain'] as BackgroundTexture[]).map(tex => (
              <SettingCard 
                key={tex} id={tex} title={tex.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                isSelected={settings.texture === tex}
                onClick={() => settings.setSettings({ texture: tex })}
                previewNode={<div className={`w-full h-full texture-${tex} opacity-50`} />}
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Motion" description="Animation speeds and transitions.">
            {(['static', 'minimal', 'smooth', 'cinematic', 'fluid', 'experimental', 'reduced'] as MotionMode[]).map(motion => (
              <SettingCard 
                key={motion} id={motion} title={motion.charAt(0).toUpperCase() + motion.slice(1)} 
                isSelected={settings.motion === motion}
                onClick={() => settings.setSettings({ motion })}
                previewNode={<div className="w-6 h-6 rounded-full bg-text-primary animate-pulse" />}
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Navigation Style" description="Header and menu presentation.">
            {(['minimal', 'floating', 'integrated', 'editorial', 'cinematic', 'tron'] as NavStyle[]).map(nav => (
              <SettingCard 
                key={nav} id={nav} title={nav.charAt(0).toUpperCase() + nav.slice(1)} 
                isSelected={settings.navStyle === nav}
                onClick={() => settings.setSettings({ navStyle: nav })}
                previewNode={<div className="text-text-muted font-serif text-xs">{nav}</div>}
              />
            ))}
          </SettingCarousel>
          
          <SettingCarousel title="Ambient Mode" description="Atmospheric image-derived coloration.">
            {(['off', 'soft', 'balanced', 'cinematic', 'deep', 'full'] as AmbientMode[]).map(amb => (
              <SettingCard 
                key={amb} id={amb} title={amb.charAt(0).toUpperCase() + amb.slice(1)} 
                isSelected={settings.ambientMode === amb}
                onClick={() => settings.setSettings({ ambientMode: amb })}
                previewNode={<div className="w-full h-full bg-gradient-to-tr from-accent-primary/20 to-transparent" />}
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Interface Sounds" description="Subtle UI audio feedback.">
            {(['off', 'subtle', 'balanced'] as any[]).map(snd => (
              <SettingCard 
                key={snd} id={snd} title={snd.charAt(0).toUpperCase() + snd.slice(1)} 
                isSelected={settings.interfaceSounds === snd}
                onClick={() => settings.setSettings({ interfaceSounds: snd })}
                previewNode={<div className="w-full h-full bg-gradient-to-tr from-text-muted/10 to-transparent" />}
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Authentication" description="Your connected sign-in method.">
             <div className="relative flex-shrink-0 w-64 h-32 rounded-xl border border-border-subtle bg-surface flex flex-col items-center justify-center p-4">
                <span className="text-sm text-text-primary font-medium">Google Account</span>
                <span className="text-xs text-text-muted mt-1">Available for sign-in</span>
             </div>
             <div className="relative flex-shrink-0 w-64 h-32 rounded-xl border border-border-subtle bg-surface flex flex-col items-center justify-center p-4">
                <span className="text-sm text-text-primary font-medium">Email Account</span>
                <span className="text-xs text-text-muted mt-1">Available for sign-in</span>
             </div>
          </SettingCarousel>

          <DiscoveryPackCarousel />

        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

