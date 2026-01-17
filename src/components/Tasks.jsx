import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { useToast } from '../context/ToastContext';
import StatusSelector from './StatusSelector';

const Tasks = () => {
    const { tasks, loading, deleteTask, toggleTaskComplete, updateTask } = useTasks();
    const { showToast } = useToast();
    const [filter, setFilter] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            await updateTask(taskId, { status: newStatus });
            showToast('Estado actualizado.', 'success', 2000);
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            showToast('No se pudo actualizar el estado de la tarea.', 'error');
        }
    };

    // Filtrar tareas
    const filteredTasks = tasks.filter(task => {
        const name = task?.name || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || task.status === filter;
        return matchesSearch && matchesFilter;
    });

    // Obtener conteo por estado
    const counts = {
        all: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        'review': tasks.filter(t => t.status === 'review').length,
        'blocked': tasks.filter(t => t.status === 'blocked').length,
        'done': tasks.filter(t => t.status === 'done').length,
    };

    const getStatusInfo = (status) => {
        const statuses = {
            'todo': { bg: 'bg-slate-400', label: 'Por Hacer', key: 'todo' },
            'in-progress': { bg: 'bg-primary', label: 'En Progreso', key: 'in-progress' },
            'review': { bg: 'bg-purple-500', label: 'En Revisión', key: 'review' },
            'blocked': { bg: 'bg-red-500', label: 'Bloqueado', key: 'blocked' },
            'done': { bg: 'bg-green-500', label: 'Completado', key: 'done' },
        };
        return statuses[status] || statuses.todo;
    };

    const getPriorityInfo = (priority) => {
        const priorities = {
            'high': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'ALTA', icon: 'priority_high' },
            'medium': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', label: 'MEDIA', icon: 'signal_cellular_alt_2_bar' },
            'low': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'BAJA', icon: 'signal_cellular_alt_1_bar' },
        };
        return priorities[priority] || priorities.medium;
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
                {/* Page Heading & Actions */}
                <div className="flex flex-col gap-4 justify-between md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tareas</h1>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">Gestiona y organiza todas tus tareas pendientes.</p>
                    </div>
                    <Link to="/tasks/create" className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-600">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Nueva Tarea
                    </Link>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col gap-4 items-center justify-between rounded-xl border border-slate-200 bg-surface-light p-4 shadow-sm dark:bg-surface-dark dark:border-slate-800 lg:flex-row">
                    <div className="flex w-full flex-1 gap-3 lg:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input
                                className="block w-full rounded-lg border-slate-200 bg-background-light py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary focus:ring-primary dark:bg-background-dark dark:border-slate-700 dark:text-white"
                                placeholder="Buscar tareas..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Todas ({counts.all})
                        </button>
                        <button
                            onClick={() => setFilter('todo')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'todo' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Por Hacer ({counts.todo})
                        </button>
                        <button
                            onClick={() => setFilter('in-progress')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'in-progress' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            En Progreso ({counts['in-progress']})
                        </button>
                        <button
                            onClick={() => setFilter('done')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'done' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Completadas ({counts.done})
                        </button>
                    </div>
                </div>

                {/* Kanban Board - Responsive Grid instead of Scroll */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400">Cargando tablero...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {['todo', 'in-progress', 'review', 'blocked', 'done'].map((statusKey) => {
                            const info = getStatusInfo(statusKey);
                            const columnTasks = filteredTasks.filter(t => t.status === statusKey);

                            return (
                                <div key={statusKey} className="flex flex-col gap-4 min-w-0 animate-fade-in-up">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-2 rounded-full ${info.bg}`}></span>
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">{info.label}</h3>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 min-h-[200px]">
                                        {columnTasks.map(task => {
                                            const priority = getPriorityInfo(task.priority);
                                            return (
                                                <div
                                                    key={task.id}
                                                    className="group bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover-glow hover:-translate-y-1 transition-all cursor-pointer animate-fade-in-up relative hover:z-50"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`${priority.bg} ${priority.text} text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1`}>
                                                            <span className="material-symbols-outlined text-[12px] filled">{priority.icon}</span>
                                                            {priority.label}
                                                        </span>
                                                        <div className="flex -space-x-2">
                                                            <div className="size-6 rounded-full border-2 border-white dark:border-slate-800 bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                                {task.projectName?.substring(0, 1) || 'G'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <h4 className={`text-slate-900 dark:text-white font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2 ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                                                        {task.name}
                                                    </h4>

                                                    {task.description && (
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                        <div className="flex items-center gap-1 text-slate-400">
                                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                                            <span className="text-[11px] font-medium">
                                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sin fecha'}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {/* Mini Status Toggle */}
                                                            <StatusSelector
                                                                currentStatus={task.status}
                                                                onStatusChange={(newStatus) => handleStatusUpdate(task.id, newStatus)}
                                                                size="sm"
                                                            />

                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (window.confirm('¿Eliminar esta tarea?')) {
                                                                        deleteTask(task.id);
                                                                        showToast('Tarea eliminada.', 'info');
                                                                    }
                                                                }}
                                                                className="size-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add Item Placeholder */}
                                        <Link
                                            to={`/tasks/create`}
                                            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary cursor-pointer transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                            <span className="text-sm font-bold">Añadir Tarea</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
