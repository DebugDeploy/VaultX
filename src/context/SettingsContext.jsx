import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase.config';
import {
  doc, onSnapshot, setDoc, updateDoc,
  collection, query, where, getDocs, getDoc, addDoc, deleteDoc,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const ACCENT_COLORS = {
  blue:    { label: 'Blue',    value: '#3b82f6' },
  purple:  { label: 'Purple',  value: '#8b5cf6' },
  green:   { label: 'Green',   value: '#22c55e' },
  cyan:    { label: 'Cyan',    value: '#06b6d4' },
  orange:  { label: 'Orange',  value: '#f97316' },
  red:     { label: 'Red',     value: '#ef4444' },
  pink:    { label: 'Pink',    value: '#ec4899' },
  indigo:  { label: 'Indigo',  value: '#6366f1' },
  emerald: { label: 'Emerald', value: '#10b981' },
  yellow:  { label: 'Yellow',  value: '#eab308' },
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentKey: 'blue',
  compactMode: false,
};

export const ACCENT_MAP = ACCENT_COLORS;

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

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [family, setFamily] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const creatingFamily = useRef(false);

  // ── Resolve familyId from the user's Firestore doc ──────────────
  // If the user doc doesn't exist or has no familyId, auto-create both.
  useEffect(() => {
    if (!user) {
      setFamily(null);
      setFamilyId(null);
      setLoading(false);
      return;
    }
    const userRef = doc(db, 'users', user.uid);

    const ensureFamilyExists = async () => {
      try {
        // Always re-read the user doc before deciding to create a family.
        // This prevents overwriting a shared familyId that inviteMember set.
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().familyId) {
          setFamilyId(snap.data().familyId);
          return; // Already has a valid familyId — do NOT create a new one
        }
        if (creatingFamily.current) return; // Another call is already creating

        // No familyId — create a family and update the user doc
        creatingFamily.current = true;
        console.log('[SettingsContext] No familyId found, creating family…');
        
        // Double-check one more time right before creation (race guard)
        const recheck = await getDoc(userRef);
        if (recheck.exists() && recheck.data().familyId) {
          setFamilyId(recheck.data().familyId);
          creatingFamily.current = false;
          return;
        }

        const newFamilyId = await createFamilyForUser(user);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          familyId: newFamilyId,
          createdAt: new Date().toISOString(),
        }, { merge: true });
        setFamilyId(newFamilyId);
        creatingFamily.current = false;
      } catch (err) {
        console.error('[SettingsContext] Error resolving familyId:', err);
        creatingFamily.current = false;
      }
    };

    // Try real-time listener first, fall back to manual check
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.familyId) {
            setFamilyId(data.familyId);
          } else {
            // User doc exists but missing familyId — create one
            ensureFamilyExists();
          }
        } else {
          // User doc doesn't exist at all — create it with a family
          ensureFamilyExists();
        }
      },
      (error) => {
        console.warn('[SettingsContext] onSnapshot error on user doc, falling back to getDoc:', error.message);
        // Firestore rules may block the listener — fall back to a one-time read
        ensureFamilyExists();
      }
    );

    return () => unsub();
  }, [user]);

  // ── Subscribe to families/{familyId} once we know it ────────────
  useEffect(() => {
    if (!user || !familyId) return;

    setLoading(true);
    const familyRef = doc(db, 'families', familyId);

    const unsub = onSnapshot(familyRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        // Clean up stale / mock members
        const cleanMembers = (data.members || []).filter(
          m => m.uid || (m.email && m.email.includes('@'))
        );

        // Always ensure the current user is in the list
        const hasCurrentUser = cleanMembers.some(m => m.uid === user.uid);
        const finalMembers = hasCurrentUser
          ? cleanMembers
          : [
              {
                uid: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'Owner',
                email: user.email || '',
                role: 'Admin',
                status: 'active',
              },
              ...cleanMembers,
            ];

        const finalFamily = { ...data, id: familyId, members: finalMembers };
        setFamily(finalFamily);

        // Write back if we cleaned anything
        if (
          finalMembers.length !== (data.members || []).length ||
          !hasCurrentUser
        ) {
          setDoc(familyRef, { ...data, members: finalMembers }).catch(console.error);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, familyId]);

  // ── Subscribe to per-user settings ──────────────────────────────
  useEffect(() => {
    if (!user) return;

    const settingsRef = doc(db, 'users', user.uid, 'config', 'settings');
    const unsub = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        setDoc(settingsRef, DEFAULT_SETTINGS);
      }
    });

    return () => unsub();
  }, [user]);

  // ── Apply CSS vars ──────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const accent = ACCENT_COLORS[settings.accentKey]?.value || ACCENT_COLORS.blue.value;
    root.style.setProperty('--accent-color', accent);

    if (settings.theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }

    if (settings.compactMode) {
      root.setAttribute('data-compact', 'true');
    } else {
      root.removeAttribute('data-compact');
    }
  }, [settings]);

  // ── updateSettings ──────────────────────────────────────────
  const updateSettings = useCallback(async (patch) => {
    if (!user) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await setDoc(doc(db, 'users', user.uid, 'config', 'settings'), next);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, [settings, user]);

  // ── updateFamily (writes to families/{familyId}) ────────────
  const updateFamily = useCallback(async (nextFamily) => {
    if (!user || !familyId) return;
    setFamily(nextFamily);
    try {
      const { id, ...dataToSave } = nextFamily; // Don't save the id field inside the doc
      await setDoc(doc(db, 'families', familyId), dataToSave);
    } catch (err) {
      console.error('Failed to save family:', err);
    }
  }, [user, familyId]);

  // ── updateFamilyName ────────────────────────────────────────
  const updateFamilyName = useCallback((name) => {
    if (!family) return;
    updateFamily({ ...family, familyName: name });
  }, [family, updateFamily]);

  // ── inviteMember ────────────────────────────────────────────
  const inviteMember = useCallback(async (email, role) => {
    if (!family || !familyId) throw new Error('Family not loaded yet.');

    // Look up the user by email — they MUST exist
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('No VaultX account found with that email. Ask them to sign up first.');
    }

    const userDoc = querySnapshot.docs[0].data();
    const linkedUid = userDoc.uid;
    const linkedName = userDoc.displayName || email.split('@')[0];

    // Don't add if already a member
    if (family.members.find(m => m.uid === linkedUid || m.email === email)) {
      throw new Error('This account is already linked to your family.');
    }

    // Migrate their existing assets from their old family into this shared family
    const oldFamilyId = userDoc.familyId;
    if (oldFamilyId && oldFamilyId !== familyId) {
      const oldAssetsSnap = await getDocs(collection(db, 'families', oldFamilyId, 'assets'));
      const sharedAssetsRef = collection(db, 'families', familyId, 'assets');
      for (const d of oldAssetsSnap.docs) {
        await addDoc(sharedAssetsRef, d.data());
        await deleteDoc(doc(db, 'families', oldFamilyId, 'assets', d.id));
      }
    }

    const newMember = { uid: linkedUid, name: linkedName, email, role, status: 'active' };
    const nextFamily = { ...family, members: [...family.members, newMember] };
    await updateFamily(nextFamily);

    // Point the linked user's doc to this shared family
    await setDoc(doc(db, 'users', linkedUid), { familyId }, { merge: true });
  }, [family, familyId, updateFamily]);

  // ── addMember (delegates to inviteMember) ──────────────────
  const addMember = useCallback(async (member) => {
    await inviteMember(member.email, member.role || 'Member', member.name);
  }, [inviteMember]);

  // ── removeMember ────────────────────────────────────────────
  const removeMember = useCallback(async (memberUid) => {
    if (!family || !familyId) return;
    const memberToRemove = family.members.find(m => m.uid === memberUid);
    const nextFamily = { ...family, members: family.members.filter(m => m.uid !== memberUid) };
    await updateFamily(nextFamily);

    // If the removed member had a uid, create a new solo family for them
    if (memberToRemove?.uid) {
      try {
        // We don't reassign them here — they'll get a new family on next login
        // via AuthContext's ensureUserAndFamily
        const otherUserRef = doc(db, 'users', memberToRemove.uid);
        await setDoc(otherUserRef, { familyId: null }, { merge: true });
      } catch (err) {
        console.error('Failed to unlink removed member:', err);
      }
    }
  }, [family, familyId, updateFamily]);

  // ── updateMemberRole ────────────────────────────────────────
  const updateMemberRole = useCallback((memberUid, role) => {
    if (!family) return;
    updateFamily({
      ...family,
      members: family.members.map(m => (m.uid === memberUid ? { ...m, role } : m)),
    });
  }, [family, updateFamily]);

  // Provide a safe family fallback so consumers never get null
  const safeFamily = family || { familyName: 'My Portfolio', members: [] };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        accentColors: ACCENT_COLORS,
        family: safeFamily,
        familyId,
        updateFamilyName,
        addMember,
        removeMember,
        updateMemberRole,
        inviteMember,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
