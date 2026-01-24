import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuario autenticado, buscar su rol en Firestore
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);

                    // Force specific roles for super admins
                    let forcedRole = null;
                    if (user.email === 'yorluis15@gmail.com') forcedRole = 'admin';
                    if (user.email === 'jmoredavid@gmail.com') forcedRole = 'admin';

                    if (userSnap.exists()) {
                        // Si existe el perfil, combinar datos
                        const userData = userSnap.data();

                        // Sync logic: If Firestore is missing photo/name but Auth has them (Google Login), sync back
                        let needsSync = false;
                        const syncData = {};

                        if (!userData.photoURL && user.photoURL) {
                            syncData.photoURL = user.photoURL;
                            needsSync = true;
                        }
                        if (!userData.displayName && user.displayName) {
                            syncData.displayName = user.displayName;
                            needsSync = true;
                        }

                        // Enforce forced roles if necessary
                        if (forcedRole && userData.role !== forcedRole) {
                            syncData.role = forcedRole;
                            needsSync = true;
                        }

                        if (needsSync) {
                            try {
                                await setDoc(userRef, syncData, { merge: true });
                                if (syncData.role) userData.role = syncData.role; // Update local ref
                            } catch (e) {
                                console.error('Error sincronizando datos con Auth:', e);
                            }
                        }

                        setCurrentUser({
                            ...user,
                            ...userData,
                            ...syncData,
                            role: userData.role || 'assistant'
                        });
                    } else {
                        // Si NO existe (ej: primer login con Google)
                        let forcedRole = null;
                        if (user.email === 'yorluis15@gmail.com') forcedRole = 'admin';
                        if (user.email === 'jmoredavid@gmail.com') forcedRole = 'admin';

                        setCurrentUser({
                            ...user,
                            role: forcedRole || 'assistant', // Default
                            status: 'active'
                        });
                    }
                } catch (error) {
                    console.error("Error al obtener datos del usuario:", error);
                    let forcedRole = null;
                    if (user.email === 'yorluis15@gmail.com') forcedRole = 'admin';
                    if (user.email === 'jmoredavid@gmail.com') forcedRole = 'admin';

                    setCurrentUser({ ...user, role: forcedRole || 'assistant' });
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = () => {
        return auth.signOut();
    };

    const loginWithGoogle = async () => {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const resetPassword = async (email) => {
        const { sendPasswordResetEmail } = await import('firebase/auth');
        return sendPasswordResetEmail(auth, email);
    };

    const updateUserData = (newData) => {
        setCurrentUser(prev => prev ? { ...prev, ...newData } : null);
    };

    // Función para refrescar los datos del usuario desde Firestore
    const refreshUserData = async () => {
        if (auth.currentUser) {
            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();

                    // Force specific roles for super admins
                    let forcedRole = null;
                    if (auth.currentUser.email === 'yorluis15@gmail.com') forcedRole = 'admin';
                    if (auth.currentUser.email === 'jmoredavid@gmail.com') forcedRole = 'admin';

                    setCurrentUser({
                        ...auth.currentUser,
                        ...userData,
                        role: forcedRole || userData.role || 'assistant'
                    });
                }
            } catch (error) {
                console.error("Error refreshing user data:", error);
            }
        }
    };

    const value = {
        currentUser,
        loading,
        logout,
        updateUserData,
        refreshUserData,
        loginWithGoogle,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
