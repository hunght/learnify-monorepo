import { useEffect, useRef } from "react";
import { usePathname, useSegments, useGlobalSearchParams } from "expo-router";
import { logger } from "../services/logger";

export function useNavigationLogger() {
  const pathname = usePathname();
  const segments = useSegments();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      logger.navigation(previousPathname.current, pathname, {
        segments,
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      previousPathname.current = pathname;
    }
  }, [pathname, segments, params]);
}
