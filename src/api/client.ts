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

const pendingRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache

export const apiClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  // Only deduplicate and cache GET requests
  const isGet = !config.method || config.method.toUpperCase() === 'GET';
  const cacheKey = isGet ? endpoint : null;

  // 1. Return pending request if it exists
  if (cacheKey && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // 2. Return valid cached response immediately to save network request
  if (cacheKey && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.data as T);
    }
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(endpoint, config);
      
      // Attempt to parse JSON response
      const rawData = await response.json().catch(() => null);
      const data = rawData ? keysToCamel(rawData) : null;

      if (!response.ok) {
        if (data && data.error) {
          throw new APIError(data.error.code, data.error.message);
        }
        throw new Error(response.statusText || 'An unknown error occurred');
      }

      // Update cache on success
      if (cacheKey) {
        responseCache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data as T;
    } catch (error) {
      // Graceful Fallback: If network fails but we have stale cache, return it
      if (cacheKey && responseCache.has(cacheKey)) {
        console.warn(`[apiClient] Network request to ${endpoint} failed, falling back to stale cache. Error:`, error);
        return responseCache.get(cacheKey)!.data as T;
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
