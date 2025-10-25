import {create} from "zustand";
import axios from "../api/axiosClient";

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  logout: async () => {
    await axios.post("/auth/logout");
    set({ user: null });
  },
  fetchMe: async () => {
    try {
      const res = await axios.get("/auth/me");
      set({ user: res.data.user });
    } catch (err) {
      set({ user: null });
    }
  }
}));