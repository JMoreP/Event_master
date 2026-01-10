import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const MyGifts = () => {
    const { currentUser } = useAuth();
    const [myGifts, setMyGifts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyGifts = async () => {
            if (!currentUser) return;
            try {
                const q = query(collection(db, 'gift_deliveries'), where('userId', '==', currentUser.uid));
                const snapshot = await getDocs(q);

                const giftsPromises = snapshot.docs.map(async (deliveryDoc) => {
                    const deliveryData = deliveryDoc.data();
                    const giftSnap = await getDoc(doc(db, 'gifts', deliveryData.giftId));
                    if (giftSnap.exists()) {
                        return {
                            id: deliveryDoc.id,
                            deliveredAt: deliveryData.deliveredAt,
                            ...giftSnap.data()
                        };
                    }
                    return null;
                });

                const results = await Promise.all(giftsPromises);
                setMyGifts(results.filter(g => g !== null));
            } catch (error) {
                console.error("Error fetching rewards:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyGifts();
    }, [currentUser]);

    if (loading) return <div className="p-10 text-center text-slate-500">Cargando premios...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mis Premios y Regalos 🎁</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Aquí encontrarás los obsequios que has recibido en nuestros eventos.</p>

            {myGifts.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">redeem</span>
                    <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">Aún no has recibido premios</h3>
                    <p className="text-slate-500">Participa en las actividades de los eventos para ganar recompensas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {myGifts.map(gift => (
                        <div key={gift.id} className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg flex gap-4 items-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                {gift.imageUrl ? (
                                    <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <span className="material-symbols-outlined text-3xl">card_giftcard</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{gift.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{gift.description}</p>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                                    RECIBIDO EL {new Date(gift.deliveredAt?.toDate()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyGifts;
