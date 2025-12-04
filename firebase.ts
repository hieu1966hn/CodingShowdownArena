import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyAVyBCXmwbHpDThxmu3JpdczP5Fs4x3wFI",
  authDomain: "codingshowdownarena-da2ce.firebaseapp.com",
  projectId: "codingshowdownarena-da2ce",
  storageBucket: "codingshowdownarena-da2ce.firebasestorage.app",
  messagingSenderId: "118008138778",
  appId: "1:118008138778:web:531707defffd36aa9f55a3",
  measurementId: "G-13PB7XZGW0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);  