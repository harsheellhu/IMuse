import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';

type CursorState = 'default' | 'link' | 'button' | 'grab' | 'grabbing' | 'text';

export function CustomCursor() {
  const { appearance, motion: motionSetting } = useSettingsStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Check if device supports fine pointer (mouse/trackpad). Do NOT display on touch devices.
    const finePointerQuery = window.matchMedia('(pointer: fine)');
    if (!finePointerQuery.matches) {
      return;
    }

    const wrapper = wrapperRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;

    if (!wrapper || !dot || !ring) return;

    // Add scoped class to html document to hide browser cursor on desktop
    document.documentElement.classList.add('has-custom-cursor');

    // 2. Reduced motion detection
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReduced = reducedMotionQuery.matches || motionSetting === 'reduced' || motionSetting === 'static';

    // 3. Motion state stored in local primitives (zero React re-renders)
    const target = { x: -100, y: -100 };
    const dotPos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };

    let isVisible = false;
    let isPressed = false;
    let currentState: CursorState = 'default';
    let isDarkContrast = false;
    let lastTarget: HTMLElement | null = null;
    let rafId: number | null = null;
    let isRunning = false;
    let initialized = false;

    // Helper to update cursor state directly via dataset
    const updateState = (newState: CursorState) => {
      if (currentState !== newState) {
        currentState = newState;
        wrapper.dataset.state = newState;
      }
    };

    // Fast, lightweight semantic target inspection
    const inspectTarget = (el: HTMLElement | null) => {
      if (!el) {
        updateState('default');
        return;
      }

      // Check for explicit data-cursor overrides
      const explicit = el.closest('[data-cursor]') as HTMLElement | null;
      if (explicit) {
        const val = explicit.dataset.cursor;
        if (val === 'ignore') {
          updateState('default');
          return;
        }
        if (val === 'drag' || val === 'grab') {
          updateState(isPressed ? 'grabbing' : 'grab');
          return;
        }
        if (val === 'button') {
          updateState('button');
          return;
        }
        if (val === 'link') {
          updateState('link');
          return;
        }
      }

      // 1. Inputs & editable text: allow normal browser text caret, hide custom cursor
      const tag = el.tagName;
      if (
        tag === 'INPUT' || 
        tag === 'TEXTAREA' || 
        tag === 'SELECT' || 
        el.isContentEditable || 
        el.closest('input:not([type="button"]):not([type="submit"]), textarea, select, [contenteditable="true"]')
      ) {
        updateState('text');
        return;
      }

      // 2. Genuine Draggable items, spatial canvas, and turntable tonearm
      if (
        el.closest('[data-canvas-item], .cursor-grab, .cursor-grabbing, [data-draggable], .turntable-tonearm')
      ) {
        updateState(isPressed ? 'grabbing' : 'grab');
        return;
      }

      // 3. Media, cards, images, articles -> default cursor
      if (
        tag === 'IMG' || 
        tag === 'VIDEO' || 
        tag === 'ARTICLE' || 
        el.closest('img, video, article, [data-post], [data-viewer], [data-carousel-item]')
      ) {
        updateState('default');
        return;
      }

      // 4. Standalone Buttons & action controls
      if (
        tag === 'BUTTON' || 
        el.getAttribute('role') === 'button' || 
        el.closest('button, [role="button"]')
      ) {
        updateState('button');
        return;
      }

      // 5. Links & navigations
      if (tag === 'A' || el.getAttribute('role') === 'link' || el.closest('a, [role="link"]')) {
        updateState('link');
        return;
      }

      // 6. Default state everywhere else
      updateState('default');
    };

    // Single demand-driven Animation Loop
    const animate = () => {
      if (initialized) {
        // Dot: 1:1 instantaneous tracking
        dotPos.x = target.x;
        dotPos.y = target.y;
        dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;

        // Ring: subtle interpolation or instant if reduced motion
        const lerpFactor = isReduced ? 1 : 0.22;
        const dx = target.x - ringPos.x;
        const dy = target.y - ringPos.y;

        ringPos.x += dx * lerpFactor;
        ringPos.y += dy * lerpFactor;
        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;

        // If ring has converged within subpixel distance and mouse isn't moving, sleep the RAF loop!
        if (!isPressed && Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          ringPos.x = target.x;
          ringPos.y = target.y;
          ring.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
          isRunning = false;
          rafId = null;
          return;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    const wakeLoop = () => {
      if (!isRunning) {
        isRunning = true;
        rafId = requestAnimationFrame(animate);
      }
    };

    // Pointer event listeners
    const onPointerMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      if (!initialized) {
        dotPos.x = target.x;
        dotPos.y = target.y;
        ringPos.x = target.x;
        ringPos.y = target.y;
        initialized = true;
      }

      if (!isVisible) {
        isVisible = true;
        wrapper.dataset.visible = 'true';
      }

      const el = e.target as HTMLElement | null;
      if (el !== lastTarget) {
        lastTarget = el;

        // Fast adaptive contrast detection
        if (el) {
          const isMediaOrDark = Boolean(
            el.tagName === 'IMG' || 
            el.tagName === 'VIDEO' || 
            el.closest('img, video, [data-contrast="dark"], .bg-black, .bg-\\[\\#0a0a0a\\], .bg-\\[\\#050505\\], .theme-dark')
          );
          if (isMediaOrDark !== isDarkContrast) {
            isDarkContrast = isMediaOrDark;
            wrapper.dataset.contrast = isMediaOrDark ? 'dark' : 'normal';
          }
        }

        inspectTarget(el);
      }

      wakeLoop();
    };

    const onPointerDown = () => {
      isPressed = true;
      wrapper.dataset.pressed = 'true';
      if (currentState === 'grab') {
        updateState('grabbing');
      }
      wakeLoop();
    };

    const onPointerUp = (e: PointerEvent) => {
      isPressed = false;
      wrapper.dataset.pressed = 'false';
      lastTarget = null;
      inspectTarget(e.target as HTMLElement | null);
      wakeLoop();
    };

    const onMouseLeave = () => {
      isVisible = false;
      lastTarget = null;
      wrapper.dataset.visible = 'false';
    };

    const onMouseEnter = () => {
      isVisible = true;
      wrapper.dataset.visible = 'true';
      wakeLoop();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);

    wakeLoop();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [appearance, motionSetting]);

  return (
    <div
      ref={wrapperRef}
      id="imuse-custom-cursor"
      data-visible="false"
      data-state="default"
      data-contrast="normal"
      data-pressed="false"
      className="imuse-cursor-wrapper pointer-events-none fixed inset-0 z-[100000] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Precision Core Dot with Dual-Tone Contrast Boundary */}
      <div
        ref={dotRef}
        className="imuse-cursor-dot absolute top-0 left-0 -ml-[3.5px] -mt-[3.5px] rounded-full will-change-transform pointer-events-none"
      />

      {/* Subtle Restrained Outer Ring */}
      <div
        ref={ringRef}
        className="imuse-cursor-ring absolute top-0 left-0 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center will-change-transform pointer-events-none"
      />
    </div>
  );
}
