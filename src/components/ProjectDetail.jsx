import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useProjects } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import StatusSelector from './StatusSelector';
import UserAvatar from './UserAvatar';

const getPriorityInfo = (priority) => {
    const priorities = {
        'high': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'ALTA PRIORIDAD', icon: 'priority_high' },
        'medium': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', label: 'MEDIA', icon: 'signal_cellular_alt_2_bar' },
        'low': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'BAJA', icon: 'signal_cellular_alt_1_bar' },
    };
    return priorities[priority] || priorities.medium;
};

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { tasks, toggleTaskComplete, deleteTask, updateTask } = useTasks();
    const { deleteProject } = useProjects();
    const { showToast } = useToast();
    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            await updateTask(taskId, { status: newStatus });
            showToast('Estado de tarea actualizado.', 'success', 2000);
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            showToast('Error al actualizar estado.', 'error');
        }
    };

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tasks'); // tasks, team, info
    const [projectTasks, setProjectTasks] = useState([]);
    const [memberProfiles, setMemberProfiles] = useState([]);

    useEffect(() => {
        const projectRef = doc(db, 'projects', id);

        const unsubscribe = onSnapshot(projectRef, (docSnap) => {
            if (docSnap.exists()) {
                setProject({ id: docSnap.id, ...docSnap.data() });
            } else {
                navigate('/projects');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, navigate]);

    useEffect(() => {
        const q = query(
            collection(db, 'tasks'),
            where('projectId', '==', id),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProjectTasks(tasksData);
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (project && project.members) {
            const fetchMemberProfiles = async () => {
                const profiles = [];
                for (const uid of project.members) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        if (userDoc.exists()) {
                            profiles.push({ id: userDoc.id, ...userDoc.data() });
                        }
                    } catch (error) {
                        console.error("Error fetching user profile:", uid, error);
                    }
                }
                setMemberProfiles(profiles);
            };
            fetchMemberProfiles();
        }
    }, [project]);

    const handleDeleteProject = async () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto y todas sus tareas?')) {
            try {
                await deleteProject(id);
                showToast('Proyecto eliminado con éxito.', 'success');
                navigate('/projects');
            } catch (error) {
                console.error("Error deleting project:", error);
                showToast('Error al eliminar el proyecto.', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500">Cargando detalles del proyecto...</p>
            </div>
        );
    }

    if (!project) return null;

    const getStatusStyles = (status) => {
        const styles = {
            'active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
            'planning': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
            'on-hold': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
            'completed': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
        };
        return styles[status] || styles.active;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header / Breadcrumbs */}
            <nav className="flex mb-8 text-sm font-medium" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                    <li>
                        <Link to="/projects" className="text-slate-500 hover:text-primary transition-colors">Proyectos</Link>
                    </li>
                    <li className="text-slate-400">/</li>
                    <li className="text-slate-900 dark:text-white truncate max-w-[200px]">{project.name}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Project Hero Card */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        {project.imageUrl && (
                            <div className="h-48 w-full overflow-hidden">
                                <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-6 md:p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${getStatusStyles(project.status)}`}>
                                        {project.status === 'active' ? 'Activo' :
                                            project.status === 'planning' ? 'Planificación' :
                                                project.status === 'on-hold' ? 'En Espera' : 'Completado'}
                                    </span>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                        {project.name}
                                    </h1>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/projects/edit/${id}`)}
                                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={handleDeleteProject}
                                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                {project.description || 'Sin descripción disponible.'}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Categoría</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{project.category || 'General'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vencimiento</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tareas</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{projectTasks.length}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Progreso</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${project.progress || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-primary">{project.progress || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'tasks' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Historial de Tareas
                            {activeTab === 'tasks' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('team')}
                            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'team' ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Equipo ({project.members?.length || 1})
                            {activeTab === 'team' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-4">
                        {activeTab === 'tasks' && (
                            <div className="animate-fade-in-up">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tareas del Proyecto</h3>
                                    <Link
                                        to={`/projects/${id}/tasks/create`}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Añadir Tarea
                                    </Link>
                                </div>

                                {projectTasks.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">assignment</span>
                                        <p className="text-slate-500">Aún no hay tareas en este proyecto.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {projectTasks.map(task => {
                                            const priority = getPriorityInfo(task.priority);
                                            return (
                                                <div
                                                    key={task.id}
                                                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl hover-glow transition-all"
                                                >
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <StatusSelector
                                                            currentStatus={task.status}
                                                            onStatusChange={(newStatus) => handleStatusUpdate(task.id, newStatus)}
                                                            size="sm"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`${priority.bg} ${priority.text} text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1`}>
                                                                    <span className="material-symbols-outlined text-[10px] filled">{priority.icon}</span>
                                                                    {priority.label}
                                                                </span>
                                                                <h4 className={`font-bold transition-all line-clamp-1 ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                                                                    {task.name || task.title}
                                                                </h4>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 mt-1">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sin fecha'}
                                                                </div>
                                                                {task.description && (
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex-1">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('¿Eliminar esta tarea?')) {
                                                                    deleteTask(task.id);
                                                                    showToast('Tarea eliminada.', 'info');
                                                                }
                                                            }}
                                                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold text-xs flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="animate-fade-in-up space-y-4">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Colaboradores</h3>
                                    <Link
                                        to={`/team?projectId=${id}`}
                                        className="text-primary hover:text-blue-600 text-sm font-bold flex items-center gap-1 group"
                                    >
                                        Gestionar Equipo
                                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Owner first */}
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <UserAvatar user={currentUser} size="md" />
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{currentUser?.displayName} (Tú)</div>
                                            <div className="text-xs text-slate-500 uppercase font-black tracking-widest">Propietario</div>
                                        </div>
                                    </div>

                                    {/* Other members */}
                                    {memberProfiles.filter(m => m.id !== currentUser?.uid).map((member) => (
                                        <div key={member.id} className="flex items-center gap-3 p-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl">
                                            <UserAvatar user={member} size="md" />
                                            <div>
                                                <div className="font-bold text-slate-700 dark:text-slate-300 uppercase">{member.displayName}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{member.role === 'admin' ? 'Admin Global' : member.role === 'editor' ? 'Editor' : 'Colaborador'}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {memberProfiles.length <= 1 && project.members?.length > 1 && (
                                        <div className="col-span-full py-4 text-center text-slate-400 text-sm animate-pulse">
                                            Cargando perfiles...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Actividad Reciente</h3>
                        <div className="space-y-6 relative ml-4">
                            <div className="absolute left-[-16px] top-2 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800" />

                            {projectTasks.slice(0, 5).map((task) => (
                                <div key={task.id} className="relative">
                                    <div className={`absolute left-[-23px] top-1.5 size-4 rounded-full border-4 border-white dark:border-surface-dark ${task.status === 'done' ? 'bg-emerald-500' : 'bg-primary'}`} />
                                    <div className="text-xs font-bold text-slate-400 mb-1">
                                        {task.createdAt?.toDate ? task.createdAt.toDate().toLocaleDateString() : 'Hoy'}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                                        {task.status === 'done' ? 'Completada: ' : 'Nueva tarea: '}
                                        <span className="font-medium text-slate-600 dark:text-slate-400">{task.title}</span>
                                    </div>
                                </div>
                            ))}

                            {projectTasks.length === 0 && (
                                <p className="text-sm text-slate-500 italic">No hay actividad registrada aún.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
