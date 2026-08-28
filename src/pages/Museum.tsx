import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Maximize } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { museumApi, Museum, MuseumRoom } from '../api/museum';

export function MuseumPage() {
  const [museum, setMuseum] = useState<Museum | null>(null);
  const [rooms, setRooms] = useState<MuseumRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { typography } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMuseum = async () => {
      try {
        const m = await museumApi.getMuseum();
        const r = await museumApi.getRooms();
        setMuseum(m);
        setRooms(r);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMuseum();
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-bg-base flex items-center justify-center typography-${typography}`}>
        <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary animate-pulse">Entering Museum...</span>
      </div>
    );
  }

  if (!museum) return null;

  return (
    <div className={`min-h-screen bg-[#FDFCF8] dark:bg-[#050505] text-[#1A1A1A] dark:text-[#FDFCF8] typography-${typography}`}>
      {/* Header */}
      <header className="px-6 md:px-12 pt-12 pb-8 flex justify-between items-center z-50 relative">
        <Link to="/profile/me" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity font-medium">
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>
        <span className="text-[9px] uppercase tracking-[0.4em] opacity-40 font-bold">Personal Archive</span>
      </header>

      {/* Museum Hero */}
      <main className="px-6 md:px-12 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 mt-12 max-w-4xl"
        >
          <h1 className="text-5xl md:text-8xl font-serif font-light mb-6 tracking-tight leading-none">{museum.title}</h1>
          <p className="text-lg md:text-xl text-text-secondary font-serif italic max-w-2xl leading-relaxed">{museum.description}</p>
        </motion.div>

        {/* Rooms Exhibition */}
        <div className="space-y-32">
          {rooms.map((room, idx) => (
            <motion.section 
              key={room.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="group relative cursor-pointer"
              onClick={() => navigate(`/museum/${room.id}`)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-center">
                {/* Room Metadata */}
                <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-[0.3em] opacity-50 mb-6 font-bold">
                    Room {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-serif mb-6">{room.collection_title}</h2>
                  <p className="text-text-secondary text-sm font-serif italic leading-relaxed mb-8">
                    {room.curator_note || room.collection_desc || 'Curated from your saved collections.'}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium text-text-primary hover:text-text-secondary transition-colors">
                    Enter Exhibition <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Room Preview / Cover */}
                <div className="lg:col-span-8 order-1 lg:order-2">
                  <div className="relative aspect-[16/9] bg-black/5 dark:bg-white/5 rounded-sm overflow-hidden group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-700">
                    {room.collection_cover ? (
                      <img 
                        src={room.collection_cover} 
                        alt={room.collection_title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-wrap content-start gap-1 p-4 opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700">
                        {room.items.slice(0, 15).map(item => (
                          item.image_url && <img key={item.content_id} src={item.image_url} className="w-16 h-16 object-cover rounded-sm" />
                        ))}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </main>
    </div>
  );
}
