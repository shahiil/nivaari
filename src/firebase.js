import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyClqyfZNBsiiVJIpLzr-GYVQN1txTbbqk4",
  authDomain: "nivaari-684ec.firebaseapp.com",
  projectId: "nivaari-684ec",
  storageBucket: "nivaari-684ec.firebasestorage.app",
  messagingSenderId: "176372244709",
  appId: "1:176372244709:web:5cbc694b44fc520d7a740c",
  measurementId: "G-4TVX68420W"
};

console.log('Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app);

const analytics = getAnalytics(app);
console.log('Firebase analytics initialized:', analytics);

export const auth = getAuth(app);
console.log('Firebase auth initialized:', auth);

export default app; 