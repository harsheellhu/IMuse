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

export const apiClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  // Only deduplicate GET requests
  const isGet = !config.method || config.method.toUpperCase() === 'GET';
  const cacheKey = isGet ? endpoint : null;

  if (cacheKey && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
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

      return data as T;
    } catch (error) {
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
