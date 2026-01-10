import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import { useTasks } from '../context/TaskContext';

const Calendar = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDayData, setSelectedDayData] = useState(null);
    const { events, loading: eventsLoading } = useEvents();
    const { tasks, loading: tasksLoading } = useTasks();

    const loading = eventsLoading || tasksLoading;

    // Date Helpers
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const changeMonth = (offset) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    // Data Filtering for Days
    const getActivitiesForDay = (day) => {
        const dayEvents = events.filter(event => {
            const start = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate);
            return start.getDate() === day && start.getMonth() === currentMonth && start.getFullYear() === currentYear;
        });
        const dayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const due = new Date(task.dueDate);
            return due.getDate() === day && due.getMonth() === currentMonth && due.getFullYear() === currentYear;
        });
        return { dayEvents, dayTasks };
    };

    const handleDayClick = (day) => {
        const { dayEvents, dayTasks } = getActivitiesForDay(day);
        if (dayEvents.length > 0 || dayTasks.length > 0) {
            setSelectedDayData({
                day,
                month: currentMonth,
                year: currentYear,
                events: dayEvents,
                tasks: dayTasks
            });
        }
    };

    const renderDays = () => {
        const days = [];
        const totalDays = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="bg-slate-50 dark:bg-slate-900/50 min-h-[140px] p-2 flex flex-col gap-1 opacity-50 border-r border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-medium text-slate-400 self-end p-1">{prevMonthDays - i}</span>
                </div>
            );
        }

        // Current month days
        for (let d = 1; d <= totalDays; d++) {
            const { dayEvents, dayTasks } = getActivitiesForDay(d);
            const today = isToday(d);
            const hasActivity = dayEvents.length > 0 || dayTasks.length > 0;

            days.push(
                <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    className={`bg-white dark:bg-surface-dark min-h-[140px] p-2 flex flex-col gap-1 group relative transition-all border-r border-b border-slate-100 dark:border-slate-800 
                    ${today ? 'ring-2 ring-primary ring-inset z-10' : ''} 
                    ${hasActivity ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80' : 'opacity-80'}`}
                >
                    <span className={`text-sm font-bold size-7 rounded-full flex items-center justify-center self-end transition-transform group-hover:scale-110 ${today ? 'bg-primary text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                        {d}
                    </span>

                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                        {dayEvents.map(event => (
                            <div key={event.id} className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary text-[10px] font-bold text-primary truncate" title={event.title}>
                                📅 {event.title}
                            </div>
                        ))}
                        {dayTasks.map(task => (
                            <div key={task.id} className={`px-2 py-1 rounded border-l-4 text-[10px] font-bold truncate ${task.status === 'done' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-600'}`} title={task.name || task.title}>
                                ✅ {task.name || task.title}
                            </div>
                        ))}
                    </div>

                    {hasActivity && (
                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-primary text-sm">visibility</span>
                        </div>
                    )}
                </div>
            );
        }

        // Next month padding
        const currentCells = firstDay + totalDays;
        const totalCells = Math.ceil(currentCells / 7) * 7;
        for (let j = 1; j <= totalCells - currentCells; j++) {
            days.push(
                <div key={`next-${j}`} className="bg-slate-50 dark:bg-slate-900/50 min-h-[140px] p-2 flex flex-col gap-1 opacity-50 border-r border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-medium text-slate-400 self-end p-1">{j}</span>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="flex h-full overflow-hidden bg-white dark:bg-background-dark">
            {/* Sidebar */}
            <aside className={`w-80 flex-none bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 relative flex-col overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'flex' : 'hidden'}`}>
                <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Filtros de Vista</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 mb-2">
                            <span className="text-slate-500">Muestras dinámicas</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 py-2">
                                <span className="size-3 rounded-full bg-primary"></span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">Eventos Programados</span>
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <span className="size-3 rounded-full bg-orange-500"></span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">Tareas Pendientes</span>
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <span className="size-3 rounded-full bg-green-500"></span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">Tareas Completadas</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">Información</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Este calendario sincroniza automáticamente tus eventos y tareas basándose en sus fechas asignadas. Haz clic en un día con actividades para ver más detalles.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                {/* Calendar Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-md z-10 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {sidebarOpen ? 'menu_open' : 'menu'}
                            </span>
                        </button>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white min-w-[180px]">
                            {monthNames[currentMonth]} {currentYear}
                        </h1>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">chevron_left</span>
                            </button>
                            <button
                                onClick={() => setViewDate(new Date())}
                                className="px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => changeMonth(1)}
                                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 shadow-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 flex-none bg-slate-50 dark:bg-slate-900/50">
                        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">{day}</div>
                        ))}
                    </div>

                    {/* Days Grid Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 relative bg-slate-100 dark:bg-slate-800 gap-[1px]">
                            {loading && (
                                <div className="absolute inset-0 bg-white/10 dark:bg-background-dark/10 backdrop-blur-[1px] z-20 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-xl">
                                        <span className="animate-spin material-symbols-outlined text-primary text-3xl">progress_activity</span>
                                        <span className="text-xs font-medium text-slate-500">Cargando datos...</span>
                                    </div>
                                </div>
                            )}
                            {renderDays()}
                        </div>
                    </div>
                </div>

                {/* Day Details Modal */}
                {selectedDayData && (
                    <DayDetailsModal
                        data={selectedDayData}
                        onClose={() => setSelectedDayData(null)}
                    />
                )}
            </main>
        </div>
    );
};

const DayDetailsModal = ({ data, onClose }) => {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-zoom-in">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-4 flex items-center justify-between text-white">
                    <div>
                        <h2 className="text-xl font-bold">{data.day} de {monthNames[data.month]}</h2>
                        <p className="text-xs opacity-80 font-medium">Resumen de actividades</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* Events Section */}
                    {data.events.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">event</span>
                                Eventos ({data.events.length})
                            </h3>
                            <div className="space-y-3">
                                {data.events.map(event => (
                                    <Link
                                        key={event.id}
                                        to={`/events/${event.id}`}
                                        className="group block p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-primary truncate">{event.title}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-1">
                                                    {typeof event.location === 'object' ? event.location.venue : event.location || 'Sin ubicación'}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks Section */}
                    {data.tasks.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">task_alt</span>
                                Tareas ({data.tasks.length})
                            </h3>
                            <div className="space-y-3">
                                {data.tasks.map(task => (
                                    <Link
                                        key={task.id}
                                        to={`/projects/${task.projectId}`}
                                        className="group block p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500/30 transition-all"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 truncate">{task.name || task.title}</h4>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${task.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{task.projectName}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-orange-500 opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
