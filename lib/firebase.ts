// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRlrUVXSkbjUxNwbDBvuAlzaMdWlF91AE",
  authDomain: "snapshot-3d27a.firebaseapp.com",
  projectId: "snapshot-3d27a",
  storageBucket: "snapshot-3d27a.firebasestorage.app",
  messagingSenderId: "143634114461",
  appId: "1:143634114461:web:be3236007ede4c976e7174",
  measurementId: "G-SLPFV8SXK6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);