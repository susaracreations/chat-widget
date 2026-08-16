import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2Giy0opKrSSFNdZIIFWxqAJGF7DWx7Vg",
  authDomain: "chat2-3f634.firebaseapp.com",
  projectId: "chat2-3f634",
  storageBucket: "chat2-3f634.firebasestorage.app",
  messagingSenderId: "106973712960",
  appId: "1:106973712960:web:5d33cb4273c5e856cec5a5",
  measurementId: "G-05YR982059"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const appId = 'my-custom-chat-app';

export { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  signInAnonymously,
  onAuthStateChanged
};
