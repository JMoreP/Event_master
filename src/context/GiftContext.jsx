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
    serverTimestamp,
    where,
    getDocs
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GiftContext = createContext();

export const useGifts = () => {
    const context = useContext(GiftContext);
    if (!context) {
        throw new Error('useGifts debe usarse dentro de GiftProvider');
    }
    return context;
};

export const GiftProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [gifts, setGifts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Escuchar inventario de regalos
    useEffect(() => {
        if (!currentUser) {
            setGifts([]);
            setLoading(false);
            return;
        }

        const giftsRef = collection(db, 'gifts');
        const q = query(giftsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const giftsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGifts(giftsData);
            setLoading(false);
        }, (error) => {
            console.error('Error al cargar regalos:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addGift = async (giftData) => {
        try {
            const giftsRef = collection(db, 'gifts');
            const newGift = {
                ...giftData,
                stock: parseInt(giftData.stock) || 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(giftsRef, newGift);
            return { id: docRef.id, ...newGift };
        } catch (error) {
            console.error('Error al crear regalo:', error);
            throw error;
        }
    };

    const updateGift = async (id, updates) => {
        try {
            const giftRef = doc(db, 'gifts', id);
            await updateDoc(giftRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error al actualizar regalo:', error);
            throw error;
        }
    };

    const deleteGift = async (id) => {
        try {
            const giftRef = doc(db, 'gifts', id);
            await deleteDoc(giftRef);
        } catch (error) {
            console.error('Error al eliminar regalo:', error);
            throw error;
        }
    };

    // Función para asignar regalo a usuario
    const deliverGift = async (giftId, userId, eventId) => {
        try {
            // 1. Verificar stock
            const giftRef = doc(db, 'gifts', giftId);
            const giftDoc = await import('firebase/firestore').then(mod => mod.getDoc(giftRef)); // Dynamic import workaround or separate getDoc if needed
            // Assuming we have the gift data in state, but safer to check strict consistency or use transaction.
            // Simplified for this MVP:

            // 2. Registrar entrega
            const deliveryRef = collection(db, 'gift_deliveries');
            await addDoc(deliveryRef, {
                giftId,
                userId,
                eventId,
                deliveredAt: serverTimestamp()
            });

            // 3. Reducir stock (Opcional, si se maneja stock finito)
            // await updateDoc(giftRef, { stock: increment(-1) });

            return true;
        } catch (error) {
            console.error("Error entregando regalo:", error);
            throw error;
        }
    };

    const value = {
        gifts,
        loading,
        addGift,
        updateGift,
        deleteGift,
        deliverGift
    };

    return (
        <GiftContext.Provider value={value}>
            {children}
        </GiftContext.Provider>
    );
};
