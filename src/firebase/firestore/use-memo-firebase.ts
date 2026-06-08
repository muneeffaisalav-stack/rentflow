'use client';

import { useMemo } from 'react';

/**
 * A simple hook to memoize Firebase queries or references.
 * Since Firebase objects are often recreated on setiap render if defined inline,
 * this hook ensures they are only recreated when their dependencies change.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
