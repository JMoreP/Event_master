import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#151a21]">
                <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        // No logueado, redirigir a login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // Logueado pero sin permisos (Rol incorrecto)
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-[#151a21] p-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <span className="material-symbols-outlined text-4xl">gpp_bad</span>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Acceso Denegado</h1>
                <p className="mb-6 max-w-md text-slate-500 dark:text-slate-400">
                    No tienes permisos suficientes para acceder a esta página.
                    Tu rol actual es: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentUser.role}</span>
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 shadow-lg shadow-primary/25"
                >
                    Volver atrás
                </button>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
