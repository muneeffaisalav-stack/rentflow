'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Background component that ensures the user's Firestore profile is in sync 
 * with their Auth state. Automatically promotes 'admin@rentflow.com' to super-admin.
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
          // Create the user profile if it doesn't exist
          await setDoc(userRef, {
            id: user.uid,
            name: user.displayName || "User",
            email: user.email,
            role: targetRole,
            createdAt: new Date().toISOString(),
          });
        } else {
          // Force update to super-admin if the email matches but the role is outdated
          const currentData = userDoc.data();
          if (isAdminEmail && currentData.role !== "super-admin") {
            await updateDoc(userRef, { role: "super-admin" });
          }
        }
      } catch (error) {
        // Silently fail as this is a background maintenance task
        console.warn("Profile sync error:", error);
      }
    }
    sync();
  }, [user, db]);

  return null;
}
