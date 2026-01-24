import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useSpeakers } from '../context/SpeakerContext';
import { useToast } from '../context/ToastContext';

const AgendaManager = ({ eventId, isAdmin }) => {
    const { speakers } = useSpeakers();
    const { showToast } = useToast();
    const [activities, setActivities] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [newActivity, setNewActivity] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'talk', // talk, workshop, break, networking
        speakerId: ''
    });

    // Real-time listener for agenda
    useEffect(() => {
        const agendaRef = collection(db, 'events', eventId, 'agenda');
        // Ordenar por hora de inicio
        const q = query(agendaRef, orderBy('startTime', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setActivities(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [eventId]);

    const handleAddActivity = async (e) => {
        e.preventDefault();
        try {
            const agendaRef = collection(db, 'events', eventId, 'agenda');
            await addDoc(agendaRef, newActivity);
            setShowForm(false);
            setNewActivity({
                title: '',
                description: '',
                startTime: '',
                endTime: '',
                type: 'talk',
                speakerId: ''
            });
            showToast("Actividad agregada con éxito", "success");
        } catch (error) {
            console.error("Error adding activity:", error);
            showToast("Error al agregar actividad", "error");
        }
    };

    const handleDelete = async (activityId) => {
        if (!window.confirm("¿Estás seguro de eliminar esta actividad?")) return;
        try {
            await deleteDoc(doc(db, 'events', eventId, 'agenda', activityId));
        } catch (error) {
            console.error("Error deleting activity:", error);
        }
    };

    const getSpeakerName = (id) => {
        const speaker = speakers.find(s => s.id === id);
        return speaker ? speaker.name : 'Sin ponente';
    };

    const formatTime = (timeString) => {
        return timeString; // Ya viene en formato HH:mm del input date
    };

    return (
        <div className="space-y-6">
            {/* Header / Add Button */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Agenda del Evento</h3>
                {isAdmin && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Agregar Actividad
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                    <h4 className="font-bold mb-4 text-slate-700 dark:text-slate-200">Nueva Actividad</h4>
                    <form onSubmit={handleAddActivity} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
                                <input
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                    value={newActivity.title}
                                    onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                                    placeholder="Ej. Keynote Openin"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                                <select
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                    value={newActivity.type}
                                    onChange={e => setNewActivity({ ...newActivity, type: e.target.value })}
                                >
                                    <option value="talk">Charla / Conferencia</option>
                                    <option value="workshop">Taller / Workshop</option>
                                    <option value="break">Receso / Break</option>
                                    <option value="networking">Networking</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Inicio</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                    value={newActivity.startTime}
                                    onChange={e => setNewActivity({ ...newActivity, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Fin</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                    value={newActivity.endTime}
                                    onChange={e => setNewActivity({ ...newActivity, endTime: e.target.value })}
                                />
                            </div>
                            {/* Speaker Selection only if not break/networking */}
                            {(newActivity.type === 'talk' || newActivity.type === 'workshop') && (
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Ponente</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        value={newActivity.speakerId}
                                        onChange={e => setNewActivity({ ...newActivity, speakerId: e.target.value })}
                                    >
                                        <option value="">-- Seleccionar Ponente --</option>
                                        {speakers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
                            <textarea
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white h-20"
                                value={newActivity.description}
                                onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {activities.length === 0 && !loading && (
                    <div className="text-center py-8 text-slate-500 italic">No hay actividades programadas aún.</div>
                )}

                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="group relative flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark hover:shadow-md transition-all"
                    >
                        {/* Time Column */}
                        <div className="flex flex-col items-center min-w-[30px] pt-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(activity.startTime)}</span>
                            <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-1 group-last:hidden"></div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">{activity.title}</h4>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${activity.type === 'break' ? 'bg-orange-100 text-orange-700' :
                                    activity.type === 'workshop' ? 'bg-purple-100 text-purple-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {activity.type}
                                </span>
                            </div>

                            {activity.description && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 mb-2">{activity.description}</p>
                            )}

                            {activity.speakerId && (
                                <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg w-fit">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                        {/* Ideally fetch speaker image here or pass full speaker object */}
                                        <span className="material-symbols-outlined text-[14px] text-slate-500">person</span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {getSpeakerName(activity.speakerId)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && (
                            <button
                                onClick={() => handleDelete(activity.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all absolute top-2 right-2"
                                title="Eliminar actividad"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgendaManager;
