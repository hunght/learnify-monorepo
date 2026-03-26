import { useEffect, useState } from "react";
import { runMigrations } from "../db/migrate";

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await runMigrations();
        setIsReady(true);
      } catch (err) {
        console.error("[useDatabase] Failed to initialize database:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }

    init();
  }, []);

  return { isReady, error };
}
