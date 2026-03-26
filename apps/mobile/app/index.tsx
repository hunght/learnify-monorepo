import { Redirect, type Href } from "expo-router";
import { getAppSurface } from "../core/hooks/useAppSurface";

export default function AppIndex() {
  return <Redirect href={(getAppSurface() === "tv" ? "/(tv)" : "/(mobile)") as Href} />;
}
