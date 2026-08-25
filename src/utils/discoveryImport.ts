import { useSettingsStore } from '../store/useSettingsStore';
import { useStore } from '../store/useStore';
import { Post } from '../types';

import { jobsApi } from '../api/jobs';
import { contentApi } from '../api/content';

let currentJobId: string | null = null;
let pollInterval: NodeJS.Timeout | null = null;

export const pauseDiscoveryImport = async () => {
  if (currentJobId) {
    await jobsApi.pauseJob(currentJobId);
    useSettingsStore.getState().updateDiscoveryTask({ isPaused: true });
  }
};

export const resumeDiscoveryImport = async () => {
  if (currentJobId) {
    await jobsApi.resumeJob(currentJobId);
    useSettingsStore.getState().updateDiscoveryTask({ isPaused: false });
  }
};

export const cancelDiscoveryImport = async () => {
  if (currentJobId) {
    await jobsApi.cancelJob(currentJobId);
  }
  if (pollInterval) clearInterval(pollInterval);
  
  useSettingsStore.getState().updateDiscoveryTask({
    isActive: false,
    stage: null,
    progress: 0,
    itemsProcessed: 0,
    totalItems: 0,
    error: null,
  });
};

export const startDiscoveryImport = async (packId: string) => {
  if (useSettingsStore.getState().discoveryTask.isActive) return;

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

    const res = await jobsApi.startDiscoveryImport(packId);
    currentJobId = res.id;
    
    pollInterval = setInterval(async () => {
      try {
        const job = await jobsApi.getJob(currentJobId!);
        
        updateStore({
          progress: job.progress,
          itemsProcessed: job.processed_count,
          totalItems: job.total_count,
          stage: job.current_step as any,
          isPaused: job.status === 'paused'
        });
        
        if (job.status === 'completed') {
          clearInterval(pollInterval!);
          updateStore({ isActive: false, stage: null });
          
          // Re-fetch posts/discovery content to update UI
          const newContent = await contentApi.getAll('post', 100);
          useStore.setState({ posts: newContent as any });
        } else if (job.status === 'failed') {
          clearInterval(pollInterval!);
          updateStore({ isActive: false, error: job.error });
        }
      } catch (err) {
        console.error('Job polling error', err);
      }
    }, 1000);

  } catch (err: any) {
    updateStore({ error: err.message, isActive: false });
  }
};
