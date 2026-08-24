import { useSettingsStore } from '../store/useSettingsStore';
import { useStore } from '../store/useStore';
import { Post } from '../types';

let abortController: AbortController | null = null;
let isPausedRef = false;
let pausePromiseResolve: ((value: unknown) => void) | null = null;

// Helper to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for pausing
const checkPause = async () => {
  if (isPausedRef) {
    await new Promise(resolve => {
      pausePromiseResolve = resolve;
    });
  }
};

export const pauseDiscoveryImport = () => {
  isPausedRef = true;
  useSettingsStore.getState().updateDiscoveryTask({ isPaused: true });
};

export const resumeDiscoveryImport = () => {
  isPausedRef = false;
  useSettingsStore.getState().updateDiscoveryTask({ isPaused: false });
  if (pausePromiseResolve) {
    pausePromiseResolve(null);
    pausePromiseResolve = null;
  }
};

export const cancelDiscoveryImport = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  useSettingsStore.getState().updateDiscoveryTask({
    isActive: false,
    stage: null,
    progress: 0,
    itemsProcessed: 0,
    totalItems: 0,
    error: null,
  });
  isPausedRef = false;
  if (pausePromiseResolve) {
    pausePromiseResolve(null);
    pausePromiseResolve = null;
  }
};

// Generate some mock data based on the pack requested
function generateMockData(packId: string, count: number): Partial<Post>[] {
  const items: Partial<Post>[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `${packId}-${Date.now()}-${i}`,
      title: `${packId.charAt(0).toUpperCase() + packId.slice(1)} Inspiration #${i + 1}`,
      image: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800&sig=${Math.random()}`,
      content: 'Imported from Discovery Pack.',
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 50),
      createdAt: new Date().toISOString(),
      userId: 'discovery',
    } as any);
  }
  return items;
}

export const startDiscoveryImport = async (packId: string) => {
  if (useSettingsStore.getState().discoveryTask.isActive) return;

  abortController = new AbortController();
  const signal = abortController.signal;
  isPausedRef = false;
  pausePromiseResolve = null;
  
  const updateStore = useSettingsStore.getState().updateDiscoveryTask;
  
  try {
    updateStore({
      isActive: true,
      packName: packId.charAt(0).toUpperCase() + packId.slice(1),
      stage: 'preparing',
      progress: 0,
      itemsProcessed: 0,
      error: null,
      isPaused: false
    });

    await checkPause();
    if (signal.aborted) throw new Error('aborted');

    // 1. Fetch metadata (Simulated real delay)
    updateStore({ stage: 'fetching', progress: 5 });
    await delay(1500); 
    
    // Determine item count based on pack
    let count = 100;
    if (packId === 'architecture') count = 500;
    if (packId === 'cinema') count = 1200;
    
    updateStore({ totalItems: count });
    
    await checkPause();
    if (signal.aborted) throw new Error('aborted');

    // 2. Downloading & Parsing (Generating data in chunks)
    updateStore({ stage: 'downloading', progress: 10 });
    
    const chunkCount = 10;
    const itemsPerChunk = Math.floor(count / chunkCount);
    let allGeneratedItems: Partial<Post>[] = [];
    
    for (let i = 0; i < chunkCount; i++) {
      await checkPause();
      if (signal.aborted) throw new Error('aborted');
      
      const chunk = generateMockData(packId, itemsPerChunk);
      allGeneratedItems = [...allGeneratedItems, ...chunk];
      
      // Simulate real processing time per chunk
      await delay(500); 
      
      const currentProgress = 10 + ((i + 1) / chunkCount) * 40; // up to 50%
      updateStore({ 
        progress: currentProgress,
        itemsProcessed: allGeneratedItems.length
      });
    }

    // 3. Extracting colors & Indexing (Simulate heavy CPU work)
    updateStore({ stage: 'extracting' });
    
    for (let i = 0; i < allGeneratedItems.length; i += 25) {
      await checkPause();
      if (signal.aborted) throw new Error('aborted');
      
      // Simulated processing
      const batch = allGeneratedItems.slice(i, i + 25);
      batch.forEach(item => {
        // "Extracting" fake color
        (item as any).dominantColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      });
      
      await delay(100); // 100ms per 25 items
      
      const currentProgress = 50 + ((i + 25) / allGeneratedItems.length) * 40; // up to 90%
      updateStore({ progress: Math.min(currentProgress, 90) });
    }

    await checkPause();
    if (signal.aborted) throw new Error('aborted');

    // 4. Finalizing
    updateStore({ stage: 'finalizing', progress: 95 });
    await delay(1000);
    
    // Insert into global store
    const { addPost } = useStore.getState();
    allGeneratedItems.reverse().forEach((item) => addPost(item as Post));

    updateStore({ progress: 100 });
    
    await delay(1000);
    
    updateStore({
      isActive: false,
      stage: null,
    });

  } catch (err: any) {
    if (err.message === 'aborted') {
      console.log('Import aborted by user.');
    } else {
      updateStore({ error: err.message, isActive: false });
    }
  }
};
