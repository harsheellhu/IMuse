import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Layout } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { museumApi, MuseumRoom } from '../api/museum';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import clsx from 'clsx';

export function MuseumRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<MuseumRoom | null>(null);
  const [allRooms, setAllRooms] = useState<MuseumRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExhibitionMode, setIsExhibitionMode] = useState(false);
  const [canvasItems, setCanvasItems] = useState<any[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const { typography } = useSettingsStore();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const rooms = await museumApi.getRooms();
        setAllRooms(rooms);
        const current = rooms.find(r => r.id === roomId);
        if (current) {
          setRoom(current);
          
          // Initialize canvas items with metadata or defaults
          const itemsWithMeta = current.items.map((item, i) => {
            const defaultX = (i % 5) * 220 - 440;
            const defaultY = Math.floor(i / 5) * 320 - 220;
            return {
              ...item,
              canvas: item.metadata || { x: defaultX, y: defaultY, scale: 1, zIndex: i, isFeatured: false }
            };
          });
          setCanvasItems(itemsWithMeta);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [roomId]);

  const handleSaveCanvas = async () => {
    if (!room) return;
    try {
      const itemsToSave = canvasItems.map(item => ({
        content_id: item.content_id,
        metadata: item.canvas
      }));
      await museumApi.saveRoomCanvas(room.collection_id, itemsToSave);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = (id: string, info: any) => {
    if (isExhibitionMode) return;
    setCanvasItems(prev => {
      return prev.map(item => {
        if (item.content_id === id) {
          return {
            ...item,
            canvas: { ...item.canvas, x: item.canvas.x + info.offset.x, y: item.canvas.y + info.offset.y }
          };
        }
        return item;
      });
    });
  };

  // Debounced auto-save
  useEffect(() => {
    if (!isLoading && canvasItems.length > 0 && !isExhibitionMode) {
      const t = setTimeout(handleSaveCanvas, 1500);
      return () => clearTimeout(t);
    }
  }, [canvasItems, isExhibitionMode]);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-bg-base flex items-center justify-center typo-${typography}`}>
        <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary animate-pulse">Preparing Room...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={`min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-6 text-center typo-${typography}`}>
        <h2 className="text-2xl font-serif text-text-primary">Room Not Found</h2>
        <p className="text-sm text-text-secondary max-w-md">This exhibition room is currently unavailable or being reorganized.</p>
        <Link to="/museum" className="px-6 py-2 rounded-full border border-border-subtle text-xs uppercase tracking-widest hover:border-text-primary transition-all">
          Back to Museum
        </Link>
      </div>
    );
  }

  const currentIdx = allRooms.findIndex(r => r.id === roomId);
  const prevRoom = currentIdx > 0 ? allRooms[currentIdx - 1] : null;
  const nextRoom = currentIdx < allRooms.length - 1 ? allRooms[currentIdx + 1] : null;

  return (
    <div className={`fixed inset-0 bg-bg-base text-text-primary overflow-hidden typo-${typography}`}>
      
      {/* Top Header / Controls */}
      <AnimatePresence mode="wait">
        {!isExhibitionMode && (
          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-6">
              <Link to="/museum" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium hover:opacity-70 transition-opacity text-text-primary">
                <ArrowLeft className="w-4 h-4" /> Museum
              </Link>
              <div className="h-4 w-px bg-border-subtle" />
              <span className="text-xs font-serif italic text-text-secondary">Room {(currentIdx + 1).toString().padStart(2, '0')} — {room.collection_title}</span>
            </div>

            <div className="pointer-events-auto">
              <button 
                onClick={() => setIsExhibitionMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-text-primary text-bg-base text-[10px] uppercase tracking-[0.2em] font-medium hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Enter Exhibition
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Infinite Canvas Wrapper */}
      <div className="absolute inset-0 cursor-grab active:cursor-grabbing overflow-hidden">
        <motion.div 
          ref={canvasRef}
          drag={!isExhibitionMode}
          dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
          dragElastic={0.08}
          className="w-[10000px] h-[10000px] absolute left-1/2 top-1/2 -ml-[5000px] -mt-[5000px] flex items-center justify-center"
        >
          {canvasItems.map(item => (
            <CanvasItemNode 
              key={item.content_id} 
              item={item} 
              isExhibitionMode={isExhibitionMode}
              onDragEnd={(info) => handleDragEnd(item.content_id, info)}
              onUpdateCanvas={(updates) => {
                setCanvasItems(prev => prev.map(i => i.content_id === item.content_id ? { ...i, canvas: { ...i.canvas, ...updates } } : i));
              }}
            />
          ))}

          {/* Room Intro Wall */}
          <div className="absolute left-1/2 top-1/2 -translate-x-[600px] -translate-y-1/2 max-w-sm pointer-events-none">
            <span className="text-[9px] uppercase tracking-[0.4em] text-text-secondary font-bold mb-6 block">
              Room {(currentIdx + 1).toString().padStart(2, '0')}
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-light mb-4 leading-none text-text-primary">{room.collection_title}</h1>
            <p className="text-sm font-serif italic text-text-secondary leading-relaxed">{room.curator_note || room.collection_desc}</p>
          </div>
        </motion.div>
      </div>

      {/* Exhibition Exit Overlay */}
      {isExhibitionMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => setIsExhibitionMode(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated/90 backdrop-blur-md border border-border-subtle text-text-primary text-[10px] uppercase tracking-[0.2em] hover:bg-bg-elevated transition-colors shadow-lg cursor-pointer"
          >
            <Layout className="w-3.5 h-3.5" /> Edit Room
          </button>
        </div>
      )}

      {/* Room Navigation */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8">
        {prevRoom ? (
          <button 
            onClick={() => navigate(`/museum/${prevRoom.id}`)} 
            className="p-3 rounded-full hover:bg-bg-elevated/80 border border-border-subtle/50 transition-colors text-text-primary cursor-pointer shadow-sm"
            aria-label="Previous Room"
          >
            <ChevronLeft className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
        ) : <div className="w-11" />}

        {nextRoom ? (
          <button 
            onClick={() => navigate(`/museum/${nextRoom.id}`)} 
            className="p-3 rounded-full hover:bg-bg-elevated/80 border border-border-subtle/50 transition-colors text-text-primary cursor-pointer shadow-sm"
            aria-label="Next Room"
          >
            <ChevronRight className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
        ) : <div className="w-11" />}
      </div>

    </div>
  );
}

function CanvasItemNode({ item, isExhibitionMode, onDragEnd, onUpdateCanvas }: { key?: React.Key; item: any; isExhibitionMode: boolean; onDragEnd: (info: any) => void; onUpdateCanvas: (updates: any) => void }) {
  const { canvas } = item;
  const isFeatured = canvas.isFeatured;
  
  // Base dimensions
  let width = 240;
  let height = 340;
  if (item.type === 'book') { width = 200; height = 300; }
  if (item.type === 'film' || item.type === 'tv_show') { width = 240; height = 350; }
  if (item.type === 'place') { width = 380; height = 240; }
  if (item.type === 'post') { width = 270; height = 270; }

  // Apply scale
  width *= canvas.scale;
  height *= canvas.scale;
  if (isFeatured) {
    width *= 1.4;
    height *= 1.4;
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExhibitionMode) {
      onUpdateCanvas({ isFeatured: !isFeatured });
    }
  };

  return (
    <motion.div
      className={clsx("absolute flex flex-col items-center group", isExhibitionMode ? "" : "cursor-grab active:cursor-grabbing")}
      style={{
        left: '50%', top: '50%',
        x: canvas.x, y: canvas.y,
        width, height,
        zIndex: canvas.zIndex || 1
      }}
      drag={!isExhibitionMode}
      dragMomentum={false}
      onDragEnd={(_, info) => onDragEnd(info)}
      whileHover={!isExhibitionMode ? { zIndex: 50 } : undefined}
      onDoubleClick={handleDoubleClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className={clsx(
        "relative w-full h-full shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-sm overflow-hidden bg-bg-elevated border",
        isFeatured ? "border-text-primary ring-2 ring-text-primary/20" : "border-border-subtle"
      )}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover pointer-events-none" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full bg-bg-secondary flex items-center justify-center p-6 text-center">
            <span className="font-serif italic text-text-primary">{item.title}</span>
          </div>
        )}
        
        {/* Exhibition Label */}
        {isExhibitionMode ? (
          <div className="absolute -bottom-8 left-0 right-0 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            <span className="text-[10px] uppercase tracking-widest text-text-primary font-medium">{item.title}</span>
            <span className="text-[8px] uppercase tracking-widest text-text-secondary">{item.type}</span>
          </div>
        ) : (
          <div className="absolute -bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-[9px] uppercase tracking-widest text-text-primary bg-bg-elevated/90 px-2 py-1 rounded backdrop-blur border border-border-subtle shadow-sm">
              {isFeatured ? 'Featured' : 'Dbl-Click to Feature'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
