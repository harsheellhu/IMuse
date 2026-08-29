import React from 'react';
import { motion } from 'motion/react';
import { UniverseNodeLayout } from './universeLayoutEngine';

interface UniverseConnectionsProps {
  centerNode: UniverseNodeLayout;
  orbitNodes: UniverseNodeLayout[];
  isTron: boolean;
  isReducedMotion: boolean;
  activeHoverId: string | null;
  primaryColor?: string;
}

export const UniverseConnections: React.FC<UniverseConnectionsProps> = ({
  centerNode,
  orbitNodes,
  isTron,
  isReducedMotion,
  activeHoverId,
  primaryColor
}) => {
  if (!centerNode) return null;

  return (
    <svg 
      className="absolute w-[3000px] h-[3000px] pointer-events-none" 
      style={{ 
        left: 'calc(50% - 1500px)', 
        top: 'calc(50% - 1500px)', 
        zIndex: 5 
      }}
    >
      <defs>
        {/* Default / Organic Gradient */}
        <linearGradient id="universeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop 
            offset="0%" 
            stopColor={primaryColor || 'var(--text-primary, #ffffff)'} 
            stopOpacity="0.4" 
          />
          <stop 
            offset="70%" 
            stopColor={primaryColor || 'var(--text-primary, #ffffff)'} 
            stopOpacity="0.12" 
          />
          <stop 
            offset="100%" 
            stopColor={primaryColor || 'var(--text-primary, #ffffff)'} 
            stopOpacity="0.02" 
          />
        </linearGradient>

        {/* Highlight Gradient for Hovered Node */}
        <linearGradient id="universeHighlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop 
            offset="0%" 
            stopColor={isTron ? '#00f0ff' : 'var(--text-primary, #ffffff)'} 
            stopOpacity="0.9" 
          />
          <stop 
            offset="100%" 
            stopColor={isTron ? '#00f0ff' : 'var(--text-primary, #ffffff)'} 
            stopOpacity="0.4" 
          />
        </linearGradient>

        {/* TRON Neon Gradient */}
        <linearGradient id="tronLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#00f0ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.05" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="tronGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(1500, 1500)">
        {orbitNodes.map((node) => {
          const isHovered = activeHoverId === node.id;
          const targetX = node.x;
          const targetY = node.y;

          // Calculate subtle organic curved bezier path
          // Tangent offset perpendicular to the line connecting center to target
          const dx = targetX;
          const dy = targetY;
          const dist = Math.hypot(dx, dy) || 1;
          
          // Subtle curve deflection (5-15% of distance)
          const curveDeflection = Math.min(45, dist * 0.08) * (targetX >= 0 ? 1 : -1);
          const cx = (targetX * 0.5) - (dy / dist) * curveDeflection;
          const cy = (targetY * 0.5) + (dx / dist) * curveDeflection;

          const pathD = `M 0,0 Q ${cx},${cy} ${targetX},${targetY}`;

          // Midpoint along the quadratic curve: B(0.5) = 0.25*P0 + 0.5*P1 + 0.25*P2
          const midX = 0.5 * cx + 0.25 * targetX;
          const midY = 0.5 * cy + 0.25 * targetY;

          const strokeGradient = isHovered 
            ? 'url(#universeHighlightGrad)' 
            : isTron 
              ? 'url(#tronLineGrad)' 
              : 'url(#universeLineGrad)';

          const strokeWidth = isHovered ? (isTron ? 2.5 : 2) : (isTron ? 1.2 : 0.9);

          return (
            <g key={`connection-${node.id}`} className="transition-opacity duration-300">
              {/* Main Curved Relationship Line */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={strokeGradient}
                strokeWidth={strokeWidth}
                strokeDasharray={isTron ? (isHovered ? 'none' : '4 4') : undefined}
                filter={isTron && isHovered ? 'url(#tronGlow)' : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isHovered ? 1.0 : (node.opacity * 0.75) }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ 
                  duration: isReducedMotion ? 0.1 : 0.6, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
              />

              {/* Relationship Pulse Beacon at Midpoint */}
              <motion.circle
                cx={midX}
                cy={midY}
                r={isHovered ? 4.5 : (node.strength === 'primary' ? 3 : 2)}
                fill={isTron ? '#00f0ff' : (primaryColor || 'var(--text-primary, #ffffff)')}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isHovered ? 1.4 : 1, 
                  opacity: isHovered ? 1.0 : (node.strength === 'primary' ? 0.6 : 0.35) 
                }}
                transition={{ duration: 0.3 }}
                filter={isTron ? 'url(#tronGlow)' : undefined}
              />

              {/* Extra connection halo on hover */}
              {isHovered && (
                <circle
                  cx={midX}
                  cy={midY}
                  r={8}
                  fill="none"
                  stroke={isTron ? '#00f0ff' : 'var(--text-primary, #ffffff)'}
                  strokeWidth={1}
                  className="opacity-40 animate-ping"
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
