import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import { uploadImage } from '../services/cloudinaryService';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useSpeakers } from '../context/SpeakerContext';
import { sendSpeakerInvitationEmail } from '../services/emailService';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';

const CreateEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addEvent, updateEvent } = useEvents();
    const { speakers: allSpeakers, addSpeaker } = useSpeakers();
    const { showToast } = useToast();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: {
            venue: '',
            address: ''
        },
        capacity: '',
        status: 'draft',
        imageUrl: '',
        // New Advanced Fields
        priceType: 'free',
        priceUsdt: '',
        walletAddress: '',
        speakerIds: [],
        agenda: []
    });

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Advanced Local States
    const [agendaItems, setAgendaItems] = useState([
        { time: '', title: '', description: '', speakerId: '' }
    ]);

    // Invitation State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [invitationData, setInvitationData] = useState({ name: '', email: '', expertise: '' });
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            const fetchEvent = async () => {
                try {
                    const eventRef = doc(db, 'events', id);
                    const eventSnap = await getDoc(eventRef);
                    if (eventSnap.exists()) {
                        const data = eventSnap.data();

                        // Format dates for input: YYYY-MM-DDTHH:mm
                        const formatDateForInput = (timestamp) => {
                            if (!timestamp) return '';
                            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                            return date.toISOString().slice(0, 16);
                        };

                        setFormData({
                            title: data.title || '',
                            description: data.description || '',
                            startDate: formatDateForInput(data.startDate),
                            endDate: formatDateForInput(data.endDate),
                            location: {
                                venue: data.location?.venue || '',
                                address: data.location?.address || ''
                            },
                            capacity: data.capacity || '',
                            status: data.status || 'draft',
                            imageUrl: data.imageUrl || '',
                            priceType: data.priceType || 'free',
                            priceUsdt: data.priceUsdt || '',
                            walletAddress: data.walletAddress || '',
                            speakerIds: data.speakerIds || [],
                            agenda: data.agenda || []
                        });

                        setPreviewUrl(data.imageUrl || '');
                        if (data.agenda && data.agenda.length > 0) {
                            setAgendaItems(data.agenda);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching event for edit:", error);
                }
            };
            fetchEvent();
        }
    }, [id, isEditMode]);

    const handleAddAgendaItem = () => {
        setAgendaItems([...agendaItems, { time: '', title: '', description: '', speakerId: '' }]);
    };

    const handleRemoveAgendaItem = (index) => {
        setAgendaItems(agendaItems.filter((_, i) => i !== index));
    };

    const handleAgendaChange = (index, field, value) => {
        const updated = [...agendaItems];
        updated[index][field] = value;
        setAgendaItems(updated);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleInviteSpeaker = async (e) => {
        e.preventDefault();
        if (!invitationData.email || !invitationData.name) return;

        setInviting(true);
        try {
            // 1. Create speaker in Firestore with 'invited' status
            const newSpeaker = await addSpeaker({
                name: invitationData.name,
                email: invitationData.email,
                expertise: invitationData.expertise,
                status: 'invited',
                bio: 'Invitado por correo.',
                role: 'Ponente Invitado'
            });

            // 2. Send invitation email
            await sendSpeakerInvitationEmail(
                invitationData.email,
                invitationData.name,
                formData.title || 'un evento en EventMaster'
            );

            // 3. Mark as selected in current event
            setFormData(prev => ({
                ...prev,
                speakerIds: [...prev.speakerIds, newSpeaker.id]
            }));

            setShowInviteModal(false);
            setInvitationData({ name: '', email: '', expertise: '' });
            showToast(`Invitación enviada a ${invitationData.name}`, 'success');
        } catch (error) {
            console.error("Error inviting speaker:", error);
            showToast("Error al enviar la invitación.", 'error');
        } finally {
            setInviting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            const cleanEventData = {
                ...formData,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                imageUrl: finalImageUrl,
                capacity: parseInt(formData.capacity) || 0,
                priceUsdt: formData.priceType === 'paid' ? parseFloat(formData.priceUsdt) : 0,
                agenda: agendaItems.filter(item => item.time && item.title) // Only save valid items
            };

            if (isEditMode) {
                await updateEvent(id, cleanEventData);
                showToast('Evento actualizado con éxito.', 'success');
                navigate(`/events/${id}`);
            } else {
                await addEvent(cleanEventData);
                showToast('¡Evento creado con éxito!', 'success');
                navigate('/events');
            }
        } catch (error) {
            console.error('Error al guardar evento:', error);
            showToast('Hubo un error al guardar el evento.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        navigate('/events');
    };

    return (
        <div className="flex flex-col max-w-[960px] w-full mx-auto px-6 py-8">
            <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <Link className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors flex items-center gap-1" to="/events">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            Eventos
                        </Link>
                    </li>
                    <li className="text-slate-500 dark:text-slate-400 text-sm font-medium">/</li>
                    <li>
                        <span aria-current="page" className="text-slate-900 dark:text-white text-sm font-semibold">{isEditMode ? 'Editar Evento' : 'Crear Evento'}</span>
                    </li>
                </ol>
            </nav>

            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div>
                    <h2 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">{isEditMode ? 'Editar Evento' : 'Crear Nuevo Evento'}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{isEditMode ? 'Modifica los detalles del evento' : 'Configura los detalles generales del evento'}</p>
                </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="title">
                            Título del Evento <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                            id="title"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Ej. Tech Summit 2024"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="startDate">Inicio</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                id="startDate"
                                name="startDate"
                                required
                                value={formData.startDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="endDate">Fin</label>
                            <input
                                type="datetime-local"
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                id="endDate"
                                name="endDate"
                                required
                                value={formData.endDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="location.venue">Lugar (Venue)</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                id="location.venue"
                                name="location.venue"
                                value={formData.location.venue}
                                onChange={handleChange}
                                placeholder="Ej. Centro de Convenciones"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="capacity">Capacidad Máxima</label>
                            <input
                                type="number"
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                id="capacity"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                placeholder="Ej. 500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="description">Descripción</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white p-4 h-32 focus:ring-2 focus:ring-primary/50 focus:outline-none resize-y"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Detalla de qué trata el evento..."
                        ></textarea>
                    </div>

                    {/* Pricing Section */}
                    <div className="flex flex-col gap-6 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configuración de Precio (USDT)</h3>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, priceType: 'free' })}
                                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all border ${formData.priceType === 'free' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-background-dark text-slate-600 border-slate-200 dark:border-slate-700 hover:border-primary'}`}
                            >
                                Gratis
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, priceType: 'paid' })}
                                className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all border ${formData.priceType === 'paid' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-background-dark text-slate-600 border-slate-200 dark:border-slate-700 hover:border-primary'}`}
                            >
                                Pago (USDT)
                            </button>
                        </div>

                        {formData.priceType === 'paid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio en USDT</label>
                                    <input
                                        type="number"
                                        className="h-12 px-4 rounded-lg bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                        placeholder="Ej. 50"
                                        value={formData.priceUsdt}
                                        onChange={(e) => setFormData({ ...formData, priceUsdt: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección de Billetera Binance (USDT-BEP20/TRC20)</label>
                                    <input
                                        type="text"
                                        className="h-12 px-4 rounded-lg bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                        placeholder="0x... o dirección de Binance"
                                        value={formData.walletAddress}
                                        onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Speakers Selection */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">record_voice_over</span>
                                Ponentes del Evento
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">mail</span>
                                Invitar Ponente por Correo
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allSpeakers.length > 0 ? allSpeakers.map(speaker => (
                                <div
                                    key={speaker.id}
                                    onClick={() => {
                                        const ids = formData.speakerIds.includes(speaker.id)
                                            ? formData.speakerIds.filter(id => id !== speaker.id)
                                            : [...formData.speakerIds, speaker.id];
                                        setFormData({ ...formData, speakerIds: ids });
                                    }}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${formData.speakerIds.includes(speaker.id) ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                >
                                    <UserAvatar user={speaker} size="sm" className="flex-none" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold truncate">{speaker.name}</span>
                                        <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                            {speaker.status === 'invited' && <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />}
                                            {speaker.expertise || speaker.role || (speaker.status === 'invited' ? 'Pendiente' : 'Ponente')}
                                        </span>
                                    </div>
                                    {formData.speakerIds.includes(speaker.id) && <span className="material-symbols-outlined text-primary ml-auto">check_circle</span>}
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 italic col-span-full">No hay ponentes registrados aún.</p>
                            )}
                        </div>
                    </div>

                    {/* Agenda Builder */}
                    <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">event_upcoming</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Agenda del Evento</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddAgendaItem}
                                className="flex items-center gap-1 text-primary hover:text-blue-600 font-bold text-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Añadir Actividad
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {agendaItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 bg-white dark:bg-background-dark rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-left-4">
                                    <div className="md:col-span-2 flex flex-col gap-1">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Hora</label>
                                        <input
                                            type="time"
                                            className="h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                            value={item.time}
                                            onChange={(e) => handleAgendaChange(index, 'time', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-5 flex flex-col gap-1">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Título de Actividad</label>
                                        <input
                                            type="text"
                                            className="h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                            placeholder="Ej. Keynote Opening"
                                            value={item.title}
                                            onChange={(e) => handleAgendaChange(index, 'title', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-4 flex flex-col gap-1">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase">Ponente</label>
                                        <select
                                            className="h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                            value={item.speakerId}
                                            onChange={(e) => handleAgendaChange(index, 'speakerId', e.target.value)}
                                        >
                                            <option value="">Seleccionar Ponente...</option>
                                            {allSpeakers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAgendaItem(index)}
                                            className="size-10 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-slate-900 dark:text-white text-sm font-medium">Banner del Evento</label>
                        {previewUrl ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-700">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImageFile(null); setPreviewUrl(''); }}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-background-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">cloud_upload</span>
                                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Click para subir imagen</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/25"
                        >
                            {uploading ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Crear Evento'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Invite Speaker Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Invitar Ponente</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleInviteSpeaker} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre del Ponente</label>
                                <input
                                    required
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Ej. Juan Pérez"
                                    value={invitationData.name}
                                    onChange={e => setInvitationData({ ...invitationData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="ejemplo@correo.com"
                                    value={invitationData.email}
                                    onChange={e => setInvitationData({ ...invitationData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Experticia (Opcional)</label>
                                <input
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Ej. IA & Web3"
                                    value={invitationData.expertise}
                                    onChange={e => setInvitationData({ ...invitationData, expertise: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 h-12 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {inviting ? (
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                            Invitar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEvent;
