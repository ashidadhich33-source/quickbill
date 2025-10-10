import { useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from 'lodash';

interface PerformanceOptions {
  debounceMs?: number;
  maxItems?: number;
  enableVirtualization?: boolean;
  enableMemoization?: boolean;
}

export function usePerformanceOptimization(options: PerformanceOptions = {}) {
  const {
    debounceMs = 300,
    maxItems = 1000,
    enableVirtualization = true,
    enableMemoization = true
  } = options;

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string, callback: (term: string) => void) => {
      callback(searchTerm);
    }, debounceMs),
    [debounceMs]
  );

  // Memoized data processing
  const processData = useCallback(
    (data: any[], processor: (item: any) => any) => {
      if (!enableMemoization) {
        return data.map(processor);
      }
      
      return useMemo(() => data.map(processor), [data, processor]);
    },
    [enableMemoization]
  );

  // Optimized filtering
  const filterData = useCallback(
    (data: any[], filters: Record<string, any>) => {
      if (!filters || Object.keys(filters).length === 0) {
        return data;
      }

      return data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === null || value === undefined || value === '') {
            return true;
          }
          
          if (typeof value === 'string') {
            return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
          }
          
          if (typeof value === 'number') {
            return item[key] === value;
          }
          
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          
          return item[key] === value;
        });
      });
    },
    []
  );

  // Optimized sorting
  const sortData = useCallback(
    (data: any[], sortKey: string, sortOrder: 'asc' | 'desc' = 'asc') => {
      return [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    },
    []
  );

  // Pagination helper
  const paginateData = useCallback(
    (data: any[], page: number, pageSize: number) => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: data.slice(startIndex, endIndex),
        totalPages: Math.ceil(data.length / pageSize),
        totalItems: data.length,
        currentPage: page,
        pageSize
      };
    },
    []
  );

  // Virtual scrolling helper
  const getVirtualScrollItems = useCallback(
    (data: any[], scrollTop: number, itemHeight: number, containerHeight: number) => {
      if (!enableVirtualization) {
        return { items: data, startIndex: 0, endIndex: data.length };
      }

      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        data.length
      );

      return {
        items: data.slice(startIndex, endIndex),
        startIndex,
        endIndex,
        totalHeight: data.length * itemHeight
      };
    },
    [enableVirtualization]
  );

  // Data caching
  const cacheRef = useRef<Map<string, any>>(new Map());
  
  const getCachedData = useCallback(
    (key: string, fetcher: () => any) => {
      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key);
      }
      
      const data = fetcher();
      cacheRef.current.set(key, data);
      return data;
    },
    []
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Memory management
  useEffect(() => {
    const cleanup = () => {
      clearCache();
    };

    return cleanup;
  }, [clearCache]);

  // Performance monitoring
  const measurePerformance = useCallback(
    (name: string, fn: () => void) => {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
    },
    []
  );

  // Batch operations
  const batchProcess = useCallback(
    (items: any[], batchSize: number, processor: (batch: any[]) => void) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        processor(batch);
      }
    },
    []
  );

  // Lazy loading
  const useLazyLoading = useCallback(
    (loadMore: () => void, hasMore: boolean, threshold: number = 100) => {
      const observerRef = useRef<IntersectionObserver | null>(null);
      const loadingRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              loadMore();
            }
          },
          { threshold: 0.1 }
        );

        if (loadingRef.current) {
          observer.observe(loadingRef.current);
        }

        observerRef.current = observer;

        return () => {
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        };
      }, [loadMore, hasMore]);

      return loadingRef;
    },
    []
  );

  // Data compression for large datasets
  const compressData = useCallback(
    (data: any[]) => {
      if (data.length <= maxItems) {
        return data;
      }

      // Simple compression by removing unnecessary fields
      return data.map(item => {
        const compressed = { ...item };
        delete compressed.created_at;
        delete compressed.updated_at;
        return compressed;
      });
    },
    [maxItems]
  );

  // Search optimization
  const optimizedSearch = useCallback(
    (data: any[], searchTerm: string, searchFields: string[]) => {
      if (!searchTerm) return data;

      const term = searchTerm.toLowerCase();
      
      return data.filter(item => 
        searchFields.some(field => 
          item[field]?.toString().toLowerCase().includes(term)
        )
      );
    },
    []
  );

  // Index-based operations
  const createIndex = useCallback(
    (data: any[], key: string) => {
      const index = new Map();
      data.forEach((item, idx) => {
        const value = item[key];
        if (!index.has(value)) {
          index.set(value, []);
        }
        index.get(value).push(idx);
      });
      return index;
    },
    []
  );

  const getByIndex = useCallback(
    (data: any[], index: Map<any, number[]>, key: string, value: any) => {
      const indices = index.get(value) || [];
      return indices.map(idx => data[idx]);
    },
    []
  );

  return {
    debouncedSearch,
    processData,
    filterData,
    sortData,
    paginateData,
    getVirtualScrollItems,
    getCachedData,
    clearCache,
    measurePerformance,
    batchProcess,
    useLazyLoading,
    compressData,
    optimizedSearch,
    createIndex,
    getByIndex
  };
}

// Custom hook for virtual scrolling
export function useVirtualScrolling(
  data: any[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      data.length
    );

    return {
      items: data.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: data.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [data, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll
  };
}

// Custom hook for infinite scrolling
export function useInfiniteScroll(
  loadMore: () => void,
  hasMore: boolean,
  threshold: number = 100
) {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    await loadMore();
    setIsLoading(false);
  }, [loadMore, hasMore, isLoading]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, hasMore]);

  return {
    loadingRef,
    isLoading
  };
}