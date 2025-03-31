import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB4LBIJ567xeJOU4ud5JcJ6V_gMs3VhumA",
  authDomain: "test-40803.firebaseapp.com",
  projectId: "test-40803",
  storageBucket: "test-40803.appspot.com",
  messagingSenderId: "932285696161",
  appId: "1:932285696161:web:0e0ffc877688c93def88e0",
  measurementId: "G-KKTZR92SVM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export { app, analytics };
