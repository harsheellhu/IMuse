import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Wand2, RotateCcw, Palette, Moon, FileText, Star, Hexagon, Cloud, Sun, Contrast, Sparkles, Sunset, Droplets, TreePine, CloudMoon, Zap, Cpu, Plus } from 'lucide-react';
import { useSettingsStore, AppearanceMode, LandingStyle, MotionMode, AmbientMode, FeedDensity, ImageStyle, TypographyStyle, ShapeLanguage, BackgroundTexture, NavStyle, HomeLayout, TronIntensity } from '../../store/useSettingsStore';
import { SettingCarousel } from './SettingCarousel';
import { SettingCard } from './SettingCard';
import clsx from 'clsx';

import { DiscoveryPackCarousel } from './DiscoveryPackCarousel';

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

  if (!settings.isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-bg-base overflow-y-auto"
      >
        <div className="sticky top-0 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-border-subtle px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-text-primary" />
            <h1 className="text-xl font-serif tracking-tight text-text-primary">Experience Settings</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => settings.randomize()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-secondary text-text-primary text-sm hover:bg-bg-elevated border border-border-subtle transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden md:inline">Surprise Me</span>
            </button>
            <button 
              onClick={() => settings.resetToDefault()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>
            <button 
              onClick={() => settings.setSettingsOpen(false)}
              className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-primary hover:bg-text-primary hover:text-bg-base transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="py-12 max-w-[1600px] mx-auto space-y-4">
          
          <SettingCarousel title="Your Presets" description="Save and load your favorite configurations.">
            <div className="relative flex-shrink-0 w-48 h-32 rounded-xl border border-border-subtle bg-bg-secondary flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-bg-elevated transition-colors"
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
                <div className="flex-1 bg-bg-secondary flex items-center justify-center relative p-4">
                  <span className="text-sm font-medium text-text-primary z-10">{name}</span>
                  <div className={`absolute inset-0 opacity-20 theme-${preset.appearance} img-style-${preset.imageStyle} bg-accent-primary`} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); settings.deletePreset(name); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-bg-elevated/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-text-secondary hover:text-text-primary" />
                </button>
              </div>
            ))}
          </SettingCarousel>

          <SettingCarousel title="Appearance" description="The foundational color atmosphere of the application.">
            {(['default', 'obsidian', 'paper', 'midnight', 'graphite', 'ash', 'ivory', 'monochrome', 'aurora', 'sunset', 'ocean', 'forest', 'twilight', 'electric', 'tron'] as AppearanceMode[]).map(mode => (
              <SettingCard 
                key={mode} id={mode} title={mode.charAt(0).toUpperCase() + mode.slice(1)} 
                isSelected={settings.appearance === mode}
                onClick={() => settings.setSettings({ appearance: mode })}
                previewNode={
                  <div className={`w-full h-full bg-bg-base theme-${mode} flex items-center justify-center p-4 text-text-primary transition-colors`}>
                    {getThemeIcon(mode)}
                  </div>
                }
              />
            ))}
          </SettingCarousel>

          <SettingCarousel title="Landing Experience" description="How the main entry point is presented.">
            {(['minimal', 'editorial', 'observatory', 'archive', 'gallery', 'cosmic', 'tron', 'monolith', 'paper', 'terminal'] as LandingStyle[]).map(style => (
              <SettingCard 
                key={style} id={style} title={style.charAt(0).toUpperCase() + style.slice(1)} 
                isSelected={settings.landingStyle === style}
                onClick={() => settings.setSettings({ landingStyle: style })}
                previewNode={<div className="text-text-muted font-serif text-xs">{style} layout preview</div>}
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
            {(['neutral', 'editorial', 'modern', 'classical', 'technical', 'brutalist', 'futuristic'] as TypographyStyle[]).map(typo => (
              <SettingCard 
                key={typo} id={typo} title={typo.charAt(0).toUpperCase() + typo.slice(1)} 
                isSelected={settings.typography === typo}
                onClick={() => settings.setSettings({ typography: typo })}
                previewNode={<span className={`text-2xl text-text-primary typo-${typo} font-serif`}>Ag</span>}
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
             <div className="relative flex-shrink-0 w-64 h-32 rounded-xl border border-border-subtle bg-bg-secondary flex flex-col items-center justify-center p-4">
                <span className="text-sm text-text-primary font-medium">Google Account</span>
                <span className="text-xs text-text-muted mt-1">Available for sign-in</span>
             </div>
             <div className="relative flex-shrink-0 w-64 h-32 rounded-xl border border-border-subtle bg-bg-secondary flex flex-col items-center justify-center p-4">
                <span className="text-sm text-text-primary font-medium">Email Account</span>
                <span className="text-xs text-text-muted mt-1">Available for sign-in</span>
             </div>
          </SettingCarousel>

          <DiscoveryPackCarousel />

        </div>
      </motion.div>
    </AnimatePresence>
  );
}

