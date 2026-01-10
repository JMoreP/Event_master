import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SpeakerContext = createContext();

export const useSpeakers = () => {
    const context = useContext(SpeakerContext);
    if (!context) {
        throw new Error('useSpeakers debe usarse dentro de SpeakerProvider');
    }
    return context;
};

export const SpeakerProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [speakers, setSpeakers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setSpeakers([]);
            setLoading(false);
            return;
        }

        const speakersRef = collection(db, 'speakers');
        const q = query(speakersRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const speakersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSpeakers(speakersData);
            setLoading(false);
        }, (error) => {
            console.error('Error al cargar ponentes:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addSpeaker = async (speakerData) => {
        try {
            const speakersRef = collection(db, 'speakers');
            const newSpeaker = {
                ...speakerData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(speakersRef, newSpeaker);
            return { id: docRef.id, ...newSpeaker };
        } catch (error) {
            console.error('Error al crear ponente:', error);
            throw error;
        }
    };

    const updateSpeaker = async (id, updates) => {
        try {
            const speakerRef = doc(db, 'speakers', id);
            await updateDoc(speakerRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error al actualizar ponente:', error);
            throw error;
        }
    };

    const deleteSpeaker = async (id) => {
        try {
            const speakerRef = doc(db, 'speakers', id);
            await deleteDoc(speakerRef);
        } catch (error) {
            console.error('Error al eliminar ponente:', error);
            throw error;
        }
    };

    const value = {
        speakers,
        loading,
        addSpeaker,
        updateSpeaker,
        deleteSpeaker
    };

    return (
        <SpeakerContext.Provider value={value}>
            {children}
        </SpeakerContext.Provider>
    );
};
