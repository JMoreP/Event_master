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

                    // Force admin for specific email
                    const isSuperAdmin = user.email === 'jmoredavid@gmail.com';

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

                        if (needsSync) {
                            try {
                                await setDoc(userRef, syncData, { merge: true });
                                console.log('Sincronización con Auth exitosa:', syncData);
                            } catch (e) {
                                console.error('Error sincronizando datos con Auth:', e);
                            }
                        }

                        // Si es superadmin y no tiene el rol 'admin', forzarlo (Super Admin Global)
                        if (isSuperAdmin && userData.role !== 'admin') {
                            await setDoc(userRef, { role: 'admin' }, { merge: true });
                            userData.role = 'admin';
                        }

                        setCurrentUser({
                            ...user,
                            ...userData,
                            ...syncData, // Ensure local state has the freshest sync'd data
                            role: userData.role || 'assistant'
                        });
                    } else {
                        // Si NO existe (ej: primer login con Google), NO creamos perfil aquí automáticamente
                        // para evitar condiciones de carrera con Register.jsx
                        const isSuperAdmin = user.email === 'jmoredavid@gmail.com';
                        setCurrentUser({
                            ...user,
                            role: isSuperAdmin ? 'admin' : 'assistant',
                            status: 'active'
                        });
                    }
                } catch (error) {
                    console.error("Error al obtener datos del usuario:", error);
                    const isSuperAdmin = user.email === 'jmoredavid@gmail.com';
                    setCurrentUser({ ...user, role: isSuperAdmin ? 'admin' : 'assistant' });
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

    const value = {
        currentUser,
        loading,
        logout,
        updateUserData,
        loginWithGoogle,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
