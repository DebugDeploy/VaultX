import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/**
 * Ensures the given user has a Firestore user doc AND a familyId.
 * If neither exist, creates both. Returns the familyId.
 */
async function ensureUserAndFamily(firebaseUser) {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    // Already has a family — done
    if (data.familyId) return data.familyId;

    // Legacy user without familyId — create a family for them
    const familyId = await createFamilyForUser(firebaseUser);
    await setDoc(userRef, { familyId }, { merge: true });
    return familyId;
  }

  // Brand-new user — create user doc + family
  const familyId = await createFamilyForUser(firebaseUser);
  await setDoc(userRef, {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || '',
    familyId,
    createdAt: new Date().toISOString(),
  });
  return familyId;
}

/**
 * Creates a top-level families document for the user and returns its ID.
 */
async function createFamilyForUser(firebaseUser) {
  const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Owner';
  const familyDoc = await addDoc(collection(db, 'families'), {
    familyName: `${displayName}'s Portfolio`,
    ownerUid: firebaseUser.uid,
    createdAt: new Date().toISOString(),
    members: [
      {
        uid: firebaseUser.uid,
        name: displayName,
        email: firebaseUser.email || '',
        role: 'Admin',
        status: 'active',
      },
    ],
  });
  return familyDoc.id;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        localStorage.setItem('vaultx_user', JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }));
      } else {
        localStorage.removeItem('vaultx_user');
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName });

    // Initialize user doc + family
    await ensureUserAndFamily({ ...user, displayName });

    return user;
  };

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Ensure family exists (handles legacy users)
    await ensureUserAndFamily(result.user);
    return result;
  };

  const logout = () => {
    return signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Ensure user doc + family exist
    await ensureUserAndFamily(user);

    return user;
  };

  const updateUser = async (updates) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, updates);
      // Reload so Firebase reflects the new displayName before we copy state
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });

      // Also write the new displayName to the Firestore users doc
      // so SettingsContext / family data stays in sync
      try {
        if (updates.displayName) {
          await setDoc(
            doc(db, 'users', auth.currentUser.uid),
            { displayName: updates.displayName },
            { merge: true }
          );
        }
      } catch (err) {
        console.error('Failed to sync displayName to Firestore:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updateUser, signInWithGoogle }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
