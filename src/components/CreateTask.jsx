import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { useProjects } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

const CreateTask = () => {
    const navigate = useNavigate();
    const { projectId: urlProjectId } = useParams();
    const { addTask } = useTasks();
    const { projects } = useProjects();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        description: '',
        projectId: urlProjectId || 'general-project',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addTask(formData);
            showToast('Tarea creada con éxito.', 'success');
            navigate('/tasks');
        } catch (error) {
            console.error('Error al guardar tarea:', error);
            showToast('Hubo un error al guardar la tarea. Por favor intenta de nuevo.', 'error');
        }
    };

    const handleCancel = () => {
        navigate('/tasks');
    };

    return (
        <div className="flex flex-col max-w-[960px] w-full mx-auto px-6 py-8">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <Link className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors flex items-center gap-1" to="/tasks">
                            <span className="material-symbols-outlined text-[18px]">task_alt</span>
                            Tareas
                        </Link>
                    </li>
                    <li className="text-slate-500 dark:text-slate-400 text-sm font-medium">/</li>
                    <li>
                        <span aria-current="page" className="text-slate-900 dark:text-white text-sm font-semibold">Crear Tarea</span>
                    </li>
                </ol>
            </nav>
            {/* Page Heading */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div>
                    <h2 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Crear Nueva Tarea</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Agrega una nueva tarea a tu lista</p>
                </div>
            </div>
            {/* Main Form Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                    {/* Task Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-1" htmlFor="taskName">
                            Nombre de la Tarea <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                autoFocus
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base font-normal shadow-sm group-hover:border-slate-400 dark:group-hover:border-slate-500"
                                id="taskName"
                                name="name"
                                placeholder="ej., Finalizar contrato del lugar"
                                required
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    {/* Four Column Grid for Meta Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Project Select */}
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="projectId">
                                Proyecto <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base shadow-sm cursor-pointer"
                                    id="projectId"
                                    name="projectId"
                                    value={formData.projectId}
                                    onChange={handleChange}
                                    required
                                >
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>
                        {/* Status Select */}
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="status">Estado</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base shadow-sm cursor-pointer"
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="todo">Por Hacer</option>
                                    <option value="in-progress">En Progreso</option>
                                    <option value="review">En Revisión</option>
                                    <option value="blocked">Bloqueado</option>
                                    <option value="done">Completado</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>
                        {/* Due Date Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="dueDate">Fecha de Vencimiento</label>
                            <div className="relative">
                                <input
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
                                    id="dueDate"
                                    name="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Priority Select */}
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="priority">Prioridad</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base shadow-sm cursor-pointer"
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="high">Alta</option>
                                    <option value="medium">Media</option>
                                    <option value="low">Baja</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Rich Text Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="description">Descripción</label>
                        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all shadow-sm">
                            <textarea
                                className="w-full bg-transparent border-0 text-slate-900 dark:text-white p-4 h-40 focus:ring-0 resize-y placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed"
                                id="description"
                                name="description"
                                placeholder="Agrega notas detalladas sobre esta tarea..."
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>
                    {/* Action Footer */}
                    <div className="flex items-center justify-end gap-3 mt-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 transition-all"
                            type="button"
                            onClick={handleCancel}
                        >
                            Cancelar
                        </button>
                        <button className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 active:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-background-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2" type="submit">
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            Guardar Tarea
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTask;
