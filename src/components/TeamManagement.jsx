import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, addDoc, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';
import { sendInvitationEmail } from '../services/emailService';

const TeamManagement = () => {
    const { currentUser } = useAuth();
    const { projects, updateProject } = useProjects();
    const { sendNotification } = useNotifications();
    const { showToast } = useToast();
    const location = useLocation();
    const isAdmin = currentUser?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [selectedProjectId, setSelectedProjectId] = useState('global');

    // Handle initial project from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const pid = params.get('projectId');
        if (pid) {
            setSelectedProjectId(pid);
        } else if (!isAdmin && projects.length > 0) {
            // If not admin and no pid, default to first project if available
            const firstProj = projects.find(p => p.ownerId === currentUser?.uid || p.members?.includes(currentUser?.uid));
            if (firstProj) setSelectedProjectId(firstProj.id);
        }
    }, [location.search, isAdmin, projects, currentUser]);

    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', role: 'user' });

    // 1. Fetch all users once
    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            setAllUsers(users);
            setLoading(false);
        }, (error) => {
            console.error("Error en TeamManagement:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Update visible members based on selection
    useEffect(() => {
        if (selectedProjectId === 'global') {
            setMembers(allUsers);
        } else {
            const project = projects.find(p => p.id === selectedProjectId);
            if (project && project.members) {
                const membersList = allUsers.filter(u => project.members.includes(u.id));
                setMembers(membersList);
            } else {
                setMembers([]);
            }
        }
    }, [selectedProjectId, allUsers, projects]);

    const myProjects = isAdmin ? projects : projects.filter(p => p.ownerId === currentUser?.uid || p.members?.includes(currentUser?.uid));

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'All Roles' || member.role === selectedRole.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await updateDoc(doc(db, "users", memberId), { role: newRole });
        } catch (error) {
            console.error("Error updating role:", error);
        }
    };

    const handleDeleteMember = async (memberId) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este miembro?")) {
            try {
                await deleteDoc(doc(db, "users", memberId));
            } catch (error) {
                console.error("Error deleting member:", error);
            }
        }
    };

    const handleAddToProject = async (userEmail, targetProjectId = null) => {
        const projectId = targetProjectId || selectedProjectId;
        if (projectId === 'global') return;

        const userToAdd = allUsers.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
        const project = projects.find(p => p.id === projectId);

        if (!userToAdd || !project) {
            // Re-use logic in handleInviteMember for finding or creating
            return;
        }

        try {
            const currentMembers = project.members || [];
            if (currentMembers.includes(userToAdd.id)) {
                showToast("Este usuario ya es miembro del proyecto.", "warning");
                return;
            }

            // Check if there is already a pending invitation (admins see all, users see their sent ones)
            const baseQuery = collection(db, "invitations");
            const constraints = [
                where("projectId", "==", projectId),
                where("email", "==", userEmail.toLowerCase()),
                where("status", "==", "pending")
            ];

            // Non-admins can only query what they are allowed to read (their own invites)
            if (!isAdmin) {
                constraints.push(where("inviterId", "==", currentUser.uid));
            }

            const qInvites = query(baseQuery, ...constraints);
            const snapshot = await getDocs(qInvites);
            if (!snapshot.empty) {
                if (userToAdd.status === 'invited') {
                    if (window.confirm("Ya existe una invitación pendiente. ¿Deseas reenviar el correo de invitación?")) {
                        try {
                            await sendInvitationEmail(
                                userToAdd.email.toLowerCase(),
                                userToAdd.displayName || userToAdd.email.split('@')[0],
                                userToAdd.role || 'user'
                            );
                            showToast("Correo de invitación reenviado.", "success");
                        } catch (e) {
                            console.error("Error al reenviar correo de proyecto:", e);
                            showToast(`Error al reenviar el correo: ${e.message || 'Error del servicio'}`, 'error');
                        }
                    }
                } else {
                    showToast("Ya existe una invitación pendiente para este usuario.", "info");
                }
                return;
            }

            // Create Invitation instead of adding directly
            await addDoc(collection(db, "invitations"), {
                projectId: projectId,
                projectName: project.name,
                inviterId: currentUser.uid,
                inviterName: currentUser.displayName || 'Administrador',
                email: userToAdd.email.toLowerCase(),
                targetUserId: userToAdd.id,
                status: 'pending',
                type: 'project_invitation',
                createdAt: serverTimestamp()
            });

            // Send Notification
            await sendNotification(
                userToAdd.id,
                'Invitación a Proyecto',
                `Has sido invitado a colaborar en el proyecto: ${project.name}`,
                'info',
                `/panel`
            );

            showToast(`Invitación enviada a ${userToAdd.displayName}.`, 'success');
        } catch (error) {
            console.error("Error en handleAddToProject:", error);
            showToast(`Error al enviar invitación: ${error.message || 'Error desconocido'}`, 'error');
        }
    };

    const handleRemoveFromProject = async (userId) => {
        if (selectedProjectId === 'global') return;
        if (!window.confirm("¿Seguro que quieres eliminar a este colaborador del proyecto?")) return;

        try {
            const project = projects.find(p => p.id === selectedProjectId);
            const updatedMembers = (project.members || []).filter(id => id !== userId);

            await updateProject(selectedProjectId, {
                members: updatedMembers
            });
            showToast(`Colaborador eliminado del proyecto.`, 'success');
        } catch (error) {
            console.error("Error removing from project:", error);
            showToast('Error al eliminar del proyecto.', 'error');
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const email = inviteData.email.toLowerCase();
            const existingUser = allUsers.find(u => u.email?.toLowerCase() === email);
            const targetProjectId = inviteData.projectId || selectedProjectId;

            if (targetProjectId !== 'global') {
                const project = projects.find(p => p.id === targetProjectId);

                if (existingUser) {
                    // Update: Pass targetProjectId to handleAddToProject
                    await handleAddToProject(email, targetProjectId);
                } else {
                    if (!project) {
                        showToast("Proyecto no encontrado.", "error");
                        return;
                    }
                    // Create unlinked invitation for non-registered user
                    await addDoc(collection(db, "invitations"), {
                        projectId: targetProjectId,
                        projectName: project.name,
                        inviterId: currentUser.uid,
                        inviterName: currentUser.displayName || 'Administrador',
                        email: email,
                        targetUserId: null,
                        status: 'pending',
                        type: 'project_invitation',
                        createdAt: serverTimestamp()
                    });

                    // Still register them as an "invited" user for the global list
                    await addDoc(collection(db, "users"), {
                        email: email,
                        role: inviteData.role || 'user',
                        status: 'invited',
                        invitedAt: serverTimestamp(),
                        displayName: email.split('@')[0],
                    });

                    try {
                        await sendInvitationEmail(
                            email,
                            email.split('@')[0],
                            inviteData.role || 'user'
                        );
                        showToast(`Invitación enviada a ${email}`, 'success');
                    } catch (emailError) {
                        console.error("Error sending email:", emailError);
                        showToast(`Invitado registrado, pero hubo un problema enviando el correo.`, 'warning');
                    }
                }
            } else {
                // Global registration (admins only usually)
                if (existingUser) {
                    if (existingUser.status === 'invited') {
                        if (window.confirm("Este usuario ya tiene una invitación global pendiente. ¿Deseas reenviar el correo?")) {
                            try {
                                await sendInvitationEmail(email, existingUser.displayName || email.split('@')[0], existingUser.role || 'user');
                                showToast(`Invitación reenviada a ${email}`, 'success');
                            } catch (resendError) {
                                console.error("Error al reenviar invitación global:", resendError);
                                showToast(`Error al reenviar invitación: ${resendError.message || 'Error del servicio'}`, 'error');
                            }
                        }
                    } else {
                        showToast("Este usuario ya está registrado.", "warning");
                    }
                } else {
                    await addDoc(collection(db, "users"), {
                        email: email,
                        role: inviteData.role || 'user',
                        status: 'invited',
                        invitedAt: serverTimestamp(),
                        displayName: email.split('@')[0],
                    });

                    try {
                        await sendInvitationEmail(email, email.split('@')[0], inviteData.role || 'user');
                        showToast(`Usuario registrado e invitado: ${email}`, 'success');
                    } catch (emailError) {
                        console.error("Error sending global invitation email:", emailError);
                        showToast(`Usuario registrado, pero el correo falló: ${emailError.message}`, 'warning');
                    }
                }
            }

            setIsInviteModalOpen(false);
            setInviteData({ email: '', role: 'user', projectId: 'global' });
        } catch (error) {
            console.error("Error detallado en handleInviteMember:", error);
            showToast(`Error: ${error.message || 'No se pudo procesar la invitación.'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
            <div className="layout-container max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6 animate-fade-in-up">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white leading-tight">Gestión de Equipo</h1>
                        <p className="text-[#617589] dark:text-slate-400 text-base font-normal">
                            {selectedProjectId === 'global' ? 'Administra todos los usuarios registrados.' : 'Administra los colaboradores de este proyecto.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="h-11 pl-4 pr-10 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 outline-none appearance-none min-w-[200px]"
                            >
                                {isAdmin && <option value="global">🌍 Equipo Global</option>}
                                <optgroup label="Tus Proyectos">
                                    {myProjects.map(p => (
                                        <option key={p.id} value={p.id}>📂 {p.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                        </div>

                        {(isAdmin || selectedProjectId !== 'global') && (
                            <button
                                onClick={() => {
                                    setInviteData({ ...inviteData, projectId: selectedProjectId });
                                    setIsInviteModalOpen(true);
                                }}
                                className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold h-11 px-5 rounded-lg transition-all shadow-lg shadow-primary/20 transform active:scale-95 whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-[20px]">person_add</span>
                                <span>{selectedProjectId === 'global' ? 'Registrar Usuario' : 'Añadir Colaborador'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="w-full lg:w-96">
                        <label className="flex items-center w-full h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border-none overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                            <div className="pl-3 pr-2 text-slate-400 flex items-center justify-center">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="w-full h-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
                                placeholder="Buscar miembros..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-hide">
                        {['All Roles', 'Admin', 'Editor', 'User'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`flex h-8 shrink-0 items-center justify-center px-4 rounded-lg text-sm font-bold transition-all ${selectedRole === role
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {role === 'User' ? 'Viewer' : role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Members Table */}
                <div className="w-full">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark overflow-hidden shadow-sm transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 w-16"></th>
                                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Nombre</th>
                                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Email</th>
                                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Rol</th>
                                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Estado</th>
                                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-slate-400">Cargando miembros...</td>
                                        </tr>
                                    ) : filteredMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-slate-400">No se encontraron miembros.</td>
                                        </tr>
                                    ) : filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="py-4 px-6 align-middle">
                                                <UserAvatar user={member} size="sm" />
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{member.displayName || 'Sin nombre'}</p>
                                                <p className="text-xs text-slate-500 sm:hidden mt-0.5">{member.email}</p>
                                            </td>
                                            <td className="py-4 px-6 align-middle hidden sm:table-cell">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${member.role === 'admin'
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                                    : member.role === 'editor'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {member.role === 'admin' ? 'verified_user' : member.role === 'editor' ? 'edit_note' : 'visibility'}
                                                    </span>
                                                    {member.role || 'user'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${member.lastLogin ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-orange-400'}`}></span>
                                                    <span className={`text-sm font-bold ${member.lastLogin ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                        {member.lastLogin ? 'Activo' : 'Pendiente'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 align-middle text-right">
                                                <div className="relative inline-block group/menu">
                                                    <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        <span className="material-symbols-outlined">more_vert</span>
                                                    </button>
                                                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all transform scale-95 group-hover/menu:scale-100 origin-bottom-right text-left">
                                                        {selectedProjectId === 'global' ? isAdmin && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateRole(member.id, member.role === 'admin' ? 'user' : 'admin')}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                                                    {member.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateRole(member.id, member.role === 'editor' ? 'user' : 'editor')}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                                                    {member.role === 'editor' ? 'Quitar Editor' : 'Hacer Editor'}
                                                                </button>
                                                                <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>
                                                                <button
                                                                    onClick={() => handleDeleteMember(member.id)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    Eliminar
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleRemoveFromProject(member.id)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">person_remove</span>
                                                                Quitar del Proyecto
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {
                    isInviteModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                        {selectedProjectId === 'global' ? 'Registrar Miembro' : 'Añadir al Proyecto'}
                                    </h2>
                                    <button onClick={() => setIsInviteModalOpen(false)}>
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <form onSubmit={handleInviteMember} className="p-6 flex flex-col gap-5">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full h-11 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white"
                                            placeholder="correo@ejemplo.com"
                                            value={inviteData.email}
                                            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Proyecto (Habilitar Colaboración)</label>
                                        <select
                                            className="w-full h-11 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white"
                                            value={inviteData.projectId || selectedProjectId}
                                            onChange={(e) => setInviteData({ ...inviteData, projectId: e.target.value })}
                                        >
                                            {isAdmin && <option value="global">Sin Proyecto (Solo Registro)</option>}
                                            {myProjects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {inviteData.role && (selectedProjectId === 'global' || inviteData.projectId === 'global') && (
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-bold text-slate-700 dark:text-gray-300">Rol Global</label>
                                            <select
                                                className="w-full h-11 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 text-slate-900 dark:text-white"
                                                value={inviteData.role}
                                                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                            >
                                                <option value="user">Viewer</option>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold">Cancelar</button>
                                        <button type="submit" className="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20">
                                            {(inviteData.projectId || selectedProjectId) === 'global' ? 'Registrar' : 'Enviar Invitación'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default TeamManagement;
