import { useMemo } from "react";
import { useLibraryStore } from "../../stores/library";
import type { TVLibraryVideoItem } from "../types/surface";

export function useLibraryCatalog() {
  const videos = useLibraryStore((state) => state.videos);

  const offlineVideos: TVLibraryVideoItem[] = useMemo(
    () =>
      videos
        .filter((item) => !!item.localPath)
        .map((item) => ({
          id: item.id,
          title: item.title,
          channelTitle: item.channelTitle,
          duration: item.duration,
          thumbnailUrl: item.thumbnailUrl,
        })),
    [videos]
  );

  return {
    videos,
    offlineVideos,
  };
}
