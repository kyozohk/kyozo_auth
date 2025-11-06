'use client';

import { useMemo, DependencyList } from 'react';

export function useMemoFirebase<T extends object>(factory: () => T, deps: DependencyList | undefined): T {
    const memoized = useMemo(factory, deps) as T & { __memo?: boolean };
    if (memoized) {
        memoized.__memo = true;
    }
    return memoized;
}
