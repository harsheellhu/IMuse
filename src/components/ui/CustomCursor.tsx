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
    let rafId: number | null = null;
    let initialized = false;

    // Helper to update cursor state directly via dataset
    const updateState = (newState: CursorState) => {
      if (currentState !== newState) {
        currentState = newState;
        wrapper.dataset.state = newState;
      }
    };

    // 4. Semantic target inspection on pointer move
    const inspectTarget = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
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
      if (
        el.closest(
          'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"], select'
        )
      ) {
        updateState('text');
        return;
      }

      // 2. Genuine Draggable items, spatial canvas, and turntable tonearm
      if (
        el.closest(
          '[data-canvas-item], .cursor-grab, .cursor-grabbing, [data-draggable], .turntable-tonearm'
        )
      ) {
        updateState(isPressed ? 'grabbing' : 'grab');
        return;
      }

      // 3. Posts, images, cards, books, films, places, collections, landing slideshow
      // MUST use DEFAULT CURSOR (no enlargement, no ring expansion, no label)
      if (
        el.closest(
          'img, video, .group:has(img), [data-post], [data-viewer], .aspect-\\[4\\/3\\], .aspect-\\[2\\/3\\], .aspect-\\[16\\/10\\], .aspect-\\[1\\/1\\], article'
        ) ||
        el.tagName === 'IMG'
      ) {
        updateState('default');
        return;
      }

      // 4. Standalone Buttons & action controls (Navbar controls, settings buttons, close icons)
      if (
        el.closest(
          'button, [role="button"], input[type="button"], input[type="submit"]'
        )
      ) {
        updateState('button');
        return;
      }

      // 5. Links & navigations
      if (el.closest('a, [role="link"]')) {
        updateState('link');
        return;
      }

      // 6. Default state everywhere else
      updateState('default');
    };

    // 5. Pointer event listeners
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

      // Fast, lightweight adaptive contrast detection
      const el = e.target as HTMLElement | null;
      if (el) {
        const isMediaOrDark = Boolean(
          el.closest(
            'img, video, [data-contrast="dark"], .aspect-\\[4\\/3\\], .aspect-\\[2\\/3\\], .aspect-\\[16\\/10\\], .bg-black, .bg-\\[\\#0a0a0a\\], .bg-\\[\\#050505\\], .theme-dark'
          ) || el.tagName === 'IMG'
        );
        wrapper.dataset.contrast = isMediaOrDark ? 'dark' : 'normal';
      }

      inspectTarget(e);
    };

    const onPointerDown = () => {
      isPressed = true;
      wrapper.dataset.pressed = 'true';
      if (currentState === 'grab') {
        updateState('grabbing');
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isPressed = false;
      wrapper.dataset.pressed = 'false';
      inspectTarget(e);
    };

    const onMouseLeave = () => {
      isVisible = false;
      wrapper.dataset.visible = 'false';
    };

    const onMouseEnter = () => {
      isVisible = true;
      wrapper.dataset.visible = 'true';
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);

    // 6. Single Animation Loop
    const animate = () => {
      if (initialized) {
        // Dot: 1:1 instantaneous tracking
        dotPos.x = target.x;
        dotPos.y = target.y;
        dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;

        // Ring: subtle interpolation (approx 50-70ms lag) or instant if reduced motion
        const lerpFactor = isReduced ? 1 : 0.2;
        ringPos.x += (target.x - ringPos.x) * lerpFactor;
        ringPos.y += (target.y - ringPos.y) * lerpFactor;
        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

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
