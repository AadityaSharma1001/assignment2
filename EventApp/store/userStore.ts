import { create } from 'zustand';

type User = { id: string; name: string } | null;

interface UserStore {
  user: User;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
