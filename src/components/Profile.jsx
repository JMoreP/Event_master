import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { uploadImage } from '../services/cloudinaryService';
import UserAvatar from './UserAvatar';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const { currentUser, updateUserData } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('perfil'); // 'perfil', 'seguridad', 'notificaciones'
    const fileInputRef = useRef(null);

    // Form States
    const [formData, setFormData] = useState({
        displayName: currentUser?.displayName || '',
        jobTitle: currentUser?.role || 'Miembro',
        phoneNumber: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [notificationSettings, setNotificationSettings] = useState({
        marketingEmails: true,
        securityAlerts: true,
        projectUpdates: true,
        browserPush: false
    });

    // Load initial data from Firestore
    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) return;
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setFormData(prev => ({
                        ...prev,
                        displayName: data.displayName || currentUser.displayName || '',
                        jobTitle: data.role || 'Miembro',
                        phoneNumber: data.phoneNumber || ''
                    }));
                    if (data.notificationPreferences) {
                        setNotificationSettings(data.notificationPreferences);
                    }
                }
            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        };
        loadUserData();
    }, [currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleNotificationToggle = async (key) => {
        if (key === 'browserPush' && !notificationSettings.browserPush) {
            // Reguessing permission if trying to enable
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    showToast('Permiso de notificaciones denegado por el navegador.', 'error');
                    return;
                }
            }
        }
        setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                role: formData.jobTitle,
                phoneNumber: formData.phoneNumber
            });

            // Sync with Auth profile if name changed
            if (auth.currentUser.displayName !== formData.displayName) {
                await updateProfile(auth.currentUser, { displayName: formData.displayName });
                updateUserData({ displayName: formData.displayName });
            }

            showToast('Perfil actualizado correctamente.', 'success');
        } catch (error) {
            console.error(error);
            showToast('Error al actualizar perfil.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const imageUrl = await uploadImage(file);
            if (imageUrl) {
                // Update Firestore
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, { photoURL: imageUrl });

                // Update Auth
                await updateProfile(auth.currentUser, { photoURL: imageUrl });
                updateUserData({ photoURL: imageUrl });

                showToast('Foto de perfil actualizada.', 'success');
            }
        } catch (error) {
            console.error("Error subiendo avatar:", error);
            showToast('Error al subir la imagen.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('Las nuevas contraseñas no coinciden.', 'error');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwordData.newPassword);

            showToast('Contraseña actualizada exitosamente.', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                showToast('La contraseña actual es incorrecta.', 'error');
            } else {
                showToast('Error al actualizar contraseña. Prueba cerrando sesión e iniciando de nuevo.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = async () => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                notificationPreferences: notificationSettings
            });
            showToast('Preferencias de notificación guardadas.', 'success');
        } catch (error) {
            console.error(error);
            showToast('Error al guardar preferencias.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SideNavBar */}
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24 flex flex-col gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col mb-2 px-3">
                            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-normal">Configuración</h1>
                            <p className="text-slate-500 dark:text-gray-400 text-xs font-normal leading-normal">Gestiona tu cuenta y preferencias</p>
                        </div>
                        <nav className="flex flex-col gap-1">
                            <button
                                onClick={() => setActiveTab('perfil')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'perfil' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${activeTab === 'perfil' ? 'fill-1' : ''}`}>person</span>
                                <p className="text-sm font-semibold leading-normal">Perfil</p>
                            </button>
                            <button
                                onClick={() => setActiveTab('seguridad')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'seguridad' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${activeTab === 'seguridad' ? 'fill-1' : ''}`}>security</span>
                                <p className="text-sm font-semibold leading-normal">Seguridad</p>
                            </button>
                            <button
                                onClick={() => setActiveTab('notificaciones')}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'notificaciones' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${activeTab === 'notificaciones' ? 'fill-1' : ''}`}>notifications</span>
                                <p className="text-sm font-semibold leading-normal">Notificaciones</p>
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="lg:col-span-9 flex flex-col gap-6">

                    {/* Mobile Tabs Switcher */}
                    <div className="flex lg:hidden overflow-x-auto gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2">
                        {['perfil', 'seguridad', 'notificaciones'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'perfil' && (
                        <>
                            {/* Profile Header Card */}
                            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 to-purple-500/20"></div>
                                <div className="relative pt-10 flex flex-col sm:flex-row gap-6 items-center sm:items-end">
                                    <div className="relative group">
                                        <UserAvatar user={currentUser} size="lg" className="ring-4 ring-white dark:ring-slate-900 shadow-xl overflow-hidden" />
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-bold rounded-full"
                                        >
                                            <span className="material-symbols-outlined mb-1">camera_alt</span>
                                            Cambiar
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center sm:items-start pb-2">
                                        <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{formData.displayName || 'Usuario'}</p>
                                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">{currentUser?.email}</p>
                                        <div className="mt-2 flex gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">{formData.jobTitle}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information Form */}
                            <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">contact_page</span>
                                    Información Personal
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">Nombre Completo</label>
                                        <input
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleInputChange}
                                            className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all"
                                            placeholder="Tu Nombre"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">Título profesional</label>
                                        <input
                                            name="jobTitle"
                                            value={formData.jobTitle}
                                            onChange={handleInputChange}
                                            className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all"
                                            placeholder="Ej. Organizador de Eventos"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">Correo de contacto</label>
                                        <input
                                            disabled
                                            value={currentUser?.email}
                                            className="w-full h-11 rounded-lg bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700 px-4 text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">Teléfono</label>
                                        <input
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={loading}
                                        className="btn-primary-glow px-8 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{loading ? 'sync' : 'save'}</span>
                                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'seguridad' && (
                        <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 animate-slide-in">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">lock_reset</span>
                                Cambiar Contraseña
                            </h3>
                            <p className="text-sm text-slate-500 mb-8">Actualiza tu contraseña para mantener tu cuenta segura.</p>

                            <div className="space-y-6 max-w-md">
                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">Contraseña Actual</label>
                                    <div className="relative">
                                        <input
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-4 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                            placeholder="••••••••"
                                            type={showPassword.current ? "text" : "password"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{showPassword.current ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">Nueva Contraseña</label>
                                    <div className="relative">
                                        <input
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-4 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                            placeholder="Nueva Contraseña"
                                            type={showPassword.new ? "text" : "password"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{showPassword.new ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">Confirmar Nueva Contraseña</label>
                                    <div className="relative">
                                        <input
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full h-11 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-4 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                            placeholder="Confirmar Contraseña"
                                            type={showPassword.confirm ? "text" : "password"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{showPassword.confirm ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
                                        className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-bold hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notificaciones' && (
                        <div className="bg-white dark:bg-surface-dark p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 animate-slide-in">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">settings_suggest</span>
                                Preferencias de Notificación
                            </h3>
                            <p className="text-sm text-slate-500 mb-8">Elige cómo quieres que te mantengamos informado.</p>

                            <div className="space-y-4">
                                {[
                                    { id: 'marketingEmails', label: 'Correos de marketing', desc: 'Recibe noticias sobre nuevos eventos y funciones.' },
                                    { id: 'securityAlerts', label: 'Alertas de seguridad', desc: 'Recibe avisos sobre inicios de sesión y cambios de clave.' },
                                    { id: 'projectUpdates', label: 'Actualizaciones de proyectos', desc: 'Notificaciones sobre cambios en tus proyectos asignados.' },
                                    { id: 'browserPush', label: 'Notificaciones Push', desc: 'Alertas directas en tu navegador.' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</span>
                                            <span className="text-xs text-slate-500">{item.desc}</span>
                                        </div>
                                        <button
                                            onClick={() => handleNotificationToggle(item.id)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSettings[item.id] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings[item.id] ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSaveNotifications}
                                    disabled={loading}
                                    className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-all flex items-center gap-2"
                                >
                                    {loading ? 'Guardando...' : 'Aplicar Preferencias'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
