import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useTasks } from '../context/TaskContext';
import { useEvents } from '../context/EventContext';
import { doc, updateDoc, collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const Panel = () => {
    // 1. Get Authentication Context First
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // 2. Compute Roles Early
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
    const isOrganizer = currentUser?.role === 'organizer';
    const canManage = isAdmin || isOrganizer;

    // 3. Get Other Contexts
    const { projects } = useProjects();
    const { tasks, toggleTaskComplete } = useTasks();
    const { events } = useEvents();

    // 4. Initial State
    const [pendingPayments, setPendingPayments] = useState([]);
    const [verifying, setVerifying] = useState(null);
    const [myRegistrationsCount, setMyRegistrationsCount] = useState(0);

    useEffect(() => {
        // Double check isAdmin inside the effect to be safe
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) return;

        try {
            const registrationsRef = collectionGroup(db, 'registrations');
            const q = query(registrationsRef, where('status', '==', 'pending_payment'));

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const payments = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ref: doc.ref,
                        ...doc.data()
                    }));
                    setPendingPayments(payments);
                },
                (error) => {
                    console.error("Error en Panel (pagos pendientes):", error);
                    setPendingPayments([]);
                }
            );
            return () => unsubscribe();
        } catch (error) {
            console.error("Error setting up collection group query:", error);
        }
    }, [currentUser?.role]); // Dependency on the specific field that determines admin status

    // 6. My Registrations Count
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collectionGroup(db, 'registrations'),
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyRegistrationsCount(snapshot.docs.length);
        }, (error) => {
            console.error("Error en Panel (mis registros):", error);
            setMyRegistrationsCount(0);
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);

    const handleApprovePayment = async (payment) => {
        try {
            setVerifying(payment.id);
            await updateDoc(payment.ref, {
                status: 'confirmed',
                verifiedAt: new Date(),
                verifiedBy: currentUser.uid
            });
            showToast(`Pago verificado para ${payment.userName}`, 'success');
        } catch (error) {
            console.error("Error approving payment:", error);
            showToast("Error al verificar el pago", 'error');
        } finally {
            setVerifying(null);
        }
    };

    const activeProjects = projects.filter(p => p.status === 'active');
    const activeEvents = events.filter(e => e.status === 'published' || e.status === 'active');
    const recentProjects = projects.slice(0, 5);
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const upcomingEvents = events.slice(0, 5);

    const handleBecomeAdmin = async () => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, { role: 'admin' });
            showToast('¡Ahora eres Administrador! La página se recargará.', 'success');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error("Error updating role:", error);
            showToast("Error al actualizar el rol.", 'error');
        }
    };

    return (
        <div className="p-4 md:p-8 lg:px-12 animate-fade-in-up">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                <header className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                            Hola, {currentUser?.displayName?.split(' ')[0] || 'Usuario'} 👋
                        </h2>
                        <p className="text-slate-500 dark:text-[#9dabb9] text-base font-normal leading-normal">
                            Aquí tienes un resumen de tu actividad hoy.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {canManage && (
                            <>
                                <Link to="/tasks/create" className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark text-slate-700 dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">add_task</span>
                                    <span>Nueva Tarea</span>
                                </Link>
                                <Link to="/projects/create" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all gap-2">
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    <span className="truncate">Crear Proyecto</span>
                                </Link>
                            </>
                        )}
                        {!canManage && (
                            <Link to="/events" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all gap-2">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                                <span className="truncate">Explorar Eventos</span>
                            </Link>
                        )}
                    </div>
                </header>

                {/* DEV MODE: Admin Promotion (Hidden for most, useful for testing) */}
                {currentUser?.role === 'assistant' && (
                    <div className="bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between gap-4 opacity-50 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">info</span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Estás en modo <strong>Asistente</strong>. Puedes subir de nivel si necesitas gestionar equipos.
                            </p>
                        </div>
                        <button
                            onClick={handleBecomeAdmin}
                            className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-700"
                        >
                            Promover a Organizador
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                {/* Stats Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Management Stats (Organizer/Admin) */}
                    {canManage && (
                        <>
                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal">Eventos Activos</p>
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                        <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <p className="text-slate-900 dark:text-white tracking-light text-2xl font-bold leading-tight">{activeEvents.length}</p>
                                    <span className="text-xs text-slate-400">Total: {events.length}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal">Tareas Pendientes</p>
                                    <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
                                        <span className="material-symbols-outlined text-orange-500 text-[20px]">list_alt</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <p className="text-slate-900 dark:text-white tracking-light text-2xl font-bold leading-tight">{pendingTasks.length}</p>
                                    <Link to="/tasks" className="text-xs text-primary hover:underline">Ver todas</Link>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Participant Stats (Always visible or primarily for Assistants) */}
                    <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal">Mis Eventos</p>
                            <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                                <span className="material-symbols-outlined text-green-500 text-[20px]">event_available</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-slate-900 dark:text-white tracking-light text-2xl font-bold leading-tight">{myRegistrationsCount}</p>
                            <Link to="/events/my-events" className="text-xs text-primary hover:underline">Ver mis tickets</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl p-6 border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal">Eventos Próximos</p>
                            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                                <span className="material-symbols-outlined text-purple-500 text-[20px]">event</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-slate-900 dark:text-white tracking-light text-2xl font-bold leading-tight">{upcomingEvents.length}</p>
                            <Link to="/events" className="text-xs text-primary hover:underline">Ver calendario</Link>
                        </div>
                    </div>
                </section>

                {/* Payment Verification Section (Admin Only) */}
                {isAdmin && pendingPayments.length > 0 && (
                    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500">payments</span>
                                Verificación de Pagos Pendientes
                            </h2>
                            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-black px-2 py-1 rounded-full">
                                {pendingPayments.length} PENDIENTES
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingPayments.map(payment => (
                                <div key={payment.id} className="p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-bold">
                                            {payment.userName?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{payment.userName}</span>
                                            <span className="text-xs text-slate-500 truncate">{payment.userEmail}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-slate-500">Monto Esperado:</span>
                                            <span className="font-black text-slate-900 dark:text-white">{payment.pricePaid} USDT</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-500 text-[10px]">Registrado el:</span>
                                            <span className="text-slate-400">
                                                {payment.registeredAt?.toDate ? payment.registeredAt.toDate().toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleApprovePayment(payment)}
                                        disabled={verifying === payment.id}
                                        className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {verifying === payment.id ? (
                                            <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[18px]">verified</span>
                                                Confirmar Pago
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Projects & Tasks Sections - Only for canManage users */}
                    {canManage && (
                        <>
                            {/* Projects Table */}
                            <section className="lg:col-span-2 flex flex-col gap-4">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">Proyectos Recientes</h2>
                                    <Link to="/projects" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                        Ver Todos <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </Link>
                                </div>

                                {projects.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-surface-dark rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_off</span>
                                        <p className="text-slate-500">No hay proyectos creados aún</p>
                                        <Link to="/projects/create" className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20">
                                            Crear mi primer proyecto
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[600px]">
                                                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-border-dark">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Proyecto</th>
                                                        <th className="px-6 py-4 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider w-1/4">Progreso</th>
                                                        <th className="px-6 py-4 text-left text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-border-dark">
                                                    {recentProjects.map(project => (
                                                        <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                                        <span className="material-symbols-outlined">folder</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">{project.name}</div>
                                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{project.category}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                                                            style={{ width: `${project.progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{project.progress}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${project.status === 'active'
                                                                    ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/10 dark:text-blue-400'
                                                                    : 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/10 dark:text-green-400'
                                                                    }`}>
                                                                    {project.status === 'active' ? 'En Progreso' : 'Completado'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Tasks Sidebar */}
                            <section className="lg:col-span-1 flex flex-col gap-8">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-1">
                                        <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">Tareas Pendientes</h2>
                                    </div>

                                    {tasks.length === 0 ? (
                                        <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                            <p className="text-slate-500 text-sm">¡Estás al día! No hay tareas pendientes.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {tasks.filter(t => t.status !== 'done').slice(0, 5).map(task => (
                                                <div key={task.id} className="group flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm hover:border-primary/50 dark:hover:border-primary/50 transition-colors">
                                                    <div className="mt-0.5">
                                                        <input
                                                            checked={task.status === 'done'}
                                                            onChange={() => toggleTaskComplete(task.id)}
                                                            className="size-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                                                            type="checkbox"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className={`text-sm font-medium transition-colors ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white group-hover:text-primary'
                                                                }`}>
                                                                {task.title}
                                                            </p>
                                                            {task.priority === 'high' && (
                                                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded dark:bg-red-500/20 dark:text-red-300">ALTA</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="material-symbols-outlined text-[14px] text-slate-400">folder_open</span>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{task.projectName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <Link to="/tasks/create" className="flex items-center justify-center p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-transparent text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer transition-colors w-full">
                                                <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
                                                <span className="text-sm font-medium">Agregar Tarea</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Panel;
