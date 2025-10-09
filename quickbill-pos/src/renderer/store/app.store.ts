import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  language: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
  companyInfo: {
    name: string;
    address: string;
    gstNumber: string;
    phone: string;
    email: string;
  };
  user: {
    id: number;
    name: string;
    role: string;
    permissions: string[];
  } | null;
  settings: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    printerSettings: {
      enabled: boolean;
      name: string;
      paperSize: string;
    };
    barcodeScanner: {
      enabled: boolean;
      debounceTime: number;
    };
    notifications: {
      lowStock: boolean;
      newCustomer: boolean;
      dailyReport: boolean;
    };
  };
  toggleTheme: () => void;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  setDateFormat: (format: string) => void;
  setTimeZone: (timeZone: string) => void;
  setCompanyInfo: (info: Partial<AppState['companyInfo']>) => void;
  setUser: (user: AppState['user']) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppState['settings'] = {
  autoBackup: true,
  backupFrequency: 'daily',
  printerSettings: {
    enabled: false,
    name: '',
    paperSize: 'A4',
  },
  barcodeScanner: {
    enabled: true,
    debounceTime: 100,
  },
  notifications: {
    lowStock: true,
    newCustomer: true,
    dailyReport: false,
  },
};

const defaultCompanyInfo: AppState['companyInfo'] = {
  name: 'QuickBill POS',
  address: '',
  gstNumber: '',
  phone: '',
  email: '',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      currency: '₹',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Asia/Kolkata',
      companyInfo: defaultCompanyInfo,
      user: null,
      settings: defaultSettings,

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },

      setLanguage: (language) => {
        set({ language });
      },

      setCurrency: (currency) => {
        set({ currency });
      },

      setDateFormat: (format) => {
        set({ dateFormat: format });
      },

      setTimeZone: (timeZone) => {
        set({ timeZone });
      },

      setCompanyInfo: (info) => {
        set((state) => ({
          companyInfo: { ...state.companyInfo, ...info },
        }));
      },

      setUser: (user) => {
        set({ user });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({
          settings: defaultSettings,
          companyInfo: defaultCompanyInfo,
        });
      },
    }),
    {
      name: 'quickbill-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        dateFormat: state.dateFormat,
        timeZone: state.timeZone,
        companyInfo: state.companyInfo,
        settings: state.settings,
      }),
    }
  )
);