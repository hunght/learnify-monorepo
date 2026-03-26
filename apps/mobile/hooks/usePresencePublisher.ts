import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useConnectionStore } from "../stores/connection";
import { publishPresence, unpublishService } from "../services/p2p/discovery";

/**
 * Hook that publishes mDNS presence when:
 * 1. The app is connected to a desktop server
 * 2. The app is in the foreground
 *
 * This allows the desktop to discover active mobile devices.
 */
export function usePresencePublisher() {
  const isConnected = useConnectionStore((state) => state.isConnected());
  const appState = useRef(AppState.currentState);
  const isPublished = useRef(false);

  useEffect(() => {
    const publish = () => {
      if (!isPublished.current) {
        console.log("[Presence] Publishing mDNS presence");
        publishPresence((error) => {
          console.error("[Presence] Failed to publish:", error);
        });
        isPublished.current = true;
      }
    };

    const unpublish = () => {
      if (isPublished.current) {
        console.log("[Presence] Unpublishing mDNS presence");
        unpublishService();
        isPublished.current = false;
      }
    };

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // App came to foreground
        if (isConnected) {
          publish();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        unpublish();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Initial publish if connected and in foreground
    if (isConnected && appState.current === "active") {
      publish();
    }

    return () => {
      subscription.remove();
      unpublish();
    };
  }, [isConnected]);
}
