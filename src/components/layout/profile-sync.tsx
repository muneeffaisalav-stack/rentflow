
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Component that ensures the user's Firestore profile is in sync with their Auth state.
 * Specifically handles auto-promotion of the designated admin email.
 */
export function ProfileSync() {
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    async function sync() {
      if (!user || !db) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        const isAdminEmail = user.email?.toLowerCase() === "admin@rentflow.com";
        const targetRole = isAdminEmail ? "super-admin" : "landlord";

        if (!userDoc.exists()) {
          // Create missing profile
          await setDoc(userRef, {
            id: user.uid,
            name: user.displayName || "User",
            email: user.email,
            role: targetRole,
            createdAt: new Date().toISOString()
          });
        } else {
          // Update existing profile if email is admin but role isn't
          const currentData = userDoc.data();
          if (isAdminEmail && currentData.role !== "super-admin") {
            await updateDoc(userRef, { role: "super-admin" });
          }
        }
      } catch (error) {
        // Silent fail as this is a background sync
        console.warn("Profile sync background check failed:", error);
      }
    }
    sync();
  }, [user, db]);

  return null;
}
