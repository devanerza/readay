import { useCallback } from "react";
import { Colors } from "../constants/colors";

type RefetchFn = () => Promise<unknown>;

export function usePullRefresh(refetchFns: RefetchFn[], refreshing: boolean) {
  const onRefresh = useCallback(() => {
    if (refreshing) return Promise.resolve();
    return Promise.all(refetchFns.map((fn) => fn().catch(() => undefined)));
  }, [refetchFns, refreshing]);

  return { refreshing, onRefresh };
}

export const REFRESH_TINT = Colors.primary;
export const REFRESH_COLORS = [Colors.primary];
