import { create } from 'zustand';
import { Notification } from '../types/common';
import { generateId } from '../utils/helpers';

interface UIStore {
  // State
  currentStep: string;
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  isLoggedIn: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setCurrentStep: (step: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  setLoggedIn: (isLoggedIn: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  currentStep: 'overview',
  sidebarOpen: true,
  loading: false,
  error: null,
  notifications: [],
  isLoggedIn: false,
  theme: 'light',

  setCurrentStep: (step: string) => {
    set({ currentStep: step });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, 5000);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  markNotificationAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setLoggedIn: (isLoggedIn: boolean) => {
    set({ isLoggedIn });
  },

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
  },
}));
