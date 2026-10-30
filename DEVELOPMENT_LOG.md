# iMuse — Master Development & Engineering Log

**Project:** iMuse — Personal Cultural Universe  
**Tagline:** *"Your personal universe of things worth remembering."*  
**Developer:** Harsheell  
**Architecture:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand + Express + SQLite + IndexedDB  

---

## 1. Project Overview & Architectural Vision

iMuse is a local-first, privacy-respecting cultural archive, discovery platform, and digital museum. Rather than functioning as a standard social bookmarking tool, iMuse maps the user's emotional and visual aesthetic spectrum over time, linking cinema, books, architecture, visual arts, television, places, and music through atmospheric and chromatic resonance.

### Core Architectural Pillars
1. **Local-First & Offline Resilience:** SQLite via `better-sqlite3` on the backend, IndexedDB (`idb`) for local audio tracks, and `localStorage` for visual preferences. Zero cloud reliance.
2. **GPU-Accelerated Motion Identity:** Fluid spring physics and transforms via `motion/react` with zero layout recalculation overhead during dragging.
3. **Semantic Token Theme Engine:** A CSS custom property architecture supporting 32 art-directed visual environments without style sheet duplication.
4. **Perceptual Cultural Discovery:** Atmosphere natural-language search and OKLab color space matching enabling discovery without needing to remember artifact titles.

---

## 2. Major Development Milestones

### Milestone 1: Foundational Upgrade & Architecture (Aug 24, 2026)
- **Commit:** `d8fd6d1` (+7,719 lines)
- **Implemented:**
  - Upgraded initial prototype to full local application.
  - Connected core navigation and dynamic search overlay.
  - Built SQLite schema (`users`, `content`, `discovery_worlds`, `content_tags`, `collections`, `saved_items`, `recent_views`).
  - Added save/unsave system and personal library archive.
  - Implemented responsive layout system for desktop, tablet, and mobile.
  - Audited stacking contexts, z-index hierarchies, and pointer event layers.

### Milestone 2: Motion, Smoothness & Canvas Performance (Aug 25–27, 2026)
- **Commits:** `7833140`, `3335e57`, `4b03552`, `ee43a8e`, `c45165b`, `6eff121`
- **Implemented:**
  - Infinite spatial canvas in `ExploreWorld.tsx` with Sunflower phyllotaxis algorithm for organic artifact distribution.
  - Parallax background grid bound to `useMotionValue` to prevent React re-renders during canvas panning.
  - Full-screen editorial Slideshow Landing page with Ken Burns photography transitions and story indicators.
  - Ambient color mesh bloom behind artifacts in `PostDetailViewer.tsx`.

### Milestone 3: Vinyl Turntable & Audio Engine (Aug 28–31, 2026)
- **Commits:** `3932ee3`, `08d2f23`, `313d1d1`, `366510f`, `2f2d6c9`
- **Implemented:**
  - Custom HTML5 / Web Audio turntable with 33/45 RPM pitch controls and scrubbing tonearm.
  - IndexedDB local audio storage using `musicDB.ts`.
  - ID3 metadata and artwork extraction using `music-metadata-browser`.
  - MiniPlayer, FullPlayer, dynamic waveform visualization, and time-synced lyrics viewer.

### Milestone 4: Experiential Modules & Taste Mapping (Sep 1–4, 2026)
- **Commits:** `2eba907`, `e51c149`, `8b596ff`
- **Implemented:**
  - **Color Memory:** Aggregates palette usage across the user's saved items over time, generating an annual color strip and identifying recurring dominant tones.
  - **Serendipity Mode:** Non-linear associative leap algorithm linking cultural artifacts across unexpected categories.
  - **Virtual Museum & Rooms:** Multi-room 3D gallery with dynamic lighting presets and spatial exhibition framing.
  - **Cultural DNA:** Radial charts and aesthetic spectrum breakdowns across periods and genres.

### Milestone 5: Smart Collections & Cultural Trails (Oct 26–27, 2026)
- **Commits:** `50c7964`, `a7480e7`
- **Implemented:**
  - Rule-based dynamic Smart Collections with recursive operators (`equals`, `contains`, `between`).
  - Cultural Trails linking artifacts with narrative annotations and directional connection types (`inspired_by`, `set_in`, `leads_to`).

### Milestone 6: Expanded Global Theme System (Oct 30, 2026)
- **Commit:** `94a4aa9`
- **Implemented:**
  - Comprehensive 32-theme system covering 4 distinct aesthetic families: Editorial/Artistic, Analog/Nostalgic, Natural/Atmospheric, and Digital/Experimental.
  - Unified CSS variable token injection with live carousel preview and instant switching.

