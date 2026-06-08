'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { User } from '@/lib/types';

/**
 * Hook to manage and detect the current user's profile and roles.
 * Includes a hardcoded fallback for the primary admin email to ensure 
 * administrative access is granted even during profile sync latency.
 */
export function useProfile() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, loading: profileLoading } = useDoc<User>(userDocRef);

  // Hardcoded fallback for the primary admin account
  const isHardcodedAdmin = user?.email?.toLowerCase() === "admin@rentflow.com";
  
  // Role detection from Firestore
  const isFirestoreAdmin = profile?.role === 'super-admin';

  // We are "loading" if the Auth state or the Firestore document is pending
  const isLoading = userLoading || (!!user && profileLoading);

  return {
    profile,
    user,
    loading: isLoading,
    isAdmin: isHardcodedAdmin || isFirestoreAdmin
  };
}
