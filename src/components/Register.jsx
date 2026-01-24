import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState('assistant'); // 'assistant' for Participant, 'organizer' for Organizer
    const navigate = useNavigate();
    const { currentUser, refreshUserData } = useAuth();
    const { showToast } = useToast();

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/projects');
        }
    }, [currentUser, navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast("Las contraseñas no coinciden", "warning");
            return;
        }

        try {
            // 1. Crear usuario en Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Actualizar Display Name en Auth
            await updateProfile(user, {
                displayName: fullName
            });

            // 3. Revisar si existe una invitación para este correo (Team Invitations)
            const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()), where("status", "==", "invited"));
            const querySnapshot = await getDocs(q);
            let roleToAssign = selectedRole;

            if (!querySnapshot.empty) {
                const inviteDoc = querySnapshot.docs[0];
                roleToAssign = inviteDoc.data().role || selectedRole;
                // Borrar la invitación antigua de users
                await deleteDoc(doc(db, "users", inviteDoc.id));
            }

            // 3.5. Revisar si existe una invitación como PONENTE (Speaker Invitations)
            const qSpeaker = query(collection(db, "speakers"), where("email", "==", email.toLowerCase()));
            const speakerSnapshot = await getDocs(qSpeaker);

            if (!speakerSnapshot.empty) {
                // Encontramos un perfil de ponente con este email
                const speakerDoc = speakerSnapshot.docs[0];
                // Actualizamos el ponente para linkearlo con el nuevo UID y datos
                await setDoc(doc(db, "speakers", speakerDoc.id), {
                    userId: user.uid,
                    status: 'active',
                    name: fullName || speakerDoc.data().name,
                    email: email.toLowerCase()
                    // Image might not be available in standard register yet, 
                    // but if they update profile later we might want to sync. 
                    // For now this links them.
                }, { merge: true });
                console.log("Perfil de ponente vinculado exitosamente");
            }

            // 4. Crear documento de usuario en Firestore con rol (final)
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: email.toLowerCase(),
                displayName: fullName,
                role: roleToAssign,
                status: 'active',
                createdAt: serverTimestamp()
            });

            // Refrescar datos del usuario para actualizar el rol inmediatamente
            await refreshUserData();

            console.log("Registrado exitosamente con rol:", roleToAssign);
            showToast("¡Registrado exitosamente!", "success");
            navigate('/projects');
        } catch (err) {
            showToast(err.message || "Error al registrarse.", "error");
            console.error(err);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            // Forzar selección de cuenta para permitir elegir qué cuenta usar
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);

            // Verificar si el usuario ya existe en Firestore
            const existingUserSnap = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
            const existingUserDoc = existingUserSnap.docs[0];
            const existingRole = existingUserDoc?.data()?.role || null;

            // Buscar posibles invitaciones por correo
            const q = query(collection(db, "users"), where("email", "==", user.email.toLowerCase()), where("status", "==", "invited"));
            const querySnapshot = await getDocs(q);
            let roleFromInvitation = null;

            if (!querySnapshot.empty) {
                const inviteDoc = querySnapshot.docs[0];
                roleFromInvitation = inviteDoc.data().role;
                // Borrar el registro de invitación
                await deleteDoc(doc(db, "users", inviteDoc.id));
            }

            // Buscamos si es un ponente invitado también en Google Login
            const qSpeaker = query(collection(db, "speakers"), where("email", "==", user.email.toLowerCase()));
            const speakerSnapshot = await getDocs(qSpeaker);
            if (!speakerSnapshot.empty) {
                const speakerDoc = speakerSnapshot.docs[0];
                await setDoc(doc(db, "speakers", speakerDoc.id), {
                    userId: user.uid,
                    status: 'active',
                    name: user.displayName || speakerDoc.data().name,
                    image: user.photoURL || speakerDoc.data().image || '',
                    email: user.email
                }, { merge: true });
                console.log("Perfil de ponente vinculado exitosamente (Google)");
            }

            // Determinar rol final: invitación > existente > seleccionado
            const finalRole = roleFromInvitation || existingRole || selectedRole;

            // Crear/actualizar documento de usuario
            const userData = {
                uid: user.uid,
                email: user.email.toLowerCase(),
                displayName: user.displayName,
                photoURL: user.photoURL || '',
                status: 'active',
                lastLogin: serverTimestamp(),
                role: finalRole
            };

            // Si es usuario nuevo, agregar createdAt
            if (!existingUserDoc) {
                userData.createdAt = serverTimestamp();
            }

            await setDoc(userRef, userData, { merge: true });

            // Refrescar datos del usuario para actualizar el rol inmediatamente
            await refreshUserData();

            console.log("Usuario registrado/actualizado con rol:", finalRole);
            showToast("Inicio de sesión con Google exitoso", "success");
            navigate('/projects');
        } catch (err) {
            showToast("Error al iniciar sesión con Google.", "error");
            console.error(err);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 py-2 sm:py-4">
            {/* Background Gradient/Pattern decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]"></div>
                <div className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]"></div>
            </div>

            <div className="layout-content-container relative z-10 flex w-full max-w-[480px] flex-col rounded-xl bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#3b4754] shadow-2xl animate-fade-in-up">
                {/* Header Section */}
                <div className="flex flex-col gap-1 p-6 pb-2 text-center">
                    <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                        <span className="material-symbols-outlined text-2xl">event_note</span>
                    </div>
                    <h1 className="text-xl font-black leading-tight tracking-[-0.033em] text-slate-900 dark:text-white">
                        Comienza con EventMaster
                    </h1>
                    <p className="text-sm font-normal leading-normal text-slate-500 dark:text-[#9dabb9]">
                        Gestiona tus proyectos eficientemente.
                    </p>
                </div>

                {/* Account Type Selector */}
                <div className="flex flex-col gap-3 px-6 pb-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">¿Cómo planeas usar EventMaster?</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedRole('assistant')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedRole === 'assistant' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                            <span className={`material-symbols-outlined text-2xl ${selectedRole === 'assistant' ? 'text-primary' : 'text-slate-400'}`}>person</span>
                            <div className="text-center">
                                <p className={`text-xs font-bold ${selectedRole === 'assistant' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>Asistente</p>
                                <p className="text-[10px] text-slate-500">Quiero ir a eventos</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedRole('organizer')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedRole === 'organizer' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                        >
                            <span className={`material-symbols-outlined text-2xl ${selectedRole === 'organizer' ? 'text-primary' : 'text-slate-400'}`}>business_center</span>
                            <div className="text-center">
                                <p className={`text-xs font-bold ${selectedRole === 'organizer' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>Organizador</p>
                                <p className="text-[10px] text-slate-500">Quiero crear eventos</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Form Section */}
                <form className="flex flex-col gap-3 p-6 pt-2" onSubmit={handleRegister}>
                    {/* Full Name */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-normal text-slate-900 dark:text-white" htmlFor="name">
                            Nombre completo
                        </label>
                        <input
                            className="form-input block w-full rounded-lg border border-slate-300 dark:border-[#3b4754] bg-slate-50 dark:bg-[#1c2127] text-slate-900 dark:text-white focus:border-primary focus:outline-0 focus:ring-0 h-9 px-4 placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] text-sm font-normal leading-normal transition-colors"
                            id="name"
                            placeholder="John Doe"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-normal text-slate-900 dark:text-white" htmlFor="email">
                            Correo electrónico
                        </label>
                        <input
                            className="form-input block w-full rounded-lg border border-slate-300 dark:border-[#3b4754] bg-slate-50 dark:bg-[#1c2127] text-slate-900 dark:text-white focus:border-primary focus:outline-0 focus:ring-0 h-9 px-4 placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] text-sm font-normal leading-normal transition-colors"
                            id="email"
                            placeholder="name@company.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {/* Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-normal text-slate-900 dark:text-white" htmlFor="password">
                            Contraseña
                        </label>
                        <div className="relative flex w-full items-center">
                            <input
                                className="form-input block w-full rounded-lg border border-slate-300 dark:border-[#3b4754] bg-slate-50 dark:bg-[#1c2127] text-slate-900 dark:text-white focus:border-primary focus:outline-0 focus:ring-0 h-9 pl-4 pr-10 placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] text-sm font-normal leading-normal transition-colors"
                                id="password"
                                placeholder="••••••••"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 flex h-9 w-10 items-center justify-center text-slate-400 dark:text-[#9dabb9] hover:text-primary transition-colors focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>
                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-normal text-slate-900 dark:text-white" htmlFor="confirm-password">
                            Confirmar contraseña
                        </label>
                        <div className="relative flex w-full items-center">
                            <input
                                className="form-input block w-full rounded-lg border border-slate-300 dark:border-[#3b4754] bg-slate-50 dark:bg-[#1c2127] text-slate-900 dark:text-white focus:border-primary focus:outline-0 focus:ring-0 h-9 pl-4 pr-10 placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] text-sm font-normal leading-normal transition-colors"
                                id="confirm-password"
                                placeholder="••••••••"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-0 flex h-9 w-10 items-center justify-center text-slate-400 dark:text-[#9dabb9] hover:text-primary transition-colors focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[18px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    </div>
                    {/* Action Button */}
                    <button type="submit" className="mt-1 flex w-full cursor-pointer items-center justify-center rounded-lg bg-primary py-2 text-sm font-bold leading-normal text-white hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20">
                        Crear cuenta
                    </button>
                </form>

                <div className="px-6 pb-6">
                    {/* Divider */}
                    <div className="relative my-2 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-[#3b4754]"></div>
                        </div>
                        <span className="relative bg-white dark:bg-[#151a21] px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-[#9dabb9]">O continúa con</span>
                    </div>
                    {/* Social Login */}
                    <button onClick={handleGoogleLogin} className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-[#1c2127] py-2 text-sm font-medium leading-normal text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#252b36] transition-colors">
                        <img alt="Google Logo" className="h-4 w-4" data-alt="Google G Logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxu65Nf-gbvUBckMzEUYDCU9nDKa1z811_y-fs-3WgZ8N5YUKvXG_eCZkL0nwAchRxxM0iCnI6_s088FfHN1Z5khl9Ir5dGl53DPAYooCWuMsxAoJW58CdOaV25wFTYkJotX7RA8TkfpjHsAjnwoQ8oU5Nppj2z2BD2B7qd0QD3ZHvDHub2BxedOIkAxAOtyd3SJsBLLTi54FcraTMoSUSUoPWKtQURD9iyzIAF9hZcnoJXo8I9rxULPxaZtP0q-1WGi8HeUcxEZ8" />
                        <span>Google</span>
                    </button>
                    {/* Footer */}
                    <p className="mt-3 text-center text-xs font-normal leading-normal text-slate-500 dark:text-[#9dabb9]">
                        ¿Ya tienes una cuenta?
                        <Link className="font-medium text-primary hover:text-blue-400 transition-colors ml-1" to="/login">Inicia sesión</Link>
                    </p>
                </div>
            </div>
            {/* Subtle Footer Branding */}
            <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-600">© 2024 EventMaster Inc. Todos los derechos reservados.</p>
            </div>
        </div>
    );
}

export default Register;
