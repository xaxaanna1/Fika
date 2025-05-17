import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyDI5bmk8m7VfNEjHX1GDOMql22aw_ZSJNk",
    authDomain: "fir-auth-6f70e.firebaseapp.com",
    projectId: "fir-auth-6f70e",
    storageBucket: "fir-auth-6f70e.firebasestorage.app",
    messagingSenderId: "1003909836639",
    appId: "1:1003909836639:web:235c62bca45072478a10ea",
    measurementId: "G-9HNFGQSDSZ"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
