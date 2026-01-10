import React, { useState } from 'react';
import { useSpeakers } from '../context/SpeakerContext';
import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

const Speakers = () => {
    const { speakers, loading } = useSpeakers();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSpeakers = speakers.filter(speaker => {
        const name = speaker?.name || '';
        const expertise = speaker?.expertise || '';
        const search = searchTerm.toLowerCase();
        return name.toLowerCase().includes(search) || expertise.toLowerCase().includes(search);
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-medium">Cargando nuestra red de expertos...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                        Ponentes y <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Expertos</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona y descubre a los líderes que impulsan tus eventos.</p>
                </div>
                <Link
                    to="/speakers/create"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/25 whitespace-nowrap"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Nuevo Ponente
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o especialidad..."
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredSpeakers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSpeakers.map(speaker => (
                        <div
                            key={speaker.id}
                            className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                                <UserAvatar
                                    user={speaker}
                                    size="xl"
                                    className="w-full h-full rounded-none transition-transform duration-500 group-hover:scale-110"
                                />
                                {speaker.status === 'invited' && (
                                    <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg animate-pulse">
                                        Invitado
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">
                                    {speaker.name}
                                </h3>
                                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                                    {speaker.expertise || speaker.role || 'Experto'}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                                    {speaker.bio || 'Sin biografía disponible por el momento.'}
                                </p>

                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    {speaker.social?.linkedin && (
                                        <a href={speaker.social.linkedin} target="_blank" rel="noreferrer" className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                                            <span className="material-symbols-outlined text-[18px]">account_circle</span>
                                        </a>
                                    )}
                                    {speaker.email && (
                                        <a href={`mailto:${speaker.email}`} className="size-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                            <span className="material-symbols-outlined text-[18px]">mail</span>
                                        </a>
                                    )}
                                    <button className="ml-auto p-2 rounded-lg text-slate-400 hover:text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4 font-light">person_search</span>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No se encontraron ponentes</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Prueba ajustando tu búsqueda o agrega uno nuevo.</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="mt-6 text-primary font-bold hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}
        </div>
    );
};

export default Speakers;
