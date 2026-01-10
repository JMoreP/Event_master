// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase project config keys
const firebaseConfig = {
    apiKey: "AIzaSyCxI9VaxPFuj0ZAhX4IDGVljcqo6Rh4s2E",
    authDomain: "eventmaster-88ef2.firebaseapp.com",
    projectId: "eventmaster-88ef2",
    storageBucket: "eventmaster-88ef2.firebasestorage.app",
    messagingSenderId: "605626890126",
    appId: "1:605626890126:web:cb5db4dd1d3ec2b4e716df",
    measurementId: "G-K262FHFYJ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
