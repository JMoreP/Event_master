import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSpeakers } from '../context/SpeakerContext';
import { uploadImage } from '../services/cloudinaryService';
import { useToast } from '../context/ToastContext';

const EditSpeaker = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { speakers, updateSpeaker } = useSpeakers();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        bio: '',
        social: {
            linkedin: '',
            twitter: '',
            website: ''
        },
        imageUrl: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load speaker data
    useEffect(() => {
        const speaker = speakers.find(s => s.id === id);
        if (speaker) {
            setFormData({
                name: speaker.name || '',
                role: speaker.role || speaker.expertise || '',
                bio: speaker.bio || '',
                social: {
                    linkedin: speaker.social?.linkedin || '',
                    twitter: speaker.social?.twitter || '',
                    website: speaker.social?.website || ''
                },
                imageUrl: speaker.imageUrl || speaker.photoURL || ''
            });
            setPreviewUrl(speaker.imageUrl || speaker.photoURL || '');
            setLoading(false);
        } else if (speakers.length > 0) {
            // Speaker not found
            showToast('Ponente no encontrado', 'error');
            navigate('/speakers');
        }
    }, [id, speakers, navigate, showToast]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            await updateSpeaker(id, {
                ...formData,
                imageUrl: finalImageUrl
            });

            showToast('Ponente actualizado con éxito.', 'success');
            navigate('/speakers');
        } catch (error) {
            console.error('Error al actualizar ponente:', error);
            showToast('Hubo un error al actualizar el ponente.', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-medium">Cargando datos del ponente...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-w-[800px] w-full mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Editar Ponente</h2>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Nombre Completo <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ej. Dra. Ana Pérez"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Cargo / Título</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                placeholder="Ej. CTO @ TechCorp"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Biografía</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white p-4 h-32 focus:ring-2 focus:ring-primary/50 focus:outline-none resize-y"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Breve descripción profesional..."
                        ></textarea>
                    </div>

                    {/* Social Media */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">LinkedIn (URL)</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                name="social.linkedin"
                                value={formData.social.linkedin}
                                onChange={handleChange}
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Twitter (URL)</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                name="social.twitter"
                                value={formData.social.twitter}
                                onChange={handleChange}
                                placeholder="https://twitter.com/..."
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Website (URL)</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-12 px-4 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                name="social.website"
                                value={formData.social.website}
                                onChange={handleChange}
                                placeholder="https://miweb.com"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">Foto de Perfil</label>
                        <div className="flex items-center gap-6">
                            {previewUrl ? (
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 group shrink-0">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setImageFile(null); setPreviewUrl(''); }}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-white text-xl">delete</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                    <span className="material-symbols-outlined text-3xl">person</span>
                                </div>
                            )}
                            <label className="flex-1 cursor-pointer">
                                <span className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    Cambiar foto
                                </span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => navigate('/speakers')}
                            className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/25"
                        >
                            {uploading ? 'Guardando...' : 'Actualizar Ponente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSpeaker;