### Milestone 7: Atmosphere & Color Search Discovery System (Oct 30, 2026)
- **Commit:** `5d1de80`
- **Implemented:**
  - Atmosphere natural-language search with 4-dimensional taxonomy and synonym mapping.
  - OKLab perceptual color distance matching ($\Delta E_{\text{OKLab}}$) supporting single-color and multi-color modes (ANY, ALL, Palette Harmony).
  - Dedicated `/discovery` Studio route with tunable balance slider and batch collection/trail export.
  - Deep integration across Navbar, SearchOverlay, ColorMemory, DetailViewer, ExploreWorld, and Home.

### Milestone 8: Cinematic Landing-to-Home Fluid Transition (Oct 30, 2026)
- **Commit:** `8510dcf`
- **Implemented:**
  - 5-Phase fluid morph between `/` (Landing Page) and `/home` (Cultural Feed) eliminating abrupt white/black page flips.
  - Persistent `<CinematicLaunchTransition />` portal mounted at the `BrowserRouter` root level that remains mounted during route changes.
  - Shared-element brand logo morph gliding from landing position (`top: 48px/24px`) to Navbar position (`top: 20px`) with coordinated opacity and zero duplicate visual flicker.
  - Atmospheric radial bloom generating ambient chromatic halos based on the active landing artwork palette.
  - Quintic-out deceleration curve `[0.16, 1, 0.3, 1]` for natural camera acceleration and smooth settling.
  - Multi-input triggers (Space, Enter, click) with button compression, brightness flare, and rapid re-trigger prevention.
  - Staggered discovery feed reveal on `/home` with reduced-motion accessibility mode and clean unmount.

---

## 3. Technical Problems Encountered & Solutions

### Problem 1: Unnecessary Re-renders During Spatial Canvas Panning
- **Symptom:** Panning on the infinite canvas dropped FPS from 60 to ~25 due to React state updates triggering full tree reconciliation.
- **Solution:** Replaced React component state with `useMotionValue(x, y)` and `useTransform`. Panning transforms are now applied directly to the DOM matrix via GPU without invoking the React render lifecycle.

### Problem 2: Color Space Distortions in Naive RGB Matching
- **Symptom:** Euclidean distance in standard RGB space treated green and yellow differences as perceptually equivalent to blue differences, leading to inaccurate palette matches.
- **Solution:** Converted sRGB to Linear sRGB, then mapped to OKLab space ($L, a, b$). OKLab provides uniform perceptual color distance where $\Delta E_{\text{OKLab}} \le 0.12$ accurately represents close visual harmony.

### Problem 3: Performance Degradation During Palette Extraction
- **Symptom:** Extracting palettes from high-resolution images on the main thread blocked UI responsiveness and caused scroll hitching.
- **Solution:** Implemented progressive offscreen canvas downsampling to 48px thumbnails with color quantization and dual-layer caching (in-memory `Map` + `sessionStorage`).

### Problem 4: Windows PowerShell Multi-line Command Execution
- **Symptom:** Inline `node -e` scripts with nested quotation marks failed in PowerShell with syntax errors.
- **Solution:** Established isolated `.ts` test scripts run via `npx tsx`, which execute cleanly without escaping conflicts.

### Problem 5: Seamless Shared-Element Logo Alignment Across Route Boundaries
- **Symptom:** Calling `navigate('/home')` instantly unmounts `LandingPage` before `Home` finishes mounting, causing an abrupt disappearance of the landing logo and background before the home page appears.
- **Solution:** Mounted `<CinematicLaunchTransition />` at the `BrowserRouter` root level in `App.tsx` outside of the page router `<Routes>`. Coordinated logo visibility across the boundary with `useLaunchTransitionStore.isLogoMorphing` so the Navbar brand component stays hidden until the flying portal logo lands at its exact target coordinates (`y: -28px` desktop / `-4px` mobile), then smoothly crossfades into the static navbar brand with zero flicker.

---

## 4. Verification & Testing History

- **Linting & Type Safety:** `npm run lint` (`tsc --noEmit`) passes with 0 errors across all 86 project files.
- **Discovery Engine Test Suite:** `npm test` (`src/utils/__tests__/discoveryEngine.test.ts`) verifies:
  1. Hex validation and normalization.
  2. OKLab perceptual distance accuracy.
  3. Palette matching modes (ANY, ALL, Harmony).
  4. Atmosphere synonym and concept extraction.
  5. Multi-field weighted catalog ranking.
- **Production Build:** `npm run build` cleanly outputs all chunks in under 5 seconds.
