import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpWj2-3DTZ-Sbxs8fAa57ir7T5CL0exzw",
  authDomain: "conquian-cb9a0.firebaseapp.com",
  databaseURL: "https://conquian-cb9a0-default-rtdb.firebaseio.com",
  projectId: "conquian-cb9a0",
  storageBucket: "conquian-cb9a0.firebasestorage.app",
  messagingSenderId: "781208803758",
  appId: "1:781208803758:web:5de283acd2e7481159503f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);
export default app;

