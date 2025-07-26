import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyD52SI-s1zG7i0fsc8hs9hUTPiFHuG4Fng",
  authDomain: "groupvaultsplit.firebaseapp.com",
  projectId: "groupvaultsplit",
  storageBucket: "groupvaultsplit.firebasestorage.app",
  messagingSenderId: "856435186543",
  appId: "1:856435186543:web:408ad132291705e314e69a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);