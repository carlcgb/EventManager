import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();

const provider = new GoogleAuthProvider();
// Add Google Calendar scope to get calendar access
provider.addScope('https://www.googleapis.com/auth/calendar');

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    
    // Get the ID token and send it to our backend
    const idToken = await result.user.getIdToken();
    
    // Get the OAuth access token for Google Calendar API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    // Send tokens to backend for session creation and calendar integration
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        idToken,
        accessToken: accessToken || null 
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'authentification avec le serveur');
    }

    const userData = await response.json();
    return { result, userData };
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw error;
  }
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};