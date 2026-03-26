import { create } from "zustand";
import type { DiscoveredPeer, PeerVideo, TransferProgress } from "../types";

type SharingMode = "idle" | "sharing" | "receiving";

interface SharingStore {
  // Mode
  mode: SharingMode;
  setMode: (mode: SharingMode) => void;

  // Sender state
  isSharing: boolean;
  sharedVideoIds: string[];
  serverPort: number | null;
  setSharing: (isSharing: boolean, port?: number) => void;
  setSharedVideoIds: (ids: string[]) => void;

  // Receiver state
  isScanning: boolean;
  discoveredPeers: DiscoveredPeer[];
  selectedPeer: DiscoveredPeer | null;
  peerVideos: PeerVideo[];
  transfers: TransferProgress[];
  setScanning: (isScanning: boolean) => void;
  addPeer: (peer: DiscoveredPeer) => void;
  removePeer: (name: string) => void;
  clearPeers: () => void;
  selectPeer: (peer: DiscoveredPeer | null) => void;
  setPeerVideos: (videos: PeerVideo[]) => void;
  addTransfer: (transfer: TransferProgress) => void;
  updateTransfer: (videoId: string, updates: Partial<TransferProgress>) => void;
  clearTransfers: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  mode: "idle" as SharingMode,
  isSharing: false,
  sharedVideoIds: [],
  serverPort: null,
  isScanning: false,
  discoveredPeers: [],
  selectedPeer: null,
  peerVideos: [],
  transfers: [],
};

export const useSharingStore = create<SharingStore>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  setSharing: (isSharing, port) =>
    set({
      isSharing,
      serverPort: port ?? null,
      mode: isSharing ? "sharing" : "idle",
    }),

  setSharedVideoIds: (ids) => set({ sharedVideoIds: ids }),

  setScanning: (isScanning) =>
    set({
      isScanning,
      mode: isScanning ? "receiving" : "idle",
    }),

  addPeer: (peer) =>
    set((state) => {
      const existing = state.discoveredPeers.find((p) => p.name === peer.name);
      if (existing) {
        return {
          discoveredPeers: state.discoveredPeers.map((p) =>
            p.name === peer.name ? peer : p
          ),
        };
      }
      return { discoveredPeers: [...state.discoveredPeers, peer] };
    }),

  removePeer: (name) =>
    set((state) => ({
      discoveredPeers: state.discoveredPeers.filter((p) => p.name !== name),
      selectedPeer:
        state.selectedPeer?.name === name ? null : state.selectedPeer,
    })),

  clearPeers: () => set({ discoveredPeers: [], selectedPeer: null }),

  selectPeer: (peer) => set({ selectedPeer: peer, peerVideos: [] }),

  setPeerVideos: (videos) => set({ peerVideos: videos }),

  addTransfer: (transfer) =>
    set((state) => ({
      transfers: [...state.transfers, transfer],
    })),

  updateTransfer: (videoId, updates) =>
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.videoId === videoId ? { ...t, ...updates } : t
      ),
    })),

  clearTransfers: () => set({ transfers: [] }),

  reset: () => set(initialState),
}));
