import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

const EventList = () => {
    const { events, loading } = useEvents();
    const { currentUser } = useAuth();
    const [filter, setFilter] = useState('all');

    const getStatusBadge = (status) => {
        const styles = {
            published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
            draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
        };

        const labels = {
            published: 'Publicado',
            draft: 'Borrador',
            cancelled: 'Cancelado'
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
                {labels[status] || status}
            </span>
        );
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Sin fecha';
        // Si es timestamp de Firestore
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando eventos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Galería de Eventos</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Explora los próximos eventos disponibles</p>
                </div>
                {(currentUser && (currentUser.role === 'admin' || currentUser.role === 'organizer')) && (
                    <div className="flex items-center gap-3">
                        <Link
                            to="/events/create"
                            className="h-10 px-4 flex items-center gap-2 bg-primary hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary/25 focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-background-dark active-pop"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Nuevo Evento
                        </Link>
                    </div>
                )}
            </div>

            {/* Grid */}
            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400">
                        <span className="material-symbols-outlined text-3xl">event_busy</span>
                    </div>
                    <h3 className="text-slate-900 dark:text-white text-lg font-semibold mb-1">No hay eventos creados</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm text-center mb-6">
                        Comienza creando tu primer evento para gestionar la agenda y los asistentes.
                    </p>
                    <Link to="/events/create" className="text-primary font-medium hover:underline">Crear mi primer evento</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-list">
                    {events.map(event => (
                        <Link
                            key={event.id}
                            to={`/events/${event.id}`}
                            className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface-light shadow-sm transition-all hover-glow animate-fade-in-up dark:bg-surface-dark dark:border-slate-800 cursor-pointer"
                        >
                            {/* Image */}
                            <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                                {event.imageUrl ? (
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                                        <span className="material-symbols-outlined text-4xl">image</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    {getStatusBadge(event.status)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-1 flex-col p-5">
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {event.title}
                                </h3>

                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                    <span>{formatDate(event.startDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
                                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                                    <span className="truncate">{event.location?.venue || 'Ubicación por definir'}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventList;
