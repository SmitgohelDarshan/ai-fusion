// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "ai-fusion-d2951.firebaseapp.com",
  projectId: "ai-fusion-d2951",
  storageBucket: "ai-fusion-d2951.firebasestorage.app",
  messagingSenderId: "1044392015727",
  appId: "1:1044392015727:web:5a54a78336fd7f2d8c5a9a",
  measurementId: "G-CEHG4WH02J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);