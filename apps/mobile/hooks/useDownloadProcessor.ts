import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useDownloadStore } from "../stores/downloads";
import { useConnectionStore } from "../stores/connection";
import { downloadManager } from "../services/downloadManager";

const log = (message: string, data?: unknown) => {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 12);
  if (data) {
    console.log(`[${timestamp}] [DownloadProcessor] ${message}`, data);
  } else {
    console.log(`[${timestamp}] [DownloadProcessor] ${message}`);
  }
};

export function useDownloadProcessor() {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const queue = useDownloadStore((state) => state.queue);
  const serverUrl = useConnectionStore((state) => state.serverUrl);

  // Process queue when queue changes or server connects
  useEffect(() => {
    if (!serverUrl) {
      log("No server URL, skipping queue processing");
      return;
    }

    if (appStateRef.current !== "active") {
      log("App not active, skipping queue processing");
      return;
    }

    const queuedCount = queue.filter((d) => d.status === "queued").length;
    const activeCount = queue.filter((d) => d.status === "downloading").length;

    if (queuedCount > 0 || activeCount > 0) {
      log(`Queue state: ${queuedCount} queued, ${activeCount} downloading`);
      downloadManager.processQueue();
    }
  }, [queue, serverUrl]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      log(`App state changed: ${appStateRef.current} -> ${nextAppState}`);

      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App became active - resume queue processing
        log("App became active, resuming downloads");
        downloadManager.processQueue();
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Initial queue processing on mount
  useEffect(() => {
    log("Download processor initialized");

    // Process any items that were queued (or reset from downloading) on restart
    const queuedCount = useDownloadStore
      .getState()
      .queue.filter((d) => d.status === "queued").length;
    if (queuedCount > 0) {
      log(`Found ${queuedCount} queued items on mount`);
      downloadManager.processQueue();
    }
  }, []);
}
