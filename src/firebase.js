// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZX9KHOuApNQVjVz881sGNXZ7TJ6aLSaY",
  authDomain: "project-yzkr-pikulusushop.firebaseapp.com",
  databaseURL: "https://project-yzkr-pikulusushop-default-rtdb.firebaseio.com",
  projectId: "project-yzkr-pikulusushop",
  storageBucket: "project-yzkr-pikulusushop.firebasestorage.app",
  messagingSenderId: "634150165360",
  appId: "1:634150165360:web:a259e50ddbd9c58742cdb5",
  measurementId: "G-0H4GGMLEW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export default app;