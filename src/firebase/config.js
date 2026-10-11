import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDeK1nA0lXFA2dusnnAT8U-lpOqUELF0kw",
  authDomain: "barbernikeshop-d2cff.firebaseapp.com",
  projectId: "barbernikeshop-d2cff",
  storageBucket: "barbernikeshop-d2cff.firebasestorage.app",
  messagingSenderId: "649662719132",
  appId: "1:649662719132:web:53365cb1ae381c058db959"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
