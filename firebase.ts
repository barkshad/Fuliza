import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: "fuliza-1be02.firebaseapp.com",
  projectId: "fuliza-1be02",
  storageBucket: "fuliza-1be02.firebasestorage.app",
  messagingSenderId: "130324853766",
  appId: "1:130324853766:web:271f3dbbb708395f147f87",
  measurementId: "G-8VXC50ERPF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };