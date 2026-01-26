import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    getDoc,
    getDocs,
    where,
    or
} from 'firebase/firestore';

import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useProjects } from './ProjectContext';

const TaskContext = createContext();

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks debe usarse dentro de TaskProvider');
    }
    return context;
};

export const TaskProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const { projects } = useProjects();
    const { showToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Escuchar cambios en tiempo real de Firestore
    useEffect(() => {
        if (!currentUser) {
            setTasks([]);
            setLoading(false);
            return;
        }

        const tasksRef = collection(db, 'tasks');
        let q;

        if (currentUser.role === 'admin' || currentUser.role === 'owner') {
            q = query(tasksRef, orderBy('createdAt', 'desc'));
        } else {
            // Usuarios normales: Sus tareas Y tareas de proyectos donde son miembros
            // Limitamos a 30 proyectos para la cláusula 'in'
            const visibleProjectIds = projects.map(p => p.id).slice(0, 30);

            if (visibleProjectIds.length > 0) {
                q = query(
                    tasksRef,
                    or(
                        where('userId', '==', currentUser.uid),
                        where('projectId', 'in', visibleProjectIds)
                    ),
                    orderBy('createdAt', 'desc')
                );
            } else {
                q = query(
                    tasksRef,
                    where('userId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc')
                );
            }
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTasks(tasksData);
            setLoading(false);
        }, (error) => {
            console.error('Error al cargar tareas:', error);
            // Si falla por falta de índice u otro motivo, intentar fallback simple
            if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
                console.log("Intentando carga fallback (solo mis tareas)...");
                // Fallback query logic logic here if needed, but for now just logging
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, projects]);

    // Función para actualizar progreso del proyecto directamente
    const updateProjectProgress = async (projectId) => {
        try {
            if (!projectId || projectId === 'general-project') return;

            const projectRef = doc(db, 'projects', projectId);
            const projectSnap = await getDoc(projectRef);

            // Si el proyecto no existe, no intentamos actualizar el progreso
            if (!projectSnap.exists()) {
                console.warn(`No se pudo actualizar el progreso: El proyecto ${projectId} no existe.`);
                return;
            }

            // Obtener todas las tareas del proyecto
            const tasksRef = collection(db, 'tasks');
            const q = query(tasksRef, where('projectId', '==', projectId));
            const snapshot = await getDocs(q);

            const projectTasks = snapshot.docs.map(doc => doc.data());
            const totalTasks = projectTasks.length;

            let progress = 0;
            if (totalTasks > 0) {
                const completedTasks = projectTasks.filter(task => task.status === 'done').length;
                progress = Math.round((completedTasks / totalTasks) * 100);
            }

            // Actualizar el progreso del proyecto
            await updateDoc(projectRef, {
                progress,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error al actualizar progreso del proyecto:', error);
        }
    };

    const addTask = async (task) => {
        try {
            const tasksRef = collection(db, 'tasks');

            // Obtener nombre del proyecto
            let projectName = 'General';
            if (task.projectId && task.projectId !== 'general-project') {
                const projectRef = doc(db, 'projects', task.projectId);
                const projectSnap = await getDoc(projectRef);
                if (projectSnap.exists()) {
                    projectName = projectSnap.data().name;
                }
            }

            const newTask = {
                ...task,
                userId: currentUser.uid, // Asegurar que tenga el ID del dueño
                projectId: task.projectId || 'general-project', // Por defecto: General
                projectName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(tasksRef, newTask);

            // Actualizar progreso del proyecto
            try {
                await updateProjectProgress(newTask.projectId);
            } catch (progressError) {
                console.error('Error no crítico al actualizar progreso del proyecto:', progressError);
                // Continuamos aunque falle la actualización de progreso
            }

            return { id: docRef.id, ...newTask };
        } catch (error) {
            console.error('Error CRÍTICO al crear tarea:', error);
            if (error.code === 'permission-denied') {
                showToast('No tienes permiso para realizar esta acción. Verifica que has iniciado sesión.', 'error');
            }
            throw error;
        }
    };

    const updateTask = async (id, updates) => {
        try {
            const taskRef = doc(db, 'tasks', id);

            // Obtener la tarea actual para saber su projectId
            const taskSnap = await getDoc(taskRef);
            const currentTask = taskSnap.data();

            await updateDoc(taskRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

            // Actualizar progreso del proyecto
            if (currentTask?.projectId) {
                await updateProjectProgress(currentTask.projectId);
            }
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            throw error;
        }
    };

    const deleteTask = async (id) => {
        try {
            // Obtener la tarea antes de eliminarla para saber su projectId
            const taskRef = doc(db, 'tasks', id);
            const taskSnap = await getDoc(taskRef);
            const task = taskSnap.data();

            await deleteDoc(taskRef);

            // Actualizar progreso del proyecto
            if (task?.projectId) {
                await updateProjectProgress(task.projectId);
            }
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            throw error;
        }
    };

    const toggleTaskComplete = async (id) => {
        try {
            const taskRef = doc(db, 'tasks', id);
            const taskSnap = await getDoc(taskRef);
            const task = taskSnap.data();

            if (task) {
                const newStatus = task.status === 'done' ? 'todo' : 'done';
                await updateTask(id, { status: newStatus });
            }
        } catch (error) {
            console.error('Error al cambiar estado de tarea:', error);
            throw error;
        }
    };

    const getTasksByProject = (projectId) => {
        return tasks.filter(task => task.projectId === projectId);
    };

    const value = {
        tasks,
        loading,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        getTasksByProject,
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};
