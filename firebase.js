import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyABdWdjdSTf33W6zaInDznc8HUWZE2KZ6w",
  authDomain: "spottrack-888de.firebaseapp.com",
  projectId: "spottrack-888de",
  storageBucket: "spottrack-888de.appspot.com",
  messagingSenderId: "641511662246",
  appId: "1:641511662246:web:c4c3225daae5edf4ea4a67"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);