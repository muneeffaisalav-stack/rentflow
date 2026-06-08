
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

  // We are "loading" if either the Auth state or the Firestore profile document is still being fetched.
  const isLoading = userLoading || (!!user && profileLoading);

  return {
    profile,
    user,
    loading: isLoading,
    isAdmin: profile?.role === 'super-admin'
  };
}
