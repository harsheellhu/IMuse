import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { engineApi } from '../../api/engine';
import { useSettingsStore } from '../../store/useSettingsStore';

interface UniverseGraphViewerProps {
  initialContentId: string;
  onClose: () => void;
  onNavigateToContent: (content: any) => void;
}

export function UniverseGraphViewer({ initialContentId, onClose, onNavigateToContent }: UniverseGraphViewerProps) {
  const [history, setHistory] = useState<string[]>([initialContentId]);
  const [graphData, setGraphData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { typography, motion: motionMode } = useSettingsStore();

  const currentId = history[history.length - 1];

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    engineApi.getUniverse(currentId).then(data => {
      if (mounted) {
        setGraphData(data);
        setIsLoading(false);
      }
    }).catch(console.error);

    return () => { mounted = false; };
  }, [currentId]);

  const handleExpandNode = (nodeId: string) => {
    setHistory([...history, nodeId]);
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(history.slice(0, -1));
    }
  };

  if (!graphData && isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center">
        <div className="animate-pulse text-white/50 tracking-[0.2em] uppercase text-xs">Mapping Universe...</div>
      </div>
    );
  }

  if (!graphData) return null;

  const centerNode = graphData.nodes.find((n: any) => n.id === currentId) || graphData.nodes[0];
  const orbitNodes = graphData.nodes.filter((n: any) => n.id !== currentId);

  // Position nodes in a circle
  const radius = 250;
  const nodesWithPositions = orbitNodes.map((node: any, i: number) => {
    const angle = (i / orbitNodes.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...node,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      edge: graphData.edges.find((e: any) => e.target === node.id || e.source === node.id)
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[9999] bg-[#0A0A0A] text-white flex flex-col overflow-hidden typography-${typography}`}
    >
      <header className="p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">Universe Map</span>
          {history.length > 1 && (
            <button onClick={handleBack} className="text-xs uppercase tracking-widest hover:text-white/80 transition-colors">
              ← Back
            </button>
          )}
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center">
        
        {/* Draw Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <g transform="translate(50vw, 50vh)">
            {nodesWithPositions.map((node: any, i: number) => (
              <motion.line 
                key={`line-${node.id}`}
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.1 }}
                x1={0} 
                y1={0} 
                x2={node.x} 
                y2={node.y} 
                stroke="url(#lineGrad)"
                strokeWidth="1"
              />
            ))}
          </g>
        </svg>

        {/* Orbit Nodes */}
        <AnimatePresence mode="popLayout">
          {nodesWithPositions.map((node: any, i: number) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: node.x, y: node.y }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.4, delay: i * 0.1 }}
              className="absolute z-10 flex flex-col items-center"
              style={{ width: 140 }}
            >
              <div 
                className="w-24 h-32 rounded-lg overflow-hidden border border-white/20 cursor-pointer hover:border-white/60 transition-colors group relative"
                onClick={() => handleExpandNode(node.id)}
              >
                {node.image_url ? (
                  <img src={node.image_url} alt={node.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="text-[10px] text-white/30 uppercase">{node.type}</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  <span className="text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Search className="w-3 h-3" /> Expand
                  </span>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#4ADE80] mb-1 px-2 py-0.5 rounded-full border border-[#4ADE80]/30 bg-[#4ADE80]/10 inline-block">
                  {node.edge?.label || 'related'}
                </div>
                <h4 className="font-serif text-sm line-clamp-2 leading-tight">{node.title}</h4>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Center Node */}
        <motion.div
          key={centerNode.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute z-20 flex flex-col items-center"
        >
          <div className="w-48 h-64 rounded-xl overflow-hidden border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.1)] group cursor-pointer" onClick={() => onNavigateToContent(centerNode)}>
            {centerNode.image_url ? (
              <img src={centerNode.image_url} alt={centerNode.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <span className="text-xs text-white/50 uppercase tracking-widest">{centerNode.type}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
               <span className="text-xs uppercase tracking-widest">View Details</span>
            </div>
          </div>
          <div className="mt-6 text-center max-w-[200px]">
            <h2 className="font-serif text-2xl leading-tight mb-2">{centerNode.title}</h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Origin</span>
          </div>
        </motion.div>

      </div>
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">Select a node to travel deeper</span>
      </div>
    </motion.div>
  );
}
