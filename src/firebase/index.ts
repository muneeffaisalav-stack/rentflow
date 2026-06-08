
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase app and core services.
 * Note: A change to this file triggers a deployment of Security Rules.
 * Explicitly triggering redeployment to ensure the 'super-admin' role defined 
 * in backend.json for /users, /properties, /tenants, and /invoices is correctly 
 * processed by the rule generator to allow global listing.
 * Latest trigger: Correcting Invoice permission errors for administrative users.
 */
export function initializeFirebase() {
  const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './firestore/use-memo-firebase';
