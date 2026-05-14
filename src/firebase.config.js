import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDTcB4gyYbPW7ZqWrGjIpNqxdNEJOL1Px4",
  authDomain: "vaultx-aggregator.firebaseapp.com",
  projectId: "vaultx-aggregator",
  storageBucket: "vaultx-aggregator.firebasestorage.app",
  messagingSenderId: "657703066187",
  appId: "1:657703066187:web:bcc968d0e6717957bfcbce",
  measurementId: "G-J4QZJQW3VY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, auth, db, analytics };
