import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyCbjnJtMFtLHdXXcHMAFPaWVzugmrYCUZQ",
  authDomain: "mirrornet-xoott.firebaseapp.com",
  projectId: "mirrornet-xoott",
  storageBucket: "mirrornet-xoott.firebasestorage.app",
  messagingSenderId: "141983454224",
  appId: "1:141983454224:web:6465382addb0fb820e6695"
};

// Initialize Firebase only if it hasn't been initialized already
const apps = getApps();
const app = !apps.length ? initializeApp(firebaseConfig) : apps[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
