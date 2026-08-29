export class APIError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

const toCamel = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));

const keysToCamel = function(o: any): any {
  if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
    const n = {};
    Object.keys(o).forEach((k) => {
      (n as any)[toCamel(k)] = keysToCamel(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }
  return o;
};

// In-Memory Fast Cache
const pendingRequests = new Map<string, Promise<any>>();
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes fresh cache

// LocalStorage Persistent Cache for offline availability and 0ms instant cold starts
const STORAGE_PREFIX = 'imuse_api_cache_';

const getPersistentCache = (key: string): { data: any; timestamp: number } | null => {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return null;
};

const setPersistentCache = (key: string, data: any) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {}
};

const clearPersistentCache = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
};

export const apiClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  const isGet = !config.method || config.method.toUpperCase() === 'GET';

  // Invalidate cache immediately on data mutations (POST, PUT, PATCH, DELETE)
  if (!isGet) {
    memoryCache.clear();
    clearPersistentCache();
  }

  const cacheKey = isGet ? endpoint : null;

  // 1. Return in-flight pending promise if identical request is currently active
  if (cacheKey && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // 2. Return memory cache immediately if fresh
  if (cacheKey && memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.data as T);
    }
  }

  // 3. Check persistent storage for instant availability
  const persistent = cacheKey ? getPersistentCache(cacheKey) : null;
  if (persistent && cacheKey) {
    memoryCache.set(cacheKey, persistent);
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(endpoint, config);
      
      const rawData = await response.json().catch(() => null);
      const data = rawData ? keysToCamel(rawData) : null;

      if (!response.ok) {
        if (data && data.error) {
          throw new APIError(data.error.code, data.error.message);
        }
        throw new Error(response.statusText || 'An unknown error occurred');
      }

      // Update both memory and persistent cache
      if (cacheKey) {
        memoryCache.set(cacheKey, { data, timestamp: Date.now() });
        setPersistentCache(cacheKey, data);
      }

      return data as T;
    } catch (error) {
      // Graceful Offline / Stale Cache Fallback
      if (cacheKey) {
        const fallback = memoryCache.get(cacheKey) || persistent;
        if (fallback) {
          console.warn(`[apiClient] Network request to ${endpoint} failed, serving cached fallback data.`);
          return fallback.data as T;
        }
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      throw new Error(error instanceof Error ? error.message : 'Network error');
    } finally {
      if (cacheKey) {
        pendingRequests.delete(cacheKey);
      }
    }
  })();

  if (cacheKey) {
    pendingRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
};
