import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { uploadImage } from '../services/cloudinaryService';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';

const CreateProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addProject, updateProject, projects } = useProjects();
    const { addTask } = useTasks();
    const { showToast } = useToast();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        status: 'planning',
        dueDate: '',
        imageUrl: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [initialTasks, setInitialTasks] = useState([
        { title: '', priority: 'medium' },
        { title: '', priority: 'medium' },
        { title: '', priority: 'medium' }
    ]);

    // New Collaboration States
    const { currentUser } = useAuth();
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch Users
                const querySnapshot = await getDocs(collection(db, "users"));
                const users = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(user => user.id !== currentUser?.uid && user.status !== 'invited');
                setAvailableUsers(users);

                // 2. Fetch Project if Edit Mode
                if (isEditMode) {
                    const projectRef = doc(db, 'projects', id);
                    const projectSnap = await getDoc(projectRef);
                    if (projectSnap.exists()) {
                        const data = projectSnap.data();
                        setFormData({
                            name: data.name || '',
                            description: data.description || '',
                            category: data.category || '',
                            status: data.status || 'planning',
                            dueDate: data.dueDate || '',
                            imageUrl: data.imageUrl || ''
                        });
                        setPreviewUrl(data.imageUrl || '');

                        // Map member IDs back to profile objects for the chips
                        if (data.members && data.members.length > 0) {
                            const memberObjects = users.filter(u => data.members.includes(u.id));
                            setSelectedMembers(memberObjects);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, [currentUser, id, isEditMode]);

    const handleSelectMember = (user) => {
        if (!selectedMembers.find(m => m.id === user.id)) {
            setSelectedMembers([...selectedMembers, user]);
        }
        setShowUserDropdown(false);
    };

    const handleRemoveMember = (id) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== id));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                finalImageUrl = await uploadImage(imageFile);
            }

            if (isEditMode) {
                const projectRef = doc(db, 'projects', id);
                const projectSnap = await getDoc(projectRef);
                const currentMembers = projectSnap.exists() ? (projectSnap.data().members || []) : [];

                // Keep only members that are still in selectedMembers
                const keptMembers = currentMembers.filter(mid =>
                    mid === currentUser.uid || selectedMembers.some(sm => sm.id === mid)
                );

                // Identify new members to invite
                const newMembersToInvite = selectedMembers.filter(sm => !currentMembers.includes(sm.id));

                await updateProject(id, {
                    ...formData,
                    imageUrl: finalImageUrl,
                    members: keptMembers
                });

                // Send invitations to new members
                for (const member of newMembersToInvite) {
                    // Check for existing pending invitation
                    const q = query(collection(db, "invitations"),
                        where("projectId", "==", id),
                        where("email", "==", member.email.toLowerCase()),
                        where("status", "==", "pending")
                    );
                    const snapshot = await getDocs(q);

                    if (snapshot.empty) {
                        await addDoc(collection(db, "invitations"), {
                            projectId: id,
                            projectName: formData.name,
                            inviterId: currentUser.uid,
                            inviterName: currentUser.displayName || 'Administrador',
                            email: member.email.toLowerCase(),
                            targetUserId: member.id,
                            status: 'pending',
                            type: 'project_invitation',
                            createdAt: serverTimestamp()
                        });
                    }
                }

                showToast('Proyecto actualizado con éxito.', 'success');
                navigate(`/projects/${id}`);
            } else {
                // Create mode
                const newProject = await addProject({
                    ...formData,
                    imageUrl: finalImageUrl,
                    members: [currentUser?.uid], // Only owner initially
                    ownerId: currentUser?.uid
                });

                // Send invitations to all selected members
                for (const member of selectedMembers) {
                    await addDoc(collection(db, "invitations"), {
                        projectId: newProject.id,
                        projectName: formData.name,
                        inviterId: currentUser.uid,
                        inviterName: currentUser.displayName || 'Administrador',
                        email: member.email.toLowerCase(),
                        targetUserId: member.id,
                        status: 'pending',
                        type: 'project_invitation',
                        createdAt: serverTimestamp()
                    });
                }

                // Save initial tasks
                const validTasks = initialTasks.filter(t => t.title.trim() !== '');
                for (const task of validTasks) {
                    await addTask({
                        ...task,
                        projectId: newProject.id,
                        projectName: newProject.name,
                        status: 'todo',
                        userId: currentUser?.uid
                    });
                }
                showToast('¡Proyecto creado con éxito! Invitaciones enviadas.', 'success');
                navigate(`/projects/${newProject.id}`);
            }
        } catch (error) {
            console.error('Error al guardar proyecto:', error);
            const errorMsg = error.response?.data?.error?.message || error.message || 'Error desconocido';
            showToast(`Hubo un error al guardar el proyecto: ${errorMsg}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        navigate('/projects');
    };

    return (
        <div className="flex flex-col max-w-[960px] w-full mx-auto px-6 py-8">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <Link className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors flex items-center gap-1" to="/projects">
                            <span className="material-symbols-outlined text-[18px]">folder</span>
                            Proyectos
                        </Link>
                    </li>
                    <li className="text-slate-500 dark:text-slate-400 text-sm font-medium">/</li>
                    <li>
                        <span aria-current="page" className="text-slate-900 dark:text-white text-sm font-semibold">{isEditMode ? 'Editar Proyecto' : 'Crear Proyecto'}</span>
                    </li>
                </ol>
            </nav>

            {/* Page Heading */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div>
                    <h2 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">{isEditMode ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{isEditMode ? 'Modifica los detalles de tu proyecto' : 'Agrega un nuevo proyecto a tu lista'}</p>
                </div>
            </div>

            {/* Main Form Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
                    {/* Project Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium flex items-center gap-1" htmlFor="projectName">
                            Nombre del Proyecto <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                autoFocus
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base font-normal shadow-sm group-hover:border-slate-400 dark:group-hover:border-slate-500"
                                id="projectName"
                                name="name"
                                placeholder="ej., Conferencia Anual Tech 2024"
                                required
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Two Column Grid for Meta Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="category">Categoría</label>
                            <input
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base shadow-sm"
                                id="category"
                                name="category"
                                placeholder="ej., Corporativo, Festival"
                                type="text"
                                value={formData.category}
                                onChange={handleChange}
                            />
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
                                    <option value="planning">Planificación</option>
                                    <option value="active">Activo</option>
                                    <option value="on-hold">En Espera</option>
                                    <option value="completed">Completado</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="dueDate">Fecha de Vencimiento</label>
                        <input
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-white h-14 px-4 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
                            id="dueDate"
                            name="dueDate"
                            type="date"
                            value={formData.dueDate}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">El progreso se calculará automáticamente basado en las tareas completadas</p>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="description">Descripción</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white p-4 h-40 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none resize-y placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed"
                            id="description"
                            name="description"
                            placeholder="Agrega una descripción detallada del proyecto..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    {/* Image Upload */}
                    <div className="flex flex-col gap-4">
                        <label className="text-slate-900 dark:text-white text-sm font-medium" htmlFor="image">
                            Imagen del Proyecto
                        </label>

                        {previewUrl ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageFile(null);
                                        setPreviewUrl('');
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-background-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">cloud_upload</span>
                                        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">SVG, PNG, JPG (MAX. 800x400px)</p>
                                    </div>
                                    <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Collaboration Section */}
                    <div className="flex flex-col gap-4 p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">group_add</span>
                                Invitar Miembros (Opcional)
                            </label>
                            <span className="text-xs text-slate-500">{selectedMembers.length} seleccionados</span>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="w-full flex items-center justify-between h-12 px-4 rounded-lg bg-white dark:bg-background-dark border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:border-primary transition-all"
                            >
                                <span>Seleccionar colaboradores...</span>
                                <span className="material-symbols-outlined">expand_more</span>
                            </button>

                            {showUserDropdown && (
                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                    {availableUsers.length > 0 ? (
                                        availableUsers
                                            .filter(user => !selectedMembers.find(m => m.id === user.id))
                                            .map(user => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => handleSelectMember(user)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                >
                                                    <UserAvatar user={user} size="sm" />
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.displayName}</span>
                                                        <span className="text-xs text-slate-500">{user.email}</span>
                                                    </div>
                                                </button>
                                            ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-slate-500">No hay otros miembros registrados</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Members Chips */}
                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedMembers.map(member => (
                                    <div key={member.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-2 pr-1 py-1 rounded-full shadow-sm animate-in zoom-in-50">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{member.displayName}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="size-5 rounded-full hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Initial Tasks Section (Only show on creation) */}
                    {!isEditMode && (
                        <div className="flex flex-col gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center justify-between">
                                <label className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">playlist_add_check</span>
                                    Tareas Iniciales (Opcional - recomendadas al menos 3)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setInitialTasks([...initialTasks, { title: '', priority: 'medium' }])}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Añadir Más
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {initialTasks.map((task, index) => (
                                    <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="flex-1 relative">
                                            <input
                                                className="w-full h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
                                                placeholder={`Tarea #${index + 1}`}
                                                value={task.title}
                                                onChange={(e) => {
                                                    const updated = [...initialTasks];
                                                    updated[index].title = e.target.value;
                                                    setInitialTasks(updated);
                                                }}
                                            />
                                        </div>
                                        <select
                                            className="h-10 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 focus:outline-none"
                                            value={task.priority}
                                            onChange={(e) => {
                                                const updated = [...initialTasks];
                                                updated[index].priority = e.target.value;
                                                setInitialTasks(updated);
                                            }}
                                        >
                                            <option value="low">Baja</option>
                                            <option value="medium">Media</option>
                                            <option value="high">Alta</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setInitialTasks(initialTasks.filter((_, i) => i !== index))}
                                            className="size-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center p-0"
                                            disabled={initialTasks.length <= 1}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex items-center justify-end gap-3 mt-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 transition-all"
                            type="button"
                            onClick={handleCancel}
                        >
                            Cancelar
                        </button>
                        <button
                            className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 active:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-background-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                    {isEditMode ? 'Guardar Cambios' : 'Crear Proyecto'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default CreateProject;
