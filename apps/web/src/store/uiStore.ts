import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarOpen: boolean;
  isAutoParagraph: boolean;
  showFooterModal: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setAutoParagraph: (enabled: boolean) => void;
  setShowFooterModal: (show: boolean) => void;
  openFooterModal: () => void;
  closeFooterModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isAutoParagraph: true, // 默认开启
      showFooterModal: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
      setAutoParagraph: (enabled: boolean) => set({ isAutoParagraph: enabled }),
      setShowFooterModal: (show: boolean) => set({ showFooterModal: show }),
      openFooterModal: () => set({ showFooterModal: true }),
      closeFooterModal: () => set({ showFooterModal: false }),
    }),
    {
      name: 'wemd-ui-storage',
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        isAutoParagraph: state.isAutoParagraph
      }),
    }
  )
);
