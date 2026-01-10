import React, { useMemo } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useTasks } from '../context/TaskContext';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
    const { currentUser } = useAuth();
    const { projects } = useProjects();
    const { tasks } = useTasks();
    const { events } = useEvents();

    const isAdmin = currentUser?.role === 'admin';

    // 1. Calculate Core Statistics
    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const currentTasks = tasks.filter(t => {
            const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            return date >= thirtyDaysAgo;
        });

        const previousTasks = tasks.filter(t => {
            const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        });

        const completedTasks = tasks.filter(t => t.status === 'done');
        const overdueTasks = tasks.filter(t => {
            if (t.status === 'done' || !t.dueDate) return false;
            const dueDate = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
            return dueDate < now;
        });

        const completionRate = tasks.length > 0
            ? ((completedTasks.length / tasks.length) * 100).toFixed(1)
            : 0;

        // Calculate trends
        const taskTrend = previousTasks.length > 0
            ? (((currentTasks.length - previousTasks.length) / previousTasks.length) * 100).toFixed(1)
            : currentTasks.length > 0 ? "+100%" : "0%";

        return {
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            overdueTasks: overdueTasks.length,
            completionRate,
            activeProjects: projects.filter(p => p.status === 'active').length,
            taskTrend: taskTrend.toString().startsWith('-') ? taskTrend : `+${taskTrend}%`,
            previousTasksCount: previousTasks.length
        };
    }, [tasks, projects]);

    // 2. Data for Line Chart (Tasks Created in Last 7 Days)
    const productivityTrends = useMemo(() => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        const data = last7Days.map(date => {
            const dayStr = date.toDateString();
            const created = tasks.filter(t => {
                const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                return tDate.toDateString() === dayStr;
            }).length;
            const completed = tasks.filter(t => {
                const tDate = t.updatedAt?.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
                return t.status === 'done' && tDate.toDateString() === dayStr;
            }).length;
            return { label: days[date.getDay()], created, completed };
        });

        // Generate SVG Path
        const maxVal = Math.max(...data.map(d => Math.max(d.created, d.completed)), 1);
        const points = data.map((d, i) => `${i * 133},${180 - (d.completed / maxVal) * 150}`).join(' L ');
        const pointsSecondary = data.map((d, i) => `${i * 133},${180 - (d.created / maxVal) * 150}`).join(' L ');

        return { data, points, pointsSecondary, labels: data.map(d => d.label) };
    }, [tasks]);

    // 3. Project Distribution (Pie Chart)
    const projectDistribution = useMemo(() => {
        const counts = {
            completed: projects.filter(p => p.status === 'completed').length,
            active: projects.filter(p => p.status === 'active' || p.status === 'in-progress').length,
            hold: projects.filter(p => p.status === 'on-hold').length,
            planning: projects.filter(p => !p.status || p.status === 'planning').length
        };
        const total = projects.length || 1;
        return {
            ...counts,
            percentages: {
                completed: (counts.completed / total) * 100,
                active: (counts.active / total) * 100,
                hold: (counts.hold / total) * 100,
                planning: (counts.planning / total) * 100
            }
        };
    }, [projects]);

    // 4. Project Completion Breakdown (Bar Chart)
    const projectStats = useMemo(() => {
        return projects.slice(0, 4).map(p => ({
            label: p.name,
            value: p.progress || 0
        }));
    }, [projects]);

    return (
        <div className="p-8 space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Reportes y Analíticas</h2>
                    <p className="text-slate-500 dark:text-gray-400">Información en tiempo real de {isAdmin ? 'toda la plataforma' : 'tus proyectos'}.</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tareas Totales"
                    value={stats.totalTasks}
                    icon="assignment"
                    color="text-primary bg-blue-50 dark:bg-blue-900/30"
                    trend={stats.taskTrend}
                    trendColor={stats.taskTrend.startsWith('-') ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}
                />
                <StatCard
                    title="Tasa de Finalización"
                    value={`${stats.completionRate}%`}
                    icon="task_alt"
                    color="text-purple-600 bg-purple-50 dark:bg-purple-900/30"
                    trend="Actual"
                    trendColor="text-blue-600 bg-blue-50"
                />
                <StatCard
                    title="Tareas Atrasadas"
                    value={stats.overdueTasks}
                    icon="error"
                    color="text-red-600 bg-red-50 dark:bg-red-900/30"
                    trend={stats.overdueTasks > 0 ? "Atención" : "Al día"}
                    trendColor={stats.overdueTasks > 0 ? "text-red-600 bg-red-50" : "text-gray-400 bg-gray-50"}
                />
                <StatCard
                    title="Proyectos Activos"
                    value={stats.activeProjects}
                    icon="rocket_launch"
                    color="text-orange-600 bg-orange-50 dark:bg-orange-900/30"
                    trend="En curso"
                    trendColor="text-orange-600 bg-orange-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart: Productivity Trends */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Dinámica de Tareas</h4>
                            <p className="text-sm text-gray-500">Últimos 7 días de actividad</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-primary"></div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Finalizadas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-slate-300"></div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Creadas</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative h-64 w-full mt-4">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
                            <line stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="1" x1="0" x2="800" y1="50" y2="50"></line>
                            <line stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="1" x1="0" x2="800" y1="100" y2="100"></line>
                            <line stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="1" x1="0" x2="800" y1="150" y2="150"></line>
                            {/* Blue path: Completed */}
                            <path d={`M ${productivityTrends.points}`} fill="none" stroke="#137fec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="transition-all duration-500"></path>
                            {/* Gray path: Created */}
                            <path d={`M ${productivityTrends.pointsSecondary}`} fill="none" stroke="#d1d5db" strokeDasharray="8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="transition-all duration-500"></path>
                        </svg>
                        <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400">
                            {productivityTrends.labels.map((label, i) => (
                                <span key={i}>{label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pie Chart: Project Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col transition-colors">
                    <h4 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Estado de Proyectos</h4>
                    <p className="text-sm text-gray-500 mb-8">Desglose de {projects.length} proyectos</p>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative size-48">
                            <svg className="size-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="15"></circle>
                                {/* Completed (Green) */}
                                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#10b981" strokeDasharray={`${(projectDistribution.percentages.completed * 251) / 100} 251`} strokeDashoffset="0" strokeWidth="15" className="transition-all duration-1000"></circle>
                                {/* Active (Blue) */}
                                <circle cx="50" cy="50" fill="transparent" r="40" stroke="#137fec" strokeDasharray={`${(projectDistribution.percentages.active * 251) / 100} 251`} strokeDashoffset={`${-(projectDistribution.percentages.completed * 251) / 100}`} strokeWidth="15" className="transition-all duration-1000"></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">{projects.length}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-400">Proyectos</span>
                            </div>
                        </div>
                        <div className="w-full mt-8 grid grid-cols-2 gap-3">
                            <LegendItem color="bg-[#10b981]" label="Listos" value={projectDistribution.completed} />
                            <LegendItem color="bg-primary" label="Activos" value={projectDistribution.active} />
                            <LegendItem color="bg-[#f59e0b]" label="Pausa" value={projectDistribution.hold || 0} />
                            <LegendItem color="bg-[#9ca3af]" label="Plan" value={projectDistribution.planning || 0} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real Project Progress */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-8 text-slate-900 dark:text-white">
                        <h4 className="text-lg font-bold">Progreso por Proyecto</h4>
                        <span className="text-xs text-gray-500 font-medium">Top 4 Proyectos</span>
                    </div>
                    <div className="space-y-6">
                        {projectStats.length > 0 ? projectStats.map((p, i) => (
                            <ProgressRow key={i} label={p.label} value={p.value} />
                        )) : (
                            <p className="text-sm text-center text-gray-400 py-10">No hay proyectos para mostrar</p>
                        )}
                    </div>
                </div>

                {/* Recent High-Priority Tasks */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col transition-colors">
                    <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/30">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Tareas Críticas</h4>
                    </div>
                    <div className="flex-1 overflow-x-auto text-slate-900 dark:text-white">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Proyecto</th>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Tarea</th>
                                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                {tasks.filter(t => t.priority === 'high').slice(0, 5).length > 0 ? (
                                    tasks.filter(t => t.priority === 'high').slice(0, 5).map(task => (
                                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="px-6 py-4 text-sm font-semibold truncate max-w-[150px]">{task.projectName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{task.title}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${task.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/20' :
                                                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20' :
                                                            task.status === 'review' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20' :
                                                                task.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900/20' :
                                                                    'bg-slate-100 text-slate-700 dark:bg-slate-800'
                                                    }`}>
                                                    {task.status === 'done' ? 'Hecho' :
                                                        task.status === 'in-progress' ? 'En marcha' :
                                                            task.status === 'review' ? 'En revisión' :
                                                                task.status === 'blocked' ? 'Bloqueado' : 'Pendiente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm italic">No hay tareas de alta prioridad pendientes</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, trend, trendColor }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm text-slate-900 dark:text-white transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${color}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendColor}`}>{trend}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
);

const LegendItem = ({ color, label, value }) => (
    <div className="flex items-center gap-2">
        <div className={`size-2 rounded-full ${color}`}></div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label} ({value})</span>
    </div>
);

const ProgressRow = ({ label, value }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{label}</span>
            <span className="font-bold text-primary">{Math.round(value)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-1000`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

export default Reports;
