import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionGroup, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Note: collectionGroup is powerful but requires index sometimes
// Simpler approach: query all events, then check registrations subcollection? No, too many reads.
// Better: Store 'registeredEvents' array in User profile? OR Use Collection Pair logic if possible.
// For now, let's try a different approach: FETCH ALL events where 'registrations/{userId}' exists? Firestore doesn't support that easily inverted.
// BEST PRACTICE for NoSQL: Duplicate data. When registering, save {eventId, eventTitle, eventDate} in users/{userId}/my-events/{eventId}.
// Let's implement that in EventDetail first? Or just query 'events' and filter client side (slow if many events).
// ALTERNATIVE: Use Collection Group query 'registrations' where userId == current. Then fetch parent events.

import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const MyEvents = () => {
    const { currentUser } = useAuth();
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyEvents = async () => {
            if (!currentUser) return;

            try {
                // Strategy: Get all events, then check if I am registered? Inefficient.
                // Strategy: Collection Group Query on 'registrations'.
                // requires index on 'userId' for 'registrations' collection group.
                // NOTE: This might require creating index in Firebase Console.
                // Fallback for MVP: Iterate all events (assuming < 100 events for now).

                // Correct approach: Collection Group Query on 'registrations' with filter.
                const q = query(collectionGroup(db, 'registrations'), where('userId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);

                const eventsPromises = querySnapshot.docs.map(async (regDoc) => {
                    // Parent of registration is the event
                    // ref.parent is CollectionReference (registrations), parent.parent is DocumentReference (event)
                    const eventRef = regDoc.ref.parent.parent;
                    if (eventRef) {
                        const eventSnap = await getDoc(eventRef);
                        return { id: eventSnap.id, ...eventSnap.data() };
                    }
                    return null;
                });

                const eventsResults = await Promise.all(eventsPromises);
                setMyEvents(eventsResults.filter(e => e !== null));
            } catch (error) {
                console.error("Error fetching my events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyEvents();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Mis Eventos</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Eventos a los que estás registrado.</p>

            {myEvents.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">event_busy</span>
                    <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">No tienes eventos registrados</h3>
                    <p className="text-slate-500 mb-6">Explora los eventos disponibles y únete a uno.</p>
                    <Link to="/events" className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
                        Ver eventos disponibles
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myEvents.map(event => (
                        <Link to={`/events/${event.id}`} key={event.id} className="group bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all hover:border-primary/50">
                            <div className="h-40 bg-slate-100 dark:bg-slate-800 relative">
                                {event.imageUrl ? (
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-primary/40">event</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    REGISTRADO
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">{event.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                    {event.startDate?.toDate ? event.startDate.toDate().toLocaleDateString() : 'Fecha por definir'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                    {event.location?.venue || 'Ubicación por definir'}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyEvents;
