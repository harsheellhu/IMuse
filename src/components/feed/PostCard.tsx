import React from 'react';
import { Bookmark, Heart, MoreHorizontal, Plus } from 'lucide-react';
import { Post } from '../../types';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function PostCard({ post }: { key?: React.Key; post: Post }) {
  const { users, savedPostIds, toggleSavePost, openViewer, isAuthenticated, setAuthModalOpen } = useStore();
  const creator = users.find(u => u.id === post.creatorId);
  const isSaved = savedPostIds.has(post.id);
  const [imgSrc, setImgSrc] = React.useState(post.imageUrl);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      toggleSavePost(post.id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col mb-12 break-inside-avoid cursor-pointer"
      onClick={() => openViewer({ id: post.id, type: 'post', data: post })}
    >
      <div className="relative overflow-hidden bg-bg-secondary rounded-sm">
        <img 
          src={imgSrc} 
          alt={post.title} 
          className="w-full h-auto object-cover transform transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => setImgSrc('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400&auto=format&fit=crop')}
        />
        
        {/* Minimal Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 flex flex-col justify-between p-4">
          <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase">
              {post.category}
            </div>
            <button 
              onClick={handleSave}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 transform translate-y-2 group-hover:translate-y-0",
                isSaved ? "bg-text-primary text-bg-base" : "bg-bg-elevated/90 text-text-primary hover:bg-text-primary hover:text-bg-base"
              )}
            >
              {isSaved ? <Bookmark className="w-4 h-4" fill="currentColor" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <h3 className="font-medium text-sm leading-snug">{post.title}</h3>
        {creator && (
          <span className="text-xs text-gray-500">
            by {creator.name}
          </span>
        )}
      </div>
    </motion.div>
  );
}
