export type AppSurface = "mobile" | "tv";

export type PresenterState<TData> = {
  surface: AppSurface;
  isLoading: boolean;
  error: string | null;
  data: TData;
};

export interface TVLibraryVideoItem {
  id: string;
  title: string;
  channelTitle: string;
  duration: number;
  thumbnailUrl?: string | null;
}
