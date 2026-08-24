import React from 'react';
import Masonry from 'react-masonry-css';
import { PostCard } from './PostCard';
import { Post } from '../../types';
import { motion } from 'motion/react';

export function MasonryFeed({ posts }: { posts: Post[] }) {
  const breakpointColumnsObj = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };

  return (
    <div className="w-full px-4 md:px-12 py-12">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto md:-ml-12"
        columnClassName="pl-4 md:pl-12 bg-clip-padding"
      >
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </Masonry>
    </div>
  );
}
