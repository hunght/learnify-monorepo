import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed";

export interface DownloadItem {
  videoId: string;
  title: string;
  channelTitle: string;
  duration: number;
  thumbnailUrl?: string;
  status: DownloadStatus;
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
  error?: string;
  retryCount: number;
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface DownloadStore {
  queue: DownloadItem[];
  maxConcurrent: number;

  // Selectors
  getDownload: (videoId: string) => DownloadItem | undefined;
  getActiveDownloads: () => DownloadItem[];
  getQueuedDownloads: () => DownloadItem[];
  getFailedDownloads: () => DownloadItem[];

  // Actions
  queueDownload: (
    videoId: string,
    meta: { title: string; channelTitle: string; duration: number; thumbnailUrl?: string }
  ) => void;
  updateDownload: (videoId: string, updates: Partial<DownloadItem>) => void;
  cancelDownload: (videoId: string) => void;
  retryDownload: (videoId: string) => void;
  removeDownload: (videoId: string) => void;
  clearCompleted: () => void;
  clearFailed: () => void;
  markDownloading: (videoId: string) => void;
  markCompleted: (videoId: string) => void;
  markFailed: (videoId: string, error: string) => void;
  incrementRetry: (videoId: string) => number;
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      queue: [],
      maxConcurrent: 2,

      getDownload: (videoId) => get().queue.find((d) => d.videoId === videoId),

      getActiveDownloads: () =>
        get().queue.filter((d) => d.status === "downloading"),

      getQueuedDownloads: () =>
        get().queue.filter((d) => d.status === "queued"),

      getFailedDownloads: () =>
        get().queue.filter((d) => d.status === "failed"),

      queueDownload: (videoId, meta) => {
        const existing = get().queue.find((d) => d.videoId === videoId);
        if (existing) {
          // If already exists and not completed, don't re-add
          if (existing.status !== "completed" && existing.status !== "failed") {
            return;
          }
          // Re-queue failed or completed downloads
          set((state) => ({
            queue: state.queue.map((d) =>
              d.videoId === videoId
                ? {
                    ...d,
                    status: "queued" as const,
                    progress: 0,
                    bytesDownloaded: 0,
                    error: undefined,
                    retryCount: 0,
                    addedAt: Date.now(),
                    startedAt: undefined,
                    completedAt: undefined,
                  }
                : d
            ),
          }));
          return;
        }

        const newItem: DownloadItem = {
          videoId,
          title: meta.title,
          channelTitle: meta.channelTitle,
          duration: meta.duration,
          thumbnailUrl: meta.thumbnailUrl,
          status: "queued",
          progress: 0,
          bytesDownloaded: 0,
          totalBytes: 0,
          retryCount: 0,
          addedAt: Date.now(),
        };

        set((state) => ({
          queue: [...state.queue, newItem],
        }));
      },

      updateDownload: (videoId, updates) =>
        set((state) => ({
          queue: state.queue.map((d) =>
            d.videoId === videoId ? { ...d, ...updates } : d
          ),
        })),

      cancelDownload: (videoId) =>
        set((state) => ({
          queue: state.queue.filter((d) => d.videoId !== videoId),
        })),

      retryDownload: (videoId) =>
        set((state) => ({
          queue: state.queue.map((d) =>
            d.videoId === videoId
              ? {
                  ...d,
                  status: "queued" as const,
                  progress: 0,
                  bytesDownloaded: 0,
                  error: undefined,
                  startedAt: undefined,
                }
              : d
          ),
        })),

      removeDownload: (videoId) =>
        set((state) => ({
          queue: state.queue.filter((d) => d.videoId !== videoId),
        })),

      clearCompleted: () =>
        set((state) => ({
          queue: state.queue.filter((d) => d.status !== "completed"),
        })),

      clearFailed: () =>
        set((state) => ({
          queue: state.queue.filter((d) => d.status !== "failed"),
        })),

      markDownloading: (videoId) =>
        set((state) => ({
          queue: state.queue.map((d) =>
            d.videoId === videoId
              ? { ...d, status: "downloading" as const, startedAt: Date.now() }
              : d
          ),
        })),

      markCompleted: (videoId) =>
        set((state) => ({
          queue: state.queue.map((d) =>
            d.videoId === videoId
              ? {
                  ...d,
                  status: "completed" as const,
                  progress: 100,
                  completedAt: Date.now(),
                }
              : d
          ),
        })),

      markFailed: (videoId, error) =>
        set((state) => ({
          queue: state.queue.map((d) =>
            d.videoId === videoId
              ? { ...d, status: "failed" as const, error }
              : d
          ),
        })),

      incrementRetry: (videoId) => {
        const item = get().queue.find((d) => d.videoId === videoId);
        const newCount = (item?.retryCount ?? 0) + 1;
        set((state) => ({
          queue: state.queue.map((d) =>
            d.videoId === videoId ? { ...d, retryCount: newCount } : d
          ),
        }));
        return newCount;
      },
    }),
    {
      name: "learnify-downloads",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist queue items, not transient state
        queue: state.queue.map((item) => ({
          ...item,
          // Reset downloading items to queued on app restart
          status:
            item.status === "downloading" ? ("queued" as const) : item.status,
        })),
      }),
    }
  )
);
