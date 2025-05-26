// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_SYrv9i-wK39uku_6EjdfMgnbDXzFyQs",
  authDomain: "att-app-24fb5.firebaseapp.com",
  projectId: "att-app-24fb5",
  storageBucket: "att-app-24fb5.firebasestorage.app",
  messagingSenderId: "826090246750",
  appId: "1:826090246750:web:6c3d86fe24b95c702cdacf",
  measurementId: "G-XHBGE3H0JX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);