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

const EventContext = createContext();

export const useEvents = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvents debe usarse dentro de EventProvider');
    }
    return context;
};

export const EventProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Escuchar eventos en tiempo real
    useEffect(() => {
        // Permitir fetch público (sin currentUser)
        // if (!currentUser) ... (REMOVIDO)

        const eventsRef = collection(db, 'events');
        // Ordenar por fecha de inicio del evento si existe, sino por creación
        const q = query(eventsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsData);
            setLoading(false);
        }, (error) => {
            console.error('Error al cargar eventos:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addEvent = async (eventData) => {
        try {
            const eventsRef = collection(db, 'events');
            const newEvent = {
                ...eventData,
                createdBy: currentUser.uid,
                status: eventData.status || 'draft',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(eventsRef, newEvent);
            return { id: docRef.id, ...newEvent };
        } catch (error) {
            console.error('Error al crear evento:', error);
            throw error;
        }
    };

    const updateEvent = async (id, updates) => {
        try {
            const eventRef = doc(db, 'events', id);
            await updateDoc(eventRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error al actualizar evento:', error);
            throw error;
        }
    };

    const deleteEvent = async (id) => {
        try {
            const eventRef = doc(db, 'events', id);
            await deleteDoc(eventRef);
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            throw error;
        }
    };

    const value = {
        events,
        loading,
        addEvent,
        updateEvent,
        deleteEvent
    };

    return (
        <EventContext.Provider value={value}>
            {children}
        </EventContext.Provider>
    );
};
