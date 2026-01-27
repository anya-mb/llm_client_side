/**
 * Firebase Configuration EXAMPLE
 *
 * INSTRUCTIONS:
 * 1. Copy this file to firebase-config.js
 * 2. Replace the placeholder values with your actual Firebase config
 * 3. Get your config from: Firebase Console > Project Settings > Your apps > Web app
 *
 * IMPORTANT: Never commit firebase-config.js to git (it's in .gitignore)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================================================
// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
// ============================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",              // e.g., "AIzaSyB..."
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",              // e.g., "ai-chat-in-your-tab"
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",       // e.g., "123456789012"
  appId: "YOUR_APP_ID"                       // e.g., "1:123456789012:web:abc..."
};
// ============================================================================

// Initialize Firebase
let app;
let auth;
let db;
let currentUser = null;

export async function initializeFirebase() {
  try {
    console.log('[Firebase] Initializing...');

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    try {
      await enableIndexedDbPersistence(db);
      console.log('[Firebase] Offline persistence enabled');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Persistence not available in this browser');
      }
    }

    console.log('[Firebase] Initialized successfully');
    return { app, auth, db };
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    throw error;
  }
}

export async function signInAnonymousUser() {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  try {
    console.log('[Firebase] Signing in anonymously...');
    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    console.log('[Firebase] Signed in with UID:', currentUser.uid);
    return currentUser;
  } catch (error) {
    console.error('[Firebase] Anonymous sign-in error:', error);
    throw error;
  }
}

export function onAuthChange(callback) {
  if (!auth) {
    console.warn('[Firebase] Auth not initialized');
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
}

export function getCurrentUser() {
  return currentUser;
}

export function getUserId() {
  return currentUser?.uid || null;
}

export function getDb() {
  return db;
}

export function getAuthInstance() {
  return auth;
}

export function isSignedIn() {
  return currentUser !== null;
}

export { app, auth, db };
