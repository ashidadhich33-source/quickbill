import { useState, useEffect, useCallback } from 'react';

interface DatabaseHook {
  loading: boolean;
  error: string | null;
  executeQuery: (query: string, params?: any[]) => Promise<any>;
  executeTransaction: (queries: Array<{ query: string; params?: any[] }>) => Promise<any>;
}

export const useDatabase = (): DatabaseHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async (query: string, params: any[] = []) => {
    setLoading(true);
    setError(null);

    try {
      // This would call the appropriate electron API based on query type
      // For now, we'll simulate the API calls
      const result = await window.electronAPI.executeQuery(query, params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeTransaction = useCallback(async (queries: Array<{ query: string; params?: any[] }>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.executeTransaction(queries);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    executeQuery,
    executeTransaction,
  };
};

// Hook for specific database operations
export const useItems = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (searchTerm: string = '') => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.searchItems(searchTerm);
      if (result.success) {
        setItems(result.data || []);
      } else {
        setError(result.error || 'Failed to load items');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load items';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = useCallback(async (itemData: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.createItem(itemData);
      if (result.success) {
        await loadItems(); // Reload items
        return result;
      } else {
        setError(result.error || 'Failed to create item');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const updateItem = useCallback(async (id: number, itemData: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.updateItem(id, itemData);
      if (result.success) {
        await loadItems(); // Reload items
        return result;
      } else {
        setError(result.error || 'Failed to update item');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.deleteItem(id);
      if (result.success) {
        await loadItems(); // Reload items
        return result;
      } else {
        setError(result.error || 'Failed to delete item');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
  };
};

// Hook for customers
export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async (searchTerm: string = '') => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.searchCustomers(searchTerm);
      if (result.success) {
        setCustomers(result.data || []);
      } else {
        setError(result.error || 'Failed to load customers');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (customerData: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.createCustomer(customerData);
      if (result.success) {
        await loadCustomers(); // Reload customers
        return result;
      } else {
        setError(result.error || 'Failed to create customer');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadCustomers]);

  const updateCustomer = useCallback(async (id: number, customerData: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.updateCustomer(id, customerData);
      if (result.success) {
        await loadCustomers(); // Reload customers
        return result;
      } else {
        setError(result.error || 'Failed to update customer');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadCustomers]);

  const deleteCustomer = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.deleteCustomer(id);
      if (result.success) {
        await loadCustomers(); // Reload customers
        return result;
      } else {
        setError(result.error || 'Failed to delete customer');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadCustomers]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    loading,
    error,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};

// Hook for sales
export const useSales = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = date 
        ? await window.electronAPI.getSalesByDate(date)
        : await window.electronAPI.getAllSales();
      
      if (result.success) {
        setSales(result.data || []);
      } else {
        setError(result.error || 'Failed to load sales');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sales';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSale = useCallback(async (saleData: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.createSale(saleData);
      if (result.success) {
        await loadSales(); // Reload sales
        return result;
      } else {
        setError(result.error || 'Failed to create sale');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sale';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadSales]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales,
    loading,
    error,
    loadSales,
    createSale,
  };
};