import { UniverseLayoutMode } from '../../store/useSettingsStore';

export interface UniverseNodeLayout {
  id: string;
  data: any;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  rotation: number;
  zIndex: number;
  edge?: {
    source: string;
    target: string;
    label?: string;
    relationType?: string;
    confidence?: number;
    strength?: 'primary' | 'secondary' | 'peripheral';
  };
  strength: 'primary' | 'secondary' | 'peripheral';
  confidence: number;
  label: string;
  isCenter: boolean;
}

export interface UniverseLayoutOptions {
  layoutMode: UniverseLayoutMode;
  centerId: string;
  nodes: any[];
  edges: any[];
  viewportWidth: number;
  viewportHeight: number;
  isMobile: boolean;
  stepIndex?: number;
}

/**
 * Automatically resolves the optimal layout mode based on content type.
 */
export function resolveAutoLayout(centerNode: any): UniverseLayoutMode {
  if (!centerNode) return 'orbit';
  const type = (centerNode.type || centerNode.category || '').toLowerCase();

  if (type.includes('photo') || type.includes('art') || type.includes('fashion') || type.includes('image')) {
    return 'gallery';
  }
  if (type.includes('book') || type.includes('literature') || type.includes('novel')) {
    return 'stack';
  }
  if (type.includes('architecture') || type.includes('place') || type.includes('travel') || type.includes('shop')) {
    return 'constellation';
  }
  if (type.includes('film') || type.includes('movie') || type.includes('tv') || type.includes('cinema')) {
    return 'cinematic';
  }
  return 'orbit';
}

/**
 * Computes deterministic 3D spatial layout coordinates for all nodes in the universe.
 */
export function computeUniverseLayout(options: UniverseLayoutOptions): {
  centerNodeLayout: UniverseNodeLayout | null;
  orbitNodesLayout: UniverseNodeLayout[];
  activeLayoutMode: UniverseLayoutMode;
} {
  const {
    layoutMode: configuredMode,
    centerId,
    nodes,
    edges,
    viewportWidth,
    viewportHeight,
    isMobile,
    stepIndex = 0
  } = options;

  const centerNode = nodes.find(n => n.id === centerId) || nodes[0];
  const activeLayoutMode = configuredMode === 'auto' ? resolveAutoLayout(centerNode) : configuredMode;

  if (!centerNode) {
    return { centerNodeLayout: null, orbitNodesLayout: [], activeLayoutMode };
  }

  // Filter orbit nodes
  let rawOrbitNodes = nodes.filter(n => n.id !== centerNode.id);

  // Responsive node count capping (fewer nodes on mobile for clarity)
  const maxVisibleNodes = isMobile ? 5 : 8;
  const orbitNodes = rawOrbitNodes.slice(0, maxVisibleNodes);
  const orbitCount = orbitNodes.length;

  // Safe exclusion zone dimensions around center
  const minSafeRadiusX = isMobile ? 180 : 250;
  const minSafeRadiusY = isMobile ? 180 : 220;

  // Scale multipliers based on viewport
  const viewScaleX = Math.min(1.3, Math.max(0.7, viewportWidth / 1440));
  const viewScaleY = Math.min(1.2, Math.max(0.7, viewportHeight / 900));

  // Center node representation
  const centerNodeLayout: UniverseNodeLayout = {
    id: centerNode.id,
    data: centerNode,
    x: 0,
    y: 0,
    z: 0,
    scale: 1.0,
    opacity: 1.0,
    rotation: 0,
    zIndex: 50,
    strength: 'primary',
    confidence: 1.0,
    label: 'Focal Center',
    isCenter: true
  };

  const orbitNodesLayout: UniverseNodeLayout[] = [];

  // Helper to extract edge connecting center to node
  const getConnectingEdge = (nodeId: string) => {
    return edges.find(
      e => (e.source === centerNode.id && e.target === nodeId) ||
           (e.source === nodeId && e.target === centerNode.id)
    );
  };

  // Helper to format relationship labels cleanly
  const formatLabel = (edge: any, node: any): { label: string; strength: 'primary' | 'secondary' | 'peripheral'; confidence: number } => {
    if (edge?.label) {
      return {
        label: edge.label,
        strength: edge.strength || 'secondary',
        confidence: edge.confidence || 0.8
      };
    }
    if (node.shared_tag) {
      return {
        label: `SHARED: ${node.shared_tag.toUpperCase()}`,
        strength: 'secondary',
        confidence: 0.75
      };
    }
    if (node.creator && centerNode.creator && node.creator === centerNode.creator) {
      return { label: 'SAME CREATOR', strength: 'primary', confidence: 0.95 };
    }
    if (node.type === centerNode.type) {
      return { label: `SAME ${node.type.toUpperCase()}`, strength: 'secondary', confidence: 0.70 };
    }
    return { label: 'CONNECTED', strength: 'peripheral', confidence: 0.60 };
  };

  // 1. ORBIT MODE: Planetary elliptical rings with rotation offset
  if (activeLayoutMode === 'orbit') {
    const baseRadiusX = (isMobile ? 220 : 380) * viewScaleX;
    const baseRadiusY = (isMobile ? 210 : 270) * viewScaleY;
    const rotationOffset = ((stepIndex % 12) * (Math.PI / 6)) - (Math.PI / 2);

    orbitNodes.forEach((node, i) => {
      const edge = getConnectingEdge(node.id);
      const { label, strength, confidence } = formatLabel(edge, node);

      // Distance variance based on strength
      const distFactor = strength === 'primary' ? 0.90 : strength === 'secondary' ? 1.02 : 1.15;
      const angle = rotationOffset + (i / Math.max(1, orbitCount)) * 2 * Math.PI;

      let x = Math.cos(angle) * baseRadiusX * distFactor;
      let y = Math.sin(angle) * baseRadiusY * distFactor;

      // Safe zone clamp
      if (Math.abs(x) < minSafeRadiusX && Math.abs(y) < minSafeRadiusY) {
        const rad = Math.hypot(x, y) || 1;
        x = (x / rad) * minSafeRadiusX;
        y = (y / rad) * minSafeRadiusY;
      }

      const scale = strength === 'primary' ? (isMobile ? 0.72 : 0.76) : strength === 'secondary' ? (isMobile ? 0.62 : 0.68) : (isMobile ? 0.52 : 0.58);
      const opacity = strength === 'primary' ? 1.0 : strength === 'secondary' ? 0.88 : 0.72;

      orbitNodesLayout.push({
        id: node.id,
        data: node,
        x,
        y,
        z: 0,
        scale,
        opacity,
        rotation: (Math.sin(i * 1.5) * 3),
        zIndex: 20 + i,
        edge,
        strength,
        confidence,
        label,
        isCenter: false
      });
    });
  }

  // 2. FLOW MODE: Curved spatial path gliding from left to right
  else if (activeLayoutMode === 'flow') {
    const spacingX = (isMobile ? 190 : 280) * viewScaleX;
    
    orbitNodes.forEach((node, i) => {
      const edge = getConnectingEdge(node.id);
      const { label, strength, confidence } = formatLabel(edge, node);

      // Alternate left and right of the flow stream
      const signedIndex = (i % 2 === 0 ? 1 : -1) * Math.ceil((i + 1) / 2);
      const normDist = Math.abs(signedIndex);

      const x = signedIndex * spacingX;
      // Gentle sine curve with height variation
      const y = Math.sin(signedIndex * 0.8) * 110 * viewScaleY + (normDist % 2 === 0 ? 30 : -20);
      const z = -normDist * 60;

      const scale = Math.max(0.48, (isMobile ? 0.70 : 0.78) - (normDist * 0.08));
      const opacity = Math.max(0.55, 1.0 - (normDist * 0.12));
      const rotation = signedIndex * -3.5;

      orbitNodesLayout.push({
        id: node.id,
        data: node,
        x,
        y,
        z,
        scale,
        opacity,
        rotation,
        zIndex: 30 - normDist,
        edge,
        strength,
        confidence,
        label,
        isCenter: false
      });
    });
  }

  // 3. STACK MODE: Layered 3D spatial cards fanned behind focus
  else if (activeLayoutMode === 'stack') {
    orbitNodes.forEach((node, i) => {
      const edge = getConnectingEdge(node.id);
      const { label, strength, confidence } = formatLabel(edge, node);

      // Left and right fanned wings
      const isLeft = i % 2 === 0;
      const layer = Math.floor(i / 2) + 1;

      const offsetX = (isLeft ? -1 : 1) * ((isMobile ? 180 : 270) + (layer * 45)) * viewScaleX;
      const offsetY = ((layer * 30) - 20) * viewScaleY;
      const z = -layer * 80;

      const scale = Math.max(0.50, (isMobile ? 0.68 : 0.74) - (layer * 0.07));
      const opacity = Math.max(0.60, 0.95 - (layer * 0.14));
      const rotation = (isLeft ? -1 : 1) * (5 + (layer * 2));

      orbitNodesLayout.push({
        id: node.id,
        data: node,
        x: offsetX,
        y: offsetY,
        z,
        scale,
        opacity,
        rotation,
        zIndex: 20 - layer,
        edge,
        strength,
        confidence,
        label,
        isCenter: false
      });
    });
  }

  // 4. GALLERY MODE: Showcase center with peripheral preview nodes
  else if (activeLayoutMode === 'gallery') {
    const marginX = (isMobile ? 220 : 420) * viewScaleX;
    const marginY = (isMobile ? 220 : 300) * viewScaleY;

    // Fixed safe quadrant positions around the perimeter
    const quadrantOffsets = [
      { x: -marginX, y: -marginY * 0.7 }, // top-left
      { x: marginX, y: -marginY * 0.7 },  // top-right
      { x: -marginX * 0.95, y: marginY * 0.7 }, // bottom-left
      { x: marginX * 0.95, y: marginY * 0.7 },  // bottom-right
      { x: -marginX * 1.05, y: 0 },       // left-mid
      { x: marginX * 1.05, y: 0 },        // right-mid
      { x: 0, y: -marginY * 1.05 },       // top-mid
      { x: 0, y: marginY * 1.05 }         // bottom-mid
    ];

    orbitNodes.forEach((node, i) => {
      const edge = getConnectingEdge(node.id);
      const { label, strength, confidence } = formatLabel(edge, node);
      const pos = quadrantOffsets[i % quadrantOffsets.length];

      orbitNodesLayout.push({
        id: node.id,
        data: node,
        x: pos.x,
        y: pos.y,
        z: 0,
        scale: strength === 'primary' ? 0.72 : 0.62,
        opacity: strength === 'primary' ? 0.95 : 0.78,
        rotation: 0,
        zIndex: 20 + i,
        edge,
        strength,
        confidence,
        label,
        isCenter: false
      });
    });
  }

  // 5. CONSTELLATION MODE: Dynamic celestial graph with golden-ratio dispersion
  else if (activeLayoutMode === 'constellation') {
    const tierRadii = [
      (isMobile ? 200 : 320) * viewScaleX,
      (isMobile ? 270 : 440) * viewScaleX,
      (isMobile ? 320 : 540) * viewScaleX
    ];

    orbitNodes.forEach((node, i) => {
      const edge = getConnectingEdge(node.id);
      const { label, strength, confidence } = formatLabel(edge, node);

      const tierIndex = strength === 'primary' ? 0 : strength === 'secondary' ? 1 : 2;
      const baseR = tierRadii[tierIndex] || tierRadii[1];

      // Golden ratio angle distribution
      const goldenAngle = 2.399963;
      const angle = (stepIndex * 0.5) + (i * goldenAngle);

      // Add deterministic organic jitter
      const jitterR = baseR * (0.92 + (Math.sin(i * 3.7) * 0.12));
      const aspectSkewY = 0.75 * viewScaleY;

      let x = Math.cos(angle) * jitterR;
      let y = Math.sin(angle) * jitterR * aspectSkewY;

      // Ensure minimum safe distance
      if (Math.abs(x) < minSafeRadiusX && Math.abs(y) < minSafeRadiusY) {
        const rad = Math.hypot(x, y) || 1;
        x = (x / rad) * minSafeRadiusX;
        y = (y / rad) * minSafeRadiusY;
      }

      const scale = strength === 'primary' ? 0.76 : strength === 'secondary' ? 0.66 : 0.54;
      const opacity = strength === 'primary' ? 1.0 : strength === 'secondary' ? 0.85 : 0.68;

      orbitNodesLayout.push({
        id: node.id,
        data: node,
        x,
        y,
        z: (tierIndex === 0 ? 10 : tierIndex === 1 ? 0 : -20),
        scale,
        opacity,
        rotation: (Math.sin(i * 2.1) * 4),
        zIndex: 25 - tierIndex,
        edge,
        strength,
        confidence,
        label,
        isCenter: false
      });
    });
  }

  // 6. CINEMATIC MODE: Deep perspective with wide translations and depth scaling
  else {
    const wideRadiusX = (isMobile ? 240 : 460) * viewScaleX;
    const wideRadiusY = (isMobile ? 220 : 310) * viewScaleY;

    orbitNodes.forEach((node, i) => {
      const edge = getConnectingEdge(node.id);
      const { label, strength, confidence } = formatLabel(edge, node);

      const angle = (i / Math.max(1, orbitCount)) * 2 * Math.PI - Math.PI / 2;
      const depthTier = i % 3; // 0 = close, 1 = mid, 2 = deep

      const radiusMultiplier = depthTier === 0 ? 0.88 : depthTier === 1 ? 1.05 : 1.25;
      const x = Math.cos(angle) * wideRadiusX * radiusMultiplier;
      const y = Math.sin(angle) * wideRadiusY * radiusMultiplier;
      const z = depthTier === 0 ? 20 : depthTier === 1 ? -40 : -100;

      const scale = depthTier === 0 ? 0.78 : depthTier === 1 ? 0.65 : 0.50;
      const opacity = depthTier === 0 ? 1.0 : depthTier === 1 ? 0.82 : 0.60;

      orbitNodesLayout.push({
        id: node.id,
        data: node,
        x,
        y,
        z,
        scale,
        opacity,
        rotation: (Math.sin(angle) * 3),
        zIndex: 30 - depthTier,
        edge,
        strength,
        confidence,
        label,
        isCenter: false
      });
    });
  }

  return { centerNodeLayout, orbitNodesLayout, activeLayoutMode };
}
