import { create } from "zustand";
import type { Video } from "../types";

// Extended video type for streaming (may not have localPath)
export interface StreamingVideo {
  id: string;
  title: string;
  channelTitle: string;
  duration: number;
  thumbnailUrl?: string;
  localPath?: string; // undefined when streaming
}

interface PlaybackStore {
  // Current playlist context
  playlistId: string | null;
  playlistTitle: string | null;
  playlistVideos: StreamingVideo[];
  currentIndex: number;

  // Streaming state
  streamServerUrl: string | null;
  isStreaming: boolean;

  // Actions
  startPlaylist: (
    playlistId: string,
    title: string,
    videos: StreamingVideo[],
    startIndex?: number,
    serverUrl?: string
  ) => void;
  playNext: () => StreamingVideo | null;
  playPrevious: () => StreamingVideo | null;
  clearPlaylist: () => void;
  hasNext: () => boolean;
  hasPrevious: () => boolean;
  getCurrentVideo: () => StreamingVideo | null;
  setCurrentIndex: (index: number) => void;
  getStreamUrl: (videoId: string) => string | null;
}

export const usePlaybackStore = create<PlaybackStore>()((set, get) => ({
  playlistId: null,
  playlistTitle: null,
  playlistVideos: [],
  currentIndex: 0,
  streamServerUrl: null,
  isStreaming: false,

  startPlaylist: (playlistId, title, videos, startIndex = 0, serverUrl) => {
    const hasLocalVideos = videos.some((v) => v.localPath);
    set({
      playlistId,
      playlistTitle: title,
      playlistVideos: videos,
      currentIndex: startIndex,
      streamServerUrl: serverUrl ?? null,
      isStreaming: !!serverUrl && !hasLocalVideos,
    });
  },

  playNext: () => {
    const { playlistVideos, currentIndex } = get();
    if (currentIndex < playlistVideos.length - 1) {
      const nextIndex = currentIndex + 1;
      set({ currentIndex: nextIndex });
      return playlistVideos[nextIndex];
    }
    return null;
  },

  playPrevious: () => {
    const { playlistVideos, currentIndex } = get();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      set({ currentIndex: prevIndex });
      return playlistVideos[prevIndex];
    }
    return null;
  },

  clearPlaylist: () => {
    set({
      playlistId: null,
      playlistTitle: null,
      playlistVideos: [],
      currentIndex: 0,
      streamServerUrl: null,
      isStreaming: false,
    });
  },

  hasNext: () => {
    const { playlistVideos, currentIndex } = get();
    return currentIndex < playlistVideos.length - 1;
  },

  hasPrevious: () => {
    const { currentIndex } = get();
    return currentIndex > 0;
  },

  getCurrentVideo: () => {
    const { playlistVideos, currentIndex } = get();
    return playlistVideos[currentIndex] ?? null;
  },

  setCurrentIndex: (index) => {
    const { playlistVideos } = get();
    if (index >= 0 && index < playlistVideos.length) {
      set({ currentIndex: index });
    }
  },

  getStreamUrl: (videoId) => {
    const { streamServerUrl } = get();
    if (!streamServerUrl) return null;
    return `${streamServerUrl}/api/video/${videoId}/file`;
  },
}));
