/**
 * Firebase Configuration Example
 *
 * INSTRUCTIONS:
 * 1. Copy this file to firebase-config.js
 * 2. Replace the placeholder values with your actual Firebase config
 * 3. Get your config from: Firebase Console > Project Settings > Your apps > Web app
 *
 * IMPORTANT: Never commit firebase-config.js with real credentials to a public repo
 *
 * ============================================================================
 * SECURITY BEST PRACTICES
 * ============================================================================
 *
 * 1. API KEY RESTRICTIONS (Required)
 *    Firebase API keys are designed to be public in client-side applications,
 *    but you should still protect them:
 *
 *    a) Enable HTTP Referrer Restrictions:
 *       - Go to: https://console.cloud.google.com/apis/credentials
 *       - Click on your API key
 *       - Under "Application restrictions" > "HTTP referrers"
 *       - Add your domains: https://your-app.web.app/*
 *
 *    b) Enable API Restrictions:
 *       - In the same page, under "API restrictions"
 *       - Select "Restrict key"
 *       - Enable only: Firebase Auth, Cloud Firestore, Identity Toolkit
 *
 * 2. FIREBASE APP CHECK (Recommended)
 *    Protects backend resources from abuse:
 *
 *    a) Go to: Firebase Console > App Check
 *    b) Register your app with reCAPTCHA v3 (free)
 *    c) Get your reCAPTCHA site key
 *    d) Add the import and initialization code (see below)
 *
 * 3. MONITOR USAGE
 *    - Set up billing alerts in Google Cloud Console
 *    - Review Firebase Console > Usage regularly
 *    - Check for unusual read/write patterns
 *
 * 4. INCIDENT RESPONSE - If API key is abused:
 *    a) Check Firebase Console for unusual patterns
 *    b) Review Google Cloud Console API metrics
 *    c) Rotate the key:
 *       - Generate new key in Cloud Console
 *       - Update this config and deploy
 *       - Delete the old key
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================================================
// Uncomment to enable App Check (RECOMMENDED for production):
// ============================================================================
// import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';

// ============================================================================
// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
// Get from: Firebase Console > Project Settings > Your apps > Web app
// ============================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "G-YOUR_MEASUREMENT_ID"  // Optional
};
// ============================================================================

// Initialize Firebase
let app;
let auth;
let db;
let currentUser = null;

/**
 * Initialize Firebase app and services
 * @returns {Promise<Object>} Firebase instances
 */
export async function initializeFirebase() {
  try {
    console.log('[Firebase] Initializing...');

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // ========================================================================
    // APP CHECK INITIALIZATION (Uncomment for production)
    // ========================================================================
    // Protects your backend from abuse by verifying requests come from your app.
    // Requires reCAPTCHA v3 setup in Firebase Console > App Check
    //
    // if (typeof window !== 'undefined') {
    //   initializeAppCheck(app, {
    //     provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
    //     isTokenAutoRefreshEnabled: true
    //   });
    //   console.log('[Firebase] App Check initialized');
    // }
    // ========================================================================

    // Enable offline persistence
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

/**
 * Sign in anonymously
 * Creates a unique user ID without requiring any credentials
 *
 * NOTE: Anonymous auth has limitations:
 * - Data is lost if browser storage is cleared
 * - No recovery without account linking
 *
 * For persistent access, consider implementing account linking:
 *
 *   import { linkWithCredential, EmailAuthProvider } from 'firebase/auth';
 *
 *   async function linkAccount(email, password) {
 *     const credential = EmailAuthProvider.credential(email, password);
 *     await linkWithCredential(auth.currentUser, credential);
 *   }
 *
 * @returns {Promise<Object>} User object
 */
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

/**
 * Listen for auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
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

/**
 * Get current user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Get current user ID
 * @returns {string|null} User ID or null
 */
export function getUserId() {
  return currentUser?.uid || null;
}

/**
 * Get Firestore instance
 * @returns {Object} Firestore instance
 */
export function getDb() {
  return db;
}

/**
 * Get Auth instance
 * @returns {Object} Auth instance
 */
export function getAuthInstance() {
  return auth;
}

/**
 * Check if user is signed in
 * @returns {boolean}
 */
export function isSignedIn() {
  return currentUser !== null;
}

// Export instances for direct access
export { app, auth, db };
