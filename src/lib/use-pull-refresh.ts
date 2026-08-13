import { useCallback } from "react";

type RefetchFn = () => Promise<unknown>;

export function usePullRefresh(refetchFns: RefetchFn[], refreshing: boolean) {
  const onRefresh = useCallback(() => {
    if (refreshing) return Promise.resolve();
    return Promise.all(refetchFns.map((fn) => fn().catch(() => undefined)));
  }, [refetchFns, refreshing]);

  return { refreshing, onRefresh };
}

export const REFRESH_TINT = "#52634c";
export const REFRESH_COLORS = ["#52634c"];
