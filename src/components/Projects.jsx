import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

const Projects = () => {
    const { projects, loading, deleteProject } = useProjects();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');

    // Filtrar proyectos
    const filteredProjects = projects.filter(project => {
        const name = project?.name || '';
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const badges = {
            'active': { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', label: 'Activo' },
            'planning': { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', label: 'Planificación' },
            'on-hold': { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', label: 'En Espera' },
            'completed': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', label: 'Completado' },
        };
        return badges[status] || badges.active;
    };

    return (
        <div className="p-6 md:p-8 lg:px-12">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
                {/* Page Heading & Actions */}
                <div className="flex flex-col gap-4 justify-between md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Proyectos</h1>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">Gestiona y rastrea todos tus eventos y campañas en curso.</p>
                    </div>
                    <Link to="/projects/create" className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 active-pop">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Nuevo Proyecto
                    </Link>
                </div>

                {/* Filters & Controls Bar */}
                <div className="flex flex-col gap-4 items-center justify-between rounded-xl border border-slate-200 bg-surface-light p-4 shadow-sm dark:bg-surface-dark dark:border-slate-800 lg:flex-row">
                    <div className="flex w-full flex-1 gap-3 lg:w-auto">
                        {/* Search Projects */}
                        <div className="relative flex-1 max-w-md">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input
                                className="block w-full rounded-lg border-slate-200 bg-background-light py-2.5 pl-10 pr-4 text-sm transition-all focus:border-primary focus:ring-primary dark:bg-background-dark dark:border-slate-700 dark:text-white"
                                placeholder="Buscar por nombre..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Filter Status */}
                        <div className="relative min-w-[140px]">
                            <select
                                className="block w-full cursor-pointer appearance-none rounded-lg border-slate-200 bg-background-light py-2.5 pl-3 pr-10 text-sm focus:border-primary focus:ring-primary dark:bg-background-dark dark:border-slate-700 dark:text-white"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos</option>
                                <option value="active">Activo</option>
                                <option value="planning">Planificación</option>
                                <option value="completed">Completado</option>
                                <option value="on-hold">En Espera</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400">Cargando proyectos...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-400">folder_open</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No hay proyectos</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                            {searchTerm ? 'No se encontraron proyectos con ese criterio.' : 'Comienza creando tu primer proyecto.'}
                        </p>
                        {!searchTerm && (
                            <Link to="/projects/create" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Crear Proyecto
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-list">
                        {filteredProjects.map(project => {
                            const badge = getStatusBadge(project.status);
                            return (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface-light shadow-sm transition-all hover-glow animate-fade-in-up dark:bg-surface-dark dark:border-slate-800 cursor-pointer"
                                >
                                    {/* Project Image */}
                                    {project.imageUrl && (
                                        <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <img
                                                src={project.imageUrl}
                                                alt={project.name}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        </div>
                                    )}

                                    {/* Project Content */}
                                    <div className="flex flex-1 flex-col p-4">
                                        {/* Category & Status */}
                                        <div className="mb-2 flex items-center justify-between">
                                            {project.category && (
                                                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    {project.category}
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                                            {project.name}
                                        </h3>

                                        {/* Description */}
                                        {project.description && (
                                            <p className="mb-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}

                                        {/* Due Date */}
                                        {project.dueDate && (
                                            <div className="mb-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                <span>{new Date(project.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        )}

                                        {/* Progress Bar */}
                                        {project.progress !== undefined && (
                                            <div className="mb-3">
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="font-medium text-slate-600 dark:text-slate-400">Progreso</span>
                                                    <span className="font-semibold text-slate-900 dark:text-white">{project.progress}%</span>
                                                </div>
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
                                                        deleteProject(project.id);
                                                        showToast('Proyecto eliminado correctamente.', 'success');
                                                    }
                                                }}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Eliminar proyecto"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Projects;
