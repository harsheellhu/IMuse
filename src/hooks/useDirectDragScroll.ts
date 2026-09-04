import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface UseDirectDragScrollOptions {
  /** Speed multiplier for dragging (default: 1) */
  dragMultiplier?: number;
  /** Enable momentum/inertia after drag release (default: true) */
  inertia?: boolean;
  /** Snapping behavior after release (default: 'auto') */
  snap?: boolean;
  /** Spacing between items for manual snap calculation if needed */
  itemSelector?: string;
  /** Drag threshold in pixels before suppressing child clicks (default: 6) */
  dragThreshold?: number;
  /** Callback on active card index change */
  onIndexChange?: (index: number) => void;
}

export function useDirectDragScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseDirectDragScrollOptions = {}
) {
  const {
    dragMultiplier = 1,
    inertia = true,
    snap = false,
    itemSelector,
    dragThreshold = 6,
    onIndexChange
  } = options;

  const containerRef = useRef<T>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Internal mutable refs for zero-overhead 60fps tracking
  const stateRef = useRef({
    isDown: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    initialScrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    hasMovedPastThreshold: false,
    rafId: 0 as number | null,
    pointerId: null as number | null
  });

  // Update scroll boundaries
  const updateScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  // Check closest active item index
  const updateActiveIndex = useCallback(() => {
    const el = containerRef.current;
    if (!el || !onIndexChange) return;

    const children = itemSelector 
      ? el.querySelectorAll(itemSelector) 
      : el.children;

    if (children.length === 0) return;

    const containerCenter = el.scrollLeft + el.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(containerCenter - childCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    onIndexChange(closestIndex);
  }, [itemSelector, onIndexChange]);

  // Inertia Deceleration Loop
  const startInertia = useCallback((initialVelocity: number) => {
    const el = containerRef.current;
    if (!el || !inertia || Math.abs(initialVelocity) < 0.15) {
      if (snap) snapToNearest();
      return;
    }

    if (stateRef.current.rafId) {
      cancelAnimationFrame(stateRef.current.rafId);
    }

    let currentVelocity = initialVelocity * 14; // Convert velocity to px/frame
    const friction = 0.94;
    const minVelocity = 0.2;

    const step = () => {
      if (!containerRef.current) return;
      currentVelocity *= friction;

      if (Math.abs(currentVelocity) > minVelocity) {
        containerRef.current.scrollLeft -= currentVelocity;
        stateRef.current.rafId = requestAnimationFrame(step);
      } else {
        stateRef.current.rafId = null;
        if (snap) {
          snapToNearest();
        }
      }
    };

    stateRef.current.rafId = requestAnimationFrame(step);
  }, [inertia, snap]);

  // Snap smoothly to nearest item
  const snapToNearest = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const children = itemSelector ? el.querySelectorAll(itemSelector) : el.children;
    if (children.length === 0) return;

    const containerLeft = el.scrollLeft;
    let targetScroll = containerLeft;
    let minDistance = Infinity;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childLeft = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2;
      const dist = Math.abs(containerLeft - childLeft);
      if (dist < minDistance) {
        minDistance = dist;
        targetScroll = childLeft;
      }
    }

    el.scrollTo({
      left: Math.max(0, Math.min(targetScroll, el.scrollWidth - el.clientWidth)),
      behavior: 'smooth'
    });
  }, [itemSelector]);

  // Scroll by offset smoothly
  const scrollBy = useCallback((offset: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  // Scroll to index smoothly
  const scrollToIndex = useCallback((index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const children = itemSelector ? el.querySelectorAll(itemSelector) : el.children;
    if (index >= 0 && index < children.length) {
      const child = children[index] as HTMLElement;
      const targetLeft = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2;
      el.scrollTo({
        left: Math.max(0, Math.min(targetLeft, el.scrollWidth - el.clientWidth)),
        behavior: 'smooth'
      });
    }
  }, [itemSelector]);

  // Check if click should be prevented after dragging
  const shouldPreventClick = useCallback(() => {
    return stateRef.current.hasMovedPastThreshold;
  }, []);

  // Pointer Event Handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<T>) => {
    // Only primary button
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const el = containerRef.current;
    if (!el) return;

    if (stateRef.current.rafId) {
      cancelAnimationFrame(stateRef.current.rafId);
      stateRef.current.rafId = null;
    }

    stateRef.current.isDown = true;
    stateRef.current.isDragging = false;
    stateRef.current.hasMovedPastThreshold = false;
    stateRef.current.startX = e.clientX;
    stateRef.current.startY = e.clientY;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastTime = performance.now();
    stateRef.current.initialScrollLeft = el.scrollLeft;
    stateRef.current.velocity = 0;
    stateRef.current.pointerId = e.pointerId;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<T>) => {
    const state = stateRef.current;
    if (!state.isDown) return;

    const el = containerRef.current;
    if (!el) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    // Check if moved past threshold
    if (!state.hasMovedPastThreshold) {
      if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
        // If movement is predominantly horizontal, take over drag
        if (Math.abs(dx) >= Math.abs(dy)) {
          state.hasMovedPastThreshold = true;
          state.isDragging = true;
          setIsDraggingState(true);
        } else {
          // If vertical, cancel drag and allow natural page scroll
          state.isDown = false;
          return;
        }
      } else {
        return;
      }
    }

    if (!state.isDragging) return;

    // 1:1 Direct scrolling via container scrollLeft (compositor-friendly)
    el.scrollLeft = state.initialScrollLeft - (dx * dragMultiplier);

    // Track velocity for inertia
    const now = performance.now();
    const dt = now - state.lastTime;
    if (dt > 10) {
      state.velocity = (e.clientX - state.lastX) / dt;
      state.lastX = e.clientX;
      state.lastTime = now;
    }
  }, [dragMultiplier, dragThreshold]);

  const handlePointerUp = useCallback((e: React.PointerEvent<T>) => {
    const state = stateRef.current;
    if (!state.isDown) return;

    const wasDragging = state.isDragging;
    const velocity = state.velocity;

    state.isDown = false;
    state.isDragging = false;
    state.pointerId = null;

    if (wasDragging) {
      setIsDraggingState(false);
      startInertia(velocity);
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Reset threshold flag after short tick so ongoing click event can be prevented
    setTimeout(() => {
      stateRef.current.hasMovedPastThreshold = false;
    }, 50);
  }, [startInertia]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<T>) => {
    stateRef.current.isDown = false;
    stateRef.current.isDragging = false;
    stateRef.current.pointerId = null;
    setIsDraggingState(false);
    setTimeout(() => {
      stateRef.current.hasMovedPastThreshold = false;
    }, 50);
  }, []);

  // Wheel & Trackpad normalization
  const handleWheel = useCallback((e: React.WheelEvent<T>) => {
    const el = containerRef.current;
    if (!el) return;

    // Detect horizontal intent (trackpad swipe or shift key)
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;

    if (isHorizontal) {
      const delta = e.shiftKey ? e.deltaY : e.deltaX;
      if (Math.abs(delta) > 1) {
        el.scrollLeft += delta;
      }
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<T>) => {
    const el = containerRef.current;
    if (!el) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollBy(el.clientWidth * 0.5);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollBy(-el.clientWidth * 0.5);
    } else if (e.key === 'Home') {
      e.preventDefault();
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }
  }, [scrollBy]);

  // Setup bounds & resize listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollBounds();

    const handleScroll = () => {
      updateScrollBounds();
      updateActiveIndex();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollBounds();
      });
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (resizeObserver) resizeObserver.disconnect();
      if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId);
    };
  }, [updateScrollBounds, updateActiveIndex]);

  return {
    containerRef,
    isDragging: isDraggingState,
    canScrollLeft,
    canScrollRight,
    scrollBy,
    scrollToIndex,
    snapToNearest,
    shouldPreventClick,
    bind: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onWheel: handleWheel,
      onKeyDown: handleKeyDown,
      style: {
        touchAction: 'pan-y' as const,
        userSelect: isDraggingState ? ('none' as const) : undefined,
        cursor: isDraggingState ? 'grabbing' : 'grab'
      }
    }
  };
}
