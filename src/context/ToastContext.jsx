import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((toast) => toast.id !== id));
            }, duration);
        }
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const value = useMemo(() => ({ showToast, removeToast, toasts }), [showToast, removeToast, toasts]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ toast, onClose }) => {
    const { type, message } = toast;

    const styles = {
        success: {
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-green-500',
            icon: 'check_circle',
            iconColor: 'text-green-500',
            shadow: 'shadow-green-500/10'
        },
        error: {
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-red-500',
            icon: 'error',
            iconColor: 'text-red-500',
            shadow: 'shadow-red-500/10'
        },
        warning: {
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-amber-500',
            icon: 'warning',
            iconColor: 'text-amber-500',
            shadow: 'shadow-amber-500/10'
        },
        info: {
            bg: 'bg-white dark:bg-slate-900',
            border: 'border-blue-500',
            icon: 'info',
            iconColor: 'text-blue-500',
            shadow: 'shadow-blue-500/10'
        }
    }[type] || styles.info;

    return (
        <div className={`
            pointer-events-auto
            flex items-center gap-3 p-4 pr-10
            rounded-xl border-l-[6px] ${styles.bg} ${styles.border} ${styles.shadow}
            shadow-2xl min-w-[320px] max-w-md
            animate-toast-in transition-all duration-300
            relative group
        `}>
            <div className={`flex-none ${styles.iconColor}`}>
                <span className="material-symbols-outlined filled text-2xl">{styles.icon}</span>
            </div>
            <div className="flex-grow">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {{
                        'success': '¡Éxito!',
                        'error': '¡Error!',
                        'warning': 'Atención',
                        'info': 'Información'
                    }[type] || 'Notificación'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {message}
                </p>
            </div>
            <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    );
};
