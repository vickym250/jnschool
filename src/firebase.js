// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // 👈 Ye missing tha

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC24WYX2JPAeCjZY1seCH_fawHFBXYwvDA",
  authDomain: "jnschool-6e62e.firebaseapp.com",
  projectId: "jnschool-6e62e",
  storageBucket: "jnschool-6e62e.firebasestorage.app",
  messagingSenderId: "74451396810",
  appId: "1:74451396810:web:4523d903d3450b82dd6c33",
  measurementId: "G-P7LS3B74W2"
};
// Initialize Firebase


const app = initializeApp(firebaseConfig);

// 👇 Teeno cheezein export karni zaroori hain
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // 👈 Isko add kiya