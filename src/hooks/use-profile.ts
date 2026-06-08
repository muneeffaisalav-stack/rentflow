
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { User } from '@/lib/types';

export function useProfile() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc<User>(userDocRef);

  return {
    profile,
    user,
    loading: userLoading || profileLoading,
    isAdmin: profile?.role === 'super-admin'
  };
}
