import React, { useState } from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';

export function ConstellationView() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    { id: '1', label: 'Minimalism', x: '20%', y: '30%' },
    { id: '2', label: 'Tadao Ando', x: '80%', y: '30%' },
    { id: '3', label: 'Concrete', x: '30%', y: '70%' },
    { id: '4', label: 'Japanese Design', x: '70%', y: '70%' },
    { id: 'center', label: 'Architecture', x: '50%', y: '50%' },
  ];

  return (
    <div className="relative w-full h-[70vh] bg-[#F5F4F1] overflow-hidden flex items-center justify-center">
      {/* Soft radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#FDFCFB_100%)] z-0 pointer-events-none"></div>
      
      <motion.div 
        className="relative z-10 w-full h-full max-w-5xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          {nodes.filter(n => n.id !== 'center').map(node => (
            <motion.line 
              key={`line-${node.id}`}
              x1={node.x} 
              y1={node.y} 
              x2="50%" 
              y2="50%" 
              stroke="#D1D1D1" 
              strokeWidth="1"
              animate={{ 
                stroke: hoveredNode === node.id || hoveredNode === 'center' ? '#111' : '#E5E5E5',
                strokeWidth: hoveredNode === node.id || hoveredNode === 'center' ? 2 : 1
              }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </svg>

        {nodes.map(node => (
          <motion.div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 flex flex-col items-center"
            style={{ left: node.x, top: node.y }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            animate={{ 
              scale: hoveredNode === node.id ? 1.05 : hoveredNode && hoveredNode !== node.id ? 0.95 : 1,
              opacity: hoveredNode && hoveredNode !== node.id ? 0.4 : 1
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={clsx(
              "px-6 py-3 rounded-full border text-xs tracking-widest uppercase transition-all duration-500 backdrop-blur-sm",
              node.id === 'center' 
                ? "bg-black text-white border-black" 
                : "bg-white/50 text-gray-600 border-gray-200 hover:bg-white hover:text-black hover:border-black shadow-sm"
            )}>
              {node.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
