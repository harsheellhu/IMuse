import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Layout } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { museumApi, MuseumRoom } from '../api/museum';
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
            const defaultX = (i % 5) * 200 - 400;
            const defaultY = Math.floor(i / 5) * 300 - 200;
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
      console.log('Canvas saved');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = (id: string, info: any) => {
    if (isExhibitionMode) return;
    setCanvasItems(prev => {
      const newItems = prev.map(item => {
        if (item.content_id === id) {
          return {
            ...item,
            canvas: { ...item.canvas, x: item.canvas.x + info.offset.x, y: item.canvas.y + info.offset.y }
          };
        }
        return item;
      });
      return newItems;
    });
  };

  // Debounce save when items change (simple version)
  useEffect(() => {
    if (!isLoading && canvasItems.length > 0 && !isExhibitionMode) {
      const t = setTimeout(handleSaveCanvas, 2000);
      return () => clearTimeout(t);
    }
  }, [canvasItems, isExhibitionMode]);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-bg-base flex items-center justify-center typography-${typography}`}>
        <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary animate-pulse">Preparing Room...</span>
      </div>
    );
  }

  if (!room) return null;

  const currentIdx = allRooms.findIndex(r => r.id === roomId);
  const prevRoom = currentIdx > 0 ? allRooms[currentIdx - 1] : null;
  const nextRoom = currentIdx < allRooms.length - 1 ? allRooms[currentIdx + 1] : null;

  return (
    <div className={`fixed inset-0 bg-[#EFEFEF] dark:bg-[#0A0A0A] text-[#1A1A1A] dark:text-[#FDFCF8] overflow-hidden typography-${typography}`}>
      
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
              <Link to="/museum" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium hover:opacity-70 transition-opacity">
                <ArrowLeft className="w-4 h-4" /> Museum
              </Link>
              <div className="h-4 w-px bg-current opacity-20" />
              <span className="text-xs font-serif italic opacity-60">Room {(currentIdx + 1).toString().padStart(2, '0')} — {room.collection_title}</span>
            </div>

            <div className="pointer-events-auto">
              <button 
                onClick={() => setIsExhibitionMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black/80 transition-colors shadow-sm"
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
          dragElastic={0.1}
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
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-[600px] -translate-y-1/2 max-w-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-[9px] uppercase tracking-[0.4em] opacity-40 font-bold mb-8 block">
              Room {(currentIdx + 1).toString().padStart(2, '0')}
            </span>
            <h1 className="text-6xl font-serif font-light mb-6 leading-none">{room.collection_title}</h1>
            <p className="text-sm font-serif italic opacity-60 leading-relaxed">{room.curator_note || room.collection_desc}</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Exhibition Exit Overlay */}
      {isExhibitionMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => setIsExhibitionMode(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-colors"
          >
            <Layout className="w-3.5 h-3.5" /> Edit Room
          </button>
        </div>
      )}

      {/* Room Navigation */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8">
        {prevRoom ? (
          <button onClick={() => navigate(`/museum/${prevRoom.id}`)} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <ChevronLeft className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : <div className="w-12" />}

        {nextRoom ? (
          <button onClick={() => navigate(`/museum/${nextRoom.id}`)} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <ChevronRight className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : <div className="w-12" />}
      </div>

    </div>
  );
}

// ----------------------------------------------------------------------

function CanvasItemNode({ item, isExhibitionMode, onDragEnd, onUpdateCanvas }: { key?: React.Key, item: any, isExhibitionMode: boolean, onDragEnd: (info: any) => void, onUpdateCanvas: (updates: any) => void }) {
  const { canvas } = item;
  const isFeatured = canvas.isFeatured;
  
  // Base dimensions
  let width = 240;
  let height = 360;
  if (item.type === 'book') { width = 200; height = 300; }
  if (item.type === 'film' || item.type === 'tv_show') { width = 240; height = 360; }
  if (item.type === 'place') { width = 400; height = 250; }
  if (item.type === 'post') { width = 280; height = 280; }

  // Apply scale
  width *= canvas.scale;
  height *= canvas.scale;
  if (isFeatured) {
    width *= 1.5;
    height *= 1.5;
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
        "relative w-full h-full shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500",
        isFeatured ? "ring-1 ring-black/10 dark:ring-white/10" : ""
      )}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center p-6 text-center">
            <span className="font-serif italic">{item.title}</span>
          </div>
        )}
        
        {/* Exhibition Label */}
        {isExhibitionMode ? (
          <div className="absolute -bottom-8 left-0 right-0 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            <span className="text-[10px] uppercase tracking-widest text-text-primary/70">{item.title}</span>
            <span className="text-[8px] uppercase tracking-widest text-text-secondary/50">{item.type}</span>
          </div>
        ) : (
          <div className="absolute -bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40 bg-white/80 dark:bg-black/80 px-2 py-1 rounded backdrop-blur">
              {isFeatured ? 'Featured' : 'Dbl-Click to Feature'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
