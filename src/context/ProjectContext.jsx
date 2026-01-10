import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
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
    setDoc,
    getDoc,
    getDocs,
    where,
    or
} from 'firebase/firestore';

const ProjectContext = createContext();

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjects debe usarse dentro de ProjectProvider');
    }
    return context;
};

export const ProjectProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Crear proyecto "General" por defecto si no existe
    useEffect(() => {
        const ensureDefaultProject = async () => {
            if (!currentUser) return; // Prevent permission error if not logged in
            try {
                const defaultProjectRef = doc(db, 'projects', 'general-project');
                const defaultProjectSnap = await getDoc(defaultProjectRef);

                if (!defaultProjectSnap.exists()) {
                    await setDoc(defaultProjectRef, {
                        name: 'General',
                        description: 'Proyecto por defecto para tareas sin proyecto específico',
                        category: 'General',
                        status: 'active',
                        progress: 0,
                        imageUrl: '',
                        isPublic: true, // Allow everyone to see General
                        members: [], // Public for now or add all admins? 
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    console.log('Proyecto General creado');
                }
            } catch (error) {
                console.error('Error al crear proyecto por defecto:', error);
            }
        };

        ensureDefaultProject();
    }, [currentUser]);

    // Escuchar cambios en tiempo real de Firestore con filtrado
    useEffect(() => {
        if (!currentUser) {
            setProjects([]);
            setLoading(false);
            return;
        }

        const projectsRef = collection(db, 'projects');
        let q;

        if (currentUser.role === 'admin') {
            q = query(projectsRef, orderBy('createdAt', 'desc'));
        } else {
            // Show projects where user is owner, member, or if it's public (General)
            q = query(
                projectsRef,
                or(
                    where('ownerId', '==', currentUser.uid),
                    where('members', 'array-contains', currentUser.uid),
                    where('isPublic', '==', true)
                ),
                orderBy('createdAt', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProjects(projectsData);
            setLoading(false);
        }, (error) => {
            console.error('Error al cargar proyectos:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Calcular progreso del proyecto basado en tareas completadas
    const calculateProjectProgress = async (projectId) => {
        try {
            const tasksRef = collection(db, 'tasks');
            const q = query(tasksRef, where('projectId', '==', projectId));
            const snapshot = await getDocs(q);

            const tasks = snapshot.docs.map(doc => doc.data());
            const totalTasks = tasks.length;

            if (totalTasks === 0) {
                // Si no hay tareas, progreso es 0
                await updateProjectProgress(projectId, 0);
                return 0;
            }

            const completedTasks = tasks.filter(task => task.status === 'done').length;
            const progress = Math.round((completedTasks / totalTasks) * 100);

            await updateProjectProgress(projectId, progress);
            return progress;
        } catch (error) {
            console.error('Error al calcular progreso:', error);
            return 0;
        }
    };

    const updateProjectProgress = async (projectId, progress) => {
        try {
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                progress,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error al actualizar progreso:', error);
        }
    };

    const addProject = async (project) => {
        try {
            const projectsRef = collection(db, 'projects');
            const newProject = {
                ...project,
                progress: 0, // Inicia en 0
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(projectsRef, newProject);
            return { id: docRef.id, ...newProject };
        } catch (error) {
            console.error('Error al crear proyecto:', error);
            throw error;
        }
    };

    const updateProject = async (id, updates) => {
        try {
            const projectRef = doc(db, 'projects', id);
            await updateDoc(projectRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error al actualizar proyecto:', error);
            throw error;
        }
    };

    const deleteProject = async (id) => {
        try {
            // No permitir eliminar el proyecto General
            if (id === 'general-project') {
                showToast('No se puede eliminar el proyecto General', 'error');
                return;
            }

            const projectRef = doc(db, 'projects', id);
            await deleteDoc(projectRef);
        } catch (error) {
            console.error('Error al eliminar proyecto:', error);
            throw error;
        }
    };

    const value = {
        projects,
        loading,
        addProject,
        updateProject,
        deleteProject,
        calculateProjectProgress,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};
