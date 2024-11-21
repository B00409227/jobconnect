// Importing necessary modules from React and Firebase
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase-config';  // Importing the Firebase auth configuration
import { onAuthStateChanged } from 'firebase/auth'; // Import to monitor authentication state changes
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Creating the context that will be used to provide and consume the authentication state
const AuthContext = createContext();

// Custom hook to use the auth context in other components
export function useAuth() {
  console.log('useAuth hook called');
  const context = useContext(AuthContext);
  console.log('Auth context value:', context);
  return context;
}

// Component that provides the authentication state to other components
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);  // State to store the current user
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listener that subscribes to user state changes
    const unsubscribe = onAuthStateChanged(auth, 
      async (user) => {
        try {
          if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Special handling for admin email
              if (user.email === 'mhabz1129@gmail.com') {
                setUserRole('admin');
                if (!userData.isAdmin) {
                  // Update user document to include admin status
                  await setDoc(doc(db, 'users', user.uid), {
                    ...userData,
                    isAdmin: true,
                    userType: 'admin'
                  }, { merge: true });
                }
              } else {
                setUserRole(userData.userType);
              }
              setCurrentUser({ ...user, ...userData });
            } else {
              setError('User profile not found');
              await auth.signOut();
            }
          } else {
            setCurrentUser(null);
            setUserRole(null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user profile');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError('Authentication error: ' + error.message);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    setError
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // The context provider that passes the currentUser state to its children
  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
}

// Exporting AuthContext for use with useContext if needed directly in components
export default AuthContext;

