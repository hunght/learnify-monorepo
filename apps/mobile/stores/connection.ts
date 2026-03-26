import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ConnectionStore {
  serverUrl: string | null;
  serverName: string | null;
  lastConnected: number | null;
  setServerUrl: (url: string) => void;
  setServerName: (name: string) => void;
  disconnect: () => void;
  isConnected: () => boolean;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      serverUrl: null,
      serverName: null,
      lastConnected: null,

      setServerUrl: (url) =>
        set({
          serverUrl: url,
          lastConnected: Date.now(),
        }),

      setServerName: (name) => set({ serverName: name }),

      disconnect: () =>
        set({
          serverUrl: null,
          serverName: null,
          lastConnected: null,
        }),

      isConnected: () => get().serverUrl !== null,
    }),
    {
      name: "learnify-connection",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
