import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useTasks } from '../context/TaskContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import UserAvatar from './UserAvatar';

const MainLayout = () => {
    const location = useLocation();
    const { currentUser, logout, isResolving } = useAuth();
    const { projects } = useProjects();
    const { tasks } = useTasks();
    const { unreadCount } = useNotifications();

    // While resolving role (fetching from Firestore), treat as no user/loading
    // This prevents premature rendering of Admin options
    const safeUser = isResolving ? null : currentUser;

    const currentPath = location.pathname;
    const isAdmin = safeUser?.role === 'admin' || safeUser?.role === 'owner';
    const isOrganizer = safeUser?.role === 'organizer';
    const canManage = isAdmin || isOrganizer;

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ projects: [], tasks: [] });
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const navigate = useNavigate();
    const searchRef = useRef(null);
    const profileRef = useRef(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const isActive = (path) => currentPath === path;

    // Search Logic
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults({ projects: [], tasks: [] });
            setIsSearchOpen(false);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filteredProjects = projects.filter(p =>
            p && (p.name?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query))
        ).slice(0, 5);

        const filteredTasks = tasks.filter(t =>
            t && (t.title?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query))
        ).slice(0, 5);

        setSearchResults({ projects: filteredProjects, tasks: filteredTasks });
        setIsSearchOpen(true);
    }, [searchQuery, projects, tasks]);

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 antialiased dark:bg-background-dark dark:text-white font-display">
            {/* Sidebar */}
            <aside className="hidden z-20 flex w-64 flex-col border-r border-slate-200 bg-surface-light dark:bg-surface-dark dark:border-slate-800 md:flex">
                <Link to="/panel" className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
                        <span className="material-symbols-outlined text-[20px]">event_note</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">EventMaster</h2>
                </Link>
                <div className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
                    <NavItem to="/" icon="home" label="Inicio" />
                    <NavItem to="/panel" icon="dashboard" label="Panel" active={isActive('/panel')} />

                    {/* Management Sections (Organizer/Admin) */}
                    {canManage && (
                        <>
                            <div className="px-3 pt-4 pb-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gestión</p>
                            </div>
                            <NavItem to="/projects" icon="list_alt" label="Proyectos" active={isActive('/projects')} />
                            <NavItem to="/tasks" icon="check_circle" label="Tareas" active={isActive('/tasks')} />
                            <NavItem to="/team" icon="group" label="Equipo" active={isActive('/team')} />
                        </>
                    )}

                    {/* Common Sections */}
                    <div className="px-3 pt-4 pb-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Análisis & Eventos</p>
                    </div>
                    <NavItem to="/reports" icon="bar_chart" label="Reportes" active={isActive('/reports')} />
                    <NavItem to="/events" icon="calendar_month" label="Eventos" active={isActive('/events')} />
                    <NavItem to="/speakers" icon="record_voice_over" label="Ponentes" active={isActive('/speakers')} />
                    <NavItem to="/events/my-events" icon="event_available" label="Mis Eventos" active={isActive('/events/my-events')} />
                    <NavItem to="/my-gifts" icon="redeem" label="Mis Premios" active={isActive('/my-gifts')} />
                    <NavItem to="/calendar" icon="calendar_today" label="Calendario" active={isActive('/calendar')} />
                </div>
                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                    <NavItem to="/settings" icon="settings" label="Configuración" active={isActive('/settings')} />
                    <NavItem to="/help" icon="help" label="Ayuda" active={isActive('/help')} />
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
                    <Link to="/panel" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
                            <span className="material-symbols-outlined text-[20px]">event_note</span>
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">EventMaster</h2>
                    </Link>
                    <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
                    <NavItem to="/" icon="home" label="Inicio" onClick={() => setIsMenuOpen(false)} />
                    <NavItem to="/panel" icon="dashboard" label="Panel" active={isActive('/panel')} onClick={() => setIsMenuOpen(false)} />

                    {/* Management Sections (Organizer/Admin) */}
                    {canManage && (
                        <>
                            <div className="px-3 pt-4 pb-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gestión</p>
                            </div>
                            <NavItem to="/projects" icon="list_alt" label="Proyectos" active={isActive('/projects')} onClick={() => setIsMenuOpen(false)} />
                            <NavItem to="/tasks" icon="check_circle" label="Tareas" active={isActive('/tasks')} onClick={() => setIsMenuOpen(false)} />
                            <NavItem to="/team" icon="group" label="Equipo" active={isActive('/team')} onClick={() => setIsMenuOpen(false)} />
                        </>
                    )}

                    {/* Common Sections */}
                    <div className="px-3 pt-4 pb-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Análisis & Eventos</p>
                    </div>
                    <NavItem to="/reports" icon="bar_chart" label="Reportes" active={isActive('/reports')} onClick={() => setIsMenuOpen(false)} />
                    <NavItem to="/events" icon="calendar_month" label="Eventos" active={isActive('/events')} onClick={() => setIsMenuOpen(false)} />
                    <NavItem to="/speakers" icon="record_voice_over" label="Ponentes" active={isActive('/speakers')} onClick={() => setIsMenuOpen(false)} />
                    <NavItem to="/events/my-events" icon="event_available" label="Mis Eventos" active={isActive('/events/my-events')} onClick={() => setIsMenuOpen(false)} />
                    <NavItem to="/my-gifts" icon="redeem" label="Mis Premios" active={isActive('/my-gifts')} onClick={() => setIsMenuOpen(false)} />
                    <NavItem to="/calendar" icon="calendar_today" label="Calendario" active={isActive('/calendar')} onClick={() => setIsMenuOpen(false)} />
                </div>
                <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                    <NavItem to="/settings" icon="settings" label="Configuración" active={isActive('/settings')} onClick={() => setIsMenuOpen(false)} />
                    <NavItem to="/help" icon="help" label="Ayuda" active={isActive('/help')} onClick={() => setIsMenuOpen(false)} />
                </div>
            </aside>

            {/* Main Content */}
            <div className="relative flex h-full min-w-0 flex-1 flex-col">
                {/* Top Navigation */}
                <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-surface-light px-6 dark:bg-surface-dark dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <button
                            className="text-slate-500 hover:text-primary dark:text-slate-400 md:hidden focus:outline-none"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        {/* Breadcrumbs */}
                        <nav className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 sm:flex">
                            <Link className="hover:text-primary transition-colors" to="/">Inicio</Link>
                            <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
                            <span className="text-slate-900 dark:text-white capitalize">
                                {{
                                    '/panel': 'Panel',
                                    '/projects': 'Proyectos',
                                    '/tasks': 'Tareas',
                                    '/team': 'Equipo',
                                    '/reports': 'Reportes',
                                    '/events': 'Eventos',
                                    '/speakers': 'Ponentes',
                                    '/settings': 'Configuración',
                                    '/help': 'Ayuda',
                                    '/calendar': 'Calendario',
                                    '/my-gifts': 'Mis Premios',
                                    '/events/my-events': 'Mis Eventos'
                                }[currentPath] || 'Panel'}
                            </span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Global Search */}
                        <div className="relative group hidden md:flex" ref={searchRef}>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-primary">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input
                                className="block w-64 rounded-full border-slate-200 bg-slate-100 py-2 pl-10 pr-4 text-sm transition-all focus:border-primary focus:ring-primary dark:bg-background-dark dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                                placeholder="Buscar proyectos o tareas..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {/* Search Results Dropdown */}
                            {isSearchOpen && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-surface-dark rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {(searchResults.projects.length > 0 || searchResults.tasks.length > 0) ? (
                                        <>
                                            {searchResults.projects.length > 0 && (
                                                <div className="px-2">
                                                    <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proyectos</p>
                                                    {searchResults.projects.map(p => (
                                                        <Link
                                                            key={p.id}
                                                            to={`/projects/${p.id}`}
                                                            onClick={() => setIsSearchOpen(false)}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-primary text-[18px]">folder</span>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{p.name}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.tasks.length > 0 && (
                                                <div className="px-2 mt-2">
                                                    <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tareas</p>
                                                    {searchResults.tasks.map(t => (
                                                        <Link
                                                            key={t.id}
                                                            to={`/projects/${t.projectId}`}
                                                            onClick={() => setIsSearchOpen(false)}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-orange-500 text-[18px]">task_alt</span>
                                                            <div className="flex flex-col min-w-0">
                                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{t.title}</p>
                                                                <p className="text-[10px] text-slate-400 truncate">{t.projectName}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="px-4 py-3 text-center">
                                            <p className="text-sm text-slate-500">No hay resultados para "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-outlined">notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute right-2 top-2 size-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <NotificationPanel onClose={() => setIsNotificationsOpen(false)} />
                            )}
                        </div>
                        <div className="mx-1 h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                        {currentUser ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex cursor-pointer items-center gap-3 focus:outline-none"
                                >
                                    <UserAvatar user={currentUser} size="sm" />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.displayName || 'Usuario'}</p>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to="/profile"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                                Perfil
                                            </Link>
                                            <Link
                                                to="/settings"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">settings</span>
                                                Configuración
                                            </Link>
                                        </div>
                                        <div className="border-t border-slate-100 dark:border-slate-700/50 py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-[18px]">login</span>
                                <span className="hidden sm:inline">Iniciar Sesión</span>
                            </Link>
                        )}
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
                    <Outlet />
                </main>
            </div >
        </div >
    );
};

const NavItem = ({ icon, label, to, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${active
            ? 'bg-primary/10 font-medium text-primary border border-primary/20'
            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
    >
        <span className={`material-symbols-outlined transition-colors ${!active && 'group-hover:text-primary'} ${active && 'fill-1'}`}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

export default MainLayout;
