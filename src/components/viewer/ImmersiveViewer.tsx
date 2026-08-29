import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { useStore, ActiveViewerItem } from '../../store/useStore';
import { contentApi } from '../../api/content';
import { PostDetailViewer } from './PostDetailViewer';
import { UniverseGraphViewer } from '../discovery/UniverseGraphViewer';
import { CollectionCarouselViewer } from './CollectionCarouselViewer';

export function ImmersiveViewer() {
  const { activeViewerItem, openViewer, expandToUniverse, closeViewer } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize state with URL parameters on mount and popstate (Browser Back / Forward)
  useEffect(() => {
    const handleUrlSync = async () => {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const viewerId = params.get('viewer');
      const universeId = params.get('universe');
      const collectionId = params.get('collection');

      const activeId = universeId || collectionId || viewerId;

      if (!activeId) {
        if (activeViewerItem) {
          useStore.setState({ activeViewerItem: null });
        }
        return;
      }

      // Check if already in sync
      if (activeViewerItem && activeViewerItem.id === activeId) {
        const expectedMode = universeId ? 'universe' : collectionId ? 'collection' : 'detail';
        if (activeViewerItem.mode === expectedMode) return;
      }

      // Look up content from existing store
      const state = useStore.getState();
      const allStoreItems: any[] = [
        ...state.places,
        ...state.posts,
        ...state.books,
        ...state.films,
        ...state.tvShows,
        ...state.collections
      ];
      const match = allStoreItems.find(item => item && item.id === activeId);

      if (match) {
        const itemType = match.type || (match.itemCount !== undefined ? 'collection' : 'place');
        const mode = universeId ? 'universe' : collectionId ? 'collection' : 'detail';
        useStore.setState({
          activeViewerItem: {
            id: match.id,
            type: itemType,
            data: match,
            mode
          }
        });
        return;
      }

      // If not in store, fetch from API
      try {
        const fetched = await contentApi.getById(activeId);
        if (fetched) {
          const itemType = (fetched as any).type || 'place';
          const mode = universeId ? 'universe' : collectionId ? 'collection' : 'detail';
          useStore.setState({
            activeViewerItem: {
              id: fetched.id,
              type: itemType,
              data: fetched as any,
              mode
            }
          });
        }
      } catch (err) {
        console.error('[ImmersiveViewer] Failed to hydrate item from URL:', err);
      }
    };

    handleUrlSync();

    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div id="immersive-overlay-root" className="relative z-[1000]">
      <AnimatePresence mode="wait">
        {activeViewerItem?.mode === 'universe' && (
          <UniverseGraphViewer 
            key="universe-graph-viewer" 
            initialContentId={activeViewerItem.id} 
          />
        )}

        {activeViewerItem && (activeViewerItem.mode === 'collection' || activeViewerItem.type === 'collection') && activeViewerItem.mode !== 'universe' && (
          <CollectionCarouselViewer 
            key={`collection-${activeViewerItem.id}`} 
          />
        )}

        {activeViewerItem && activeViewerItem.mode === 'detail' && activeViewerItem.type !== 'collection' && (
          <PostDetailViewer 
            key={`detail-${activeViewerItem.id}`} 
          />
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
