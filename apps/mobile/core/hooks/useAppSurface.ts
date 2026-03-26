import { Platform } from "react-native";
import type { AppSurface } from "../types/surface";

export function getAppSurface(): AppSurface {
  const forcedSurface = process.env.EXPO_PUBLIC_APP_SURFACE;
  if (forcedSurface === "tv" || forcedSurface === "mobile") {
    return forcedSurface;
  }
  return Platform.isTV ? "tv" : "mobile";
}
