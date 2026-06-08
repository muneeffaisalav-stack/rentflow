
'use client';

import { useEffect, useState } from 'react';
import { Query, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as T));
        setData(items);
        setLoading(false);
      },
      async (error) => {
        // Log the error internally and emit a contextual permission error
        // We try to extract a path hint from the query object if available
        const pathHint = (query as any)._query?.path?.segments?.join('/') || 'collection';
        
        const permissionError = new FirestorePermissionError({
          path: pathHint,
          operation: 'list',
        });
        
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading };
}
