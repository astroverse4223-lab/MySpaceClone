"use client";

import { useCallback, useInsertionEffect, useRef } from "react";

/**
 * Returns a stable function identity that always calls the latest callback.
 * Handy for game loops where we want a stable dependency for effects.
 */
export function useCallbackRef<A extends unknown[], R>(callback: (...args: A) => R): (...args: A) => R {
  const ref = useRef(callback);
  useInsertionEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
