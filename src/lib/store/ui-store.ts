import { create } from 'zustand';

type DashboardTab = 'bookmarks' | 'reviews' | 'settings';

type UIState = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  lastDashboardTab: DashboardTab;
  setLastDashboardTab: (tab: DashboardTab) => void;
};

export const useUIStore = create<UIState>((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  recentSearches: [],
  addRecentSearch: (query) =>
    set((state) => {
      const normalized = query.trim();
      if (!normalized) return state;

      const nextRecent = [normalized, ...state.recentSearches.filter((item) => item !== normalized)].slice(0, 8);
      return { recentSearches: nextRecent };
    }),
  clearRecentSearches: () => set({ recentSearches: [] }),
  lastDashboardTab: 'bookmarks',
  setLastDashboardTab: (tab) => set({ lastDashboardTab: tab })
}));
