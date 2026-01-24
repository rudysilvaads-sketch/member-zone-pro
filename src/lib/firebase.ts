import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCrRyM_pZs-cfNnbOBR-UjqLHGJs52sReo",
  authDomain: "lovableloja.firebaseapp.com",
  projectId: "lovableloja",
  storageBucket: "lovableloja.firebasestorage.app",
  messagingSenderId: "618755274709",
  appId: "1:618755274709:web:49c372c88f737614b12f5c",
  measurementId: "G-0MHKBG4DQ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
