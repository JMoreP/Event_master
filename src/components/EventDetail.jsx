import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AgendaManager from './AgendaManager';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // info, agenda, speakers
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);
    const [registering, setRegistering] = useState(false);
    const [speakersData, setSpeakersData] = useState([]);
    const [registrationStats, setRegistrationStats] = useState({ total: 0, confirmed: 0, pending: 0 });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const eventRef = doc(db, 'events', id);
                const eventSnap = await getDoc(eventRef);

                if (eventSnap.exists()) {
                    setEvent({ id: eventSnap.id, ...eventSnap.data() });
                } else {
                    console.error("Evento no encontrado");
                    // navigate('/events'); // Opcional: redirigir si no existe
                }
            } catch (error) {
                console.error("Error al cargar evento:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    // Check registration status
    useEffect(() => {
        if (!currentUser || !id) return;

        const registrationRef = doc(db, 'events', id, 'registrations', currentUser.uid);
        const unsubscribe = onSnapshot(registrationRef, (doc) => {
            if (doc.exists()) {
                setIsRegistered(true);
                setRegistrationData(doc.data());
            } else {
                setIsRegistered(false);
                setRegistrationData(null);
            }
        });

        return () => unsubscribe();
    }, [currentUser, id]);

    // Fetch Speakers Data
    useEffect(() => {
        const fetchSpeakers = async () => {
            if (!event?.speakerIds || event.speakerIds.length === 0) return;
            try {
                const speakersList = [];
                for (const speakerId of event.speakerIds) {
                    const speakerRef = doc(db, 'speakers', speakerId);
                    const speakerSnap = await getDoc(speakerRef);
                    if (speakerSnap.exists()) {
                        speakersList.push({ id: speakerSnap.id, ...speakerSnap.data() });
                    }
                }
                setSpeakersData(speakersList);
            } catch (error) {
                console.error("Error fetching speakers:", error);
            }
        };
        fetchSpeakers();
    }, [event]);

    // Fetch registration statistics for event creators
    useEffect(() => {
        if (!currentUser || !event || event.createdBy !== currentUser.uid) return;

        const registrationsRef = collection(db, 'events', id, 'registrations');
        const unsubscribe = onSnapshot(registrationsRef, (snapshot) => {
            const registrations = snapshot.docs.map(doc => doc.data());
            const total = registrations.length;
            const confirmed = registrations.filter(r => r.status === 'confirmed').length;
            const pending = registrations.filter(r => r.status === 'pending_payment').length;

            setRegistrationStats({ total, confirmed, pending });
        }, (error) => {
            console.error('Error fetching registration stats:', error);
        });

        return () => unsubscribe();
    }, [currentUser, event, id]);

    const handleRegistration = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // Prevent event creators from registering in their own events
        if (event.createdBy === currentUser.uid) {
            showToast("Como creador del evento, no puedes registrarte como participante", "error");
            return;
        }

        try {
            setRegistering(true);
            const registrationRef = doc(db, 'events', id, 'registrations', currentUser.uid);

            if (isRegistered) {
                // Cancel registration
                if (window.confirm("¿Seguro que quieres cancelar tu registro?")) {
                    await deleteDoc(registrationRef);
                    showToast("Registro cancelado", "info");
                }
            } else {
                // Register
                const isPaid = event.priceType === 'paid';
                await setDoc(registrationRef, {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    userName: currentUser.displayName || 'Usuario',
                    registeredAt: new Date(),
                    status: isPaid ? 'pending_payment' : 'confirmed',
                    pricePaid: isPaid ? event.priceUsdt : 0
                });

                if (isPaid) {
                    showToast("Registro pre-aprobado. Por favor, realiza el pago en USDT para confirmar.", "info", 6000);
                } else {
                    showToast("¡Registro exitoso! Te esperamos.", "success");
                }
            }
        } catch (error) {
            console.error("Error managing registration:", error);
            showToast("Error al procesar el registro", "error");
        } finally {
            setRegistering(false);
        }
    };

    const handleEventDelete = async () => {
        if (window.confirm("¿Estás SEGURO de que deseas eliminar este evento? Esta acción no se puede deshacer.")) {
            try {
                setLoading(true);
                await deleteDoc(doc(db, 'events', id));
                showToast("Evento eliminado exitosamente.", "success");
                navigate('/events');
            } catch (error) {
                console.error("Error deleting event:", error);
                showToast("Error al eliminar el evento.", "error");
                setLoading(false);
            }
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Por definir';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Evento no encontrado</h2>
                <Link to="/events" className="text-primary hover:underline mt-4">Volver a eventos</Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-20">
            {/* Hero Section */}
            <div className="relative w-full h-[300px] md:h-[400px] bg-slate-900 overflow-hidden">
                {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-900 to-purple-900 opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-10">
                    <div className="max-w-4xl">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${event.status === 'published' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                            }`}>
                            {event.status === 'published' ? 'CONFIRMADO' : 'BORRADOR'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">{event.title}</h1>
                        <p className="text-slate-300 text-lg md:text-xl flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                                {formatDate(event.startDate)}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[20px]">location_on</span>
                                {event.location?.venue}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-10 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Left Column) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Navigation Tabs */}
                    <div className="w-full overflow-x-auto pb-1">
                        <div className="flex border-b border-slate-200 dark:border-slate-800 min-w-max">
                            {[
                                { id: 'info', label: 'Información', icon: 'info' },
                                { id: 'agenda', label: 'Agenda', icon: 'calendar_clock' },
                                { id: 'speakers', label: 'Ponentes', icon: 'groups' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative ${activeTab === tab.id
                                        ? 'text-primary'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <span className="material-symbols-outlined">{tab.icon}</span>
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[300px]">
                        {activeTab === 'info' && (
                            <div className="animate-fade-in-up">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Acerca del evento</h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {event.description || "No hay descripción disponible."}
                                </p>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-2 text-primary">
                                            <span className="material-symbols-outlined text-2xl">pin_drop</span>
                                            <h4 className="font-bold">Ubicación</h4>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 font-medium">{event.location?.venue}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{event.location?.address}</p>
                                    </div>
                                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-2 text-primary">
                                            <span className="material-symbols-outlined text-2xl">schedule</span>
                                            <h4 className="font-bold">Horario</h4>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Inicio:</p>
                                            <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">{formatDate(event.startDate)}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Cierre:</p>
                                            <p className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(event.endDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'agenda' && (
                            <div className="animate-fade-in-up space-y-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Agenda Detallada</h3>
                                {event.agenda && event.agenda.length > 0 ? (
                                    <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
                                        {event.agenda.sort((a, b) => a.time.localeCompare(b.time)).map((item, index) => (
                                            <div key={index} className="relative">
                                                <div className="absolute -left-[41px] top-0 size-4 bg-primary rounded-full ring-4 ring-white dark:ring-background-dark shadow-sm" />
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                                                    <span className="text-primary font-black text-sm uppercase tracking-widest">{item.time}</span>
                                                    {item.speakerId && (
                                                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase">
                                                            {speakersData.find(s => s.id === item.speakerId)?.name || 'Ponente Invitado'}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h4>
                                                {item.description && <p className="text-sm text-slate-500 mt-1">{item.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <p className="text-slate-500 italic">No hay agenda disponible para este evento todavía.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'speakers' && (
                            <div className="animate-fade-in-up">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Expertos e Invitados</h3>
                                {speakersData.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {speakersData.map(speaker => (
                                            <div key={speaker.id} className="flex gap-4 p-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                <div className="size-16 md:size-20 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex-none">
                                                    {speaker.image ? <img src={speaker.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{speaker.name}</h4>
                                                    <p className="text-xs text-primary font-bold uppercase tracking-wider">{speaker.expertise}</p>
                                                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{speaker.bio}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">mic_external_on</span>
                                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Ponentes por confirmar</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Pronto anunciaremos a los expertos invitados.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Right Column) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        {/* Registration Card */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6">
                            {/* Show registration stats if user is the event creator */}
                            {currentUser && event.createdBy === currentUser.uid ? (
                                <div className="space-y-4">
                                    <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-3">
                                            <span className="material-symbols-outlined text-2xl">shield_person</span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Panel de Organizador</h3>
                                    </div>

                                    {/* Registration Statistics */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-500 text-xl">people</span>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Registros</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-900 dark:text-white">{registrationStats.total}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Confirmados</span>
                                            </div>
                                            <span className="text-lg font-black text-green-700 dark:text-green-400">{registrationStats.confirmed}</span>
                                        </div>

                                        {registrationStats.pending > 0 && (
                                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-yellow-500 text-xl">schedule</span>
                                                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pagos Pendientes</span>
                                                </div>
                                                <span className="text-lg font-black text-yellow-700 dark:text-yellow-400">{registrationStats.pending}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
                                        Estadísticas en tiempo real
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                        {isRegistered ? 'Tu Registro' : 'Inscripción'}
                                    </h3>

                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white">
                                            {event.priceType === 'paid' ? `${event.priceUsdt} USDT` : 'Gratis'}
                                        </span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">/ entrada general</span>
                                    </div>

                                    {/* Payment Info for Pending Registrations */}
                                    {isRegistered && registrationData?.status === 'pending_payment' && (
                                        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl animate-pulse">
                                            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-bold text-sm mb-2">
                                                <span className="material-symbols-outlined text-[18px]">warning</span>
                                                Pago Pendiente
                                            </div>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-500 mb-4">
                                                Por favor transfiere la cantidad exacta usando el siguiente método y envía el comprobante.
                                            </p>

                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                    {event.paymentMethod === 'binance_pay' ? 'BINANCE PAY ID' : 'DIRECCIÓN DE BILLETERA'}
                                                </span>
                                                <div className={`p-3 rounded-lg border flex items-center justify-between gap-2 break-all font-mono select-all ${event.paymentMethod === 'binance_pay'
                                                    ? 'bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-100'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                    <span>{event.paymentDetails || event.walletAddress || 'No asignado'}</span>
                                                    {event.paymentMethod === 'binance_pay' && <span className="material-symbols-outlined text-yellow-600">qr_code</span>}
                                                </div>
                                                {event.paymentMethod === 'binance_pay' && (
                                                    <p className="text-[10px] text-slate-400">
                                                        Ve a Binance App {'>'} Pay {'>'} Enviar {'>'} Ingresa este Pay ID
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {isRegistered && registrationData?.status === 'confirmed' && (
                                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm">
                                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                ¡Registro Confirmado!
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                                            <span>Acceso a todas las charlas</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                                            <span>Certificado de participación</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleRegistration}
                                        disabled={registering}
                                        className={`w-full py-3.5 rounded-xl font-bold text-center shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isRegistered
                                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-500 hover:text-white'
                                            : 'bg-primary text-white hover:bg-blue-600 shadow-primary/25'
                                            }`}
                                    >
                                        {registering ? (
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        ) : (
                                            isRegistered ? 'Cancelar Registro' : 'Registrarme Ahora'
                                        )}
                                    </button>

                                    {!isRegistered && (
                                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                                            Cupos limitados: {event.capacity || 'Ilimitado'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Admin Tools */}
                        {(isAdmin || (currentUser && event.createdBy === currentUser.uid)) && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Administración</h4>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => navigate(`/events/edit/${id}`)}
                                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:border-primary dark:hover:border-primary transition-colors text-slate-700 dark:text-slate-200"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        Editar Evento
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium hover:border-purple-500 hover:text-purple-500 transition-colors text-slate-700 dark:text-slate-200">
                                        <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                                        Gestionar Asistentes
                                    </button>
                                    {(isAdmin || (currentUser && event.createdBy === currentUser.uid)) && (
                                        <button
                                            onClick={handleEventDelete}
                                            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-sm font-medium hover:bg-red-500 hover:text-white transition-all text-red-600 dark:text-red-400"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                            Eliminar Evento
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
