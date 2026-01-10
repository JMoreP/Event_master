import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const NotificationPanel = ({ onClose }) => {
    const {
        notifications,
        invitations,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        acceptInvitation,
        declineInvitation
    } = useNotifications();

    const getIcon = (type) => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'info';
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'success': return 'text-green-500 bg-green-50 dark:bg-green-500/10';
            case 'warning': return 'text-orange-500 bg-orange-50 dark:bg-orange-500/10';
            case 'error': return 'text-red-500 bg-red-50 dark:bg-red-500/10';
            default: return 'text-primary bg-primary/10';
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Notificaciones</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Tienes {notifications.filter(n => !n.read).length} mensajes nuevos</p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-primary hover:underline"
                >
                    Leer todo
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {/* Invitations Section */}
                {invitations.length > 0 && (
                    <div className="bg-primary/5 border-b border-slate-100 dark:border-slate-700/50">
                        <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Invitaciones de Proyecto
                        </div>
                        {invitations.map((inv) => (
                            <div key={inv.id} className="p-4 flex flex-col gap-3 hover:bg-white dark:hover:bg-surface-dark transition-colors">
                                <div className="flex gap-3">
                                    <div className="size-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-[20px]">group_add</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {inv.inviterName} te ha invitado
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            A colaborar en el proyecto: <span className="font-semibold text-slate-700 dark:text-slate-200">{inv.projectName}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-13">
                                    <button
                                        onClick={() => acceptInvitation(inv)}
                                        className="flex-1 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-blue-600 transition-colors shadow-sm"
                                    >
                                        Aceptar
                                    </button>
                                    <button
                                        onClick={() => declineInvitation(inv)}
                                        className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-gray-400 text-[10px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Declinar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {notifications.length === 0 && invitations.length === 0 ? (
                    <div className="p-10 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">notifications_off</span>
                        <p className="text-sm text-slate-500">No tienes notificaciones aún</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${!notif.read ? 'bg-primary/5' : ''}`}
                            >
                                <div className={`size-10 shrink-0 rounded-full flex items-center justify-center ${getIconColor(notif.type)}`}>
                                    <span className="material-symbols-outlined text-[20px]">{getIcon(notif.type)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`text-sm font-bold truncate ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {notif.title}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notif.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                        {notif.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] text-slate-400">
                                            {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleDateString() : 'Recientemente'}
                                        </span>
                                        {notif.link && (
                                            <Link
                                                to={notif.link}
                                                onClick={() => {
                                                    markAsRead(notif.id);
                                                    onClose();
                                                }}
                                                className="text-[10px] font-bold text-primary hover:underline"
                                            >
                                                Ver detalle
                                            </Link>
                                        )}
                                        {!notif.read && !notif.link && (
                                            <button
                                                onClick={() => markAsRead(notif.id)}
                                                className="text-[10px] font-bold text-primary hover:underline"
                                            >
                                                Marcar como leída
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50">
                <button
                    onClick={onClose}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export default NotificationPanel;
