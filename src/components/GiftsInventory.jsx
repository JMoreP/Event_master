import React, { useState } from 'react';
import { useGifts } from '../context/GiftContext';
import { uploadImage } from '../services/cloudinaryService';
import { useToast } from '../context/ToastContext';

const GiftsInventory = () => {
    const { gifts, addGift, deleteGift } = useGifts();
    const { showToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [newGift, setNewGift] = useState({
        name: '',
        description: '',
        stock: '', // number
        imageUrl: ''
    });
    const [imageFile, setImageFile] = useState(null);

    const handleImageChange = (e) => {
        if (e.target.files[0]) setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let finalImageUrl = newGift.imageUrl;
            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            await addGift({ ...newGift, imageUrl: finalImageUrl });
            showToast("Regalo guardado con éxito", "success");
            setNewGift({ name: '', description: '', stock: '', imageUrl: '' });
            setImageFile(null);
            setShowForm(false);
        } catch (error) {
            showToast("Error al guardar regalo", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario de Regalos</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    Nuevo Regalo
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="mb-8 bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                    <h3 className="font-bold mb-4 text-slate-800 dark:text-white">Agregar Nuevo Regalo</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                            <input
                                required
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                value={newGift.name}
                                onChange={e => setNewGift({ ...newGift, name: e.target.value })}
                                placeholder="Ej. Camiseta EventMaster"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Stock Disponible</label>
                            <input
                                type="number"
                                required
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                value={newGift.stock}
                                onChange={e => setNewGift({ ...newGift, stock: e.target.value })}
                                placeholder="Ej. 50"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
                            <textarea
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                value={newGift.description}
                                onChange={e => setNewGift({ ...newGift, description: e.target.value })}
                                placeholder="Detalles del regalo..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Imagen</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                            >
                                {uploading ? 'Guardando...' : 'Guardar Regalo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {gifts.map(gift => (
                    <div key={gift.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all relative group">
                        <div className="h-48 bg-slate-100 dark:bg-slate-800 relative">
                            {gift.imageUrl ? (
                                <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">card_giftcard</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs font-bold px-2 py-1 rounded">
                                Stock: {gift.stock}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">{gift.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{gift.description}</p>
                        </div>

                        <button
                            onClick={() => { if (window.confirm('Eliminar regalo?')) deleteGift(gift.id) }}
                            className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GiftsInventory;
