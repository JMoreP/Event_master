import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const navigate = useNavigate();
    const { currentUser, loginWithGoogle, resetPassword } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/projects');
        }
    }, [currentUser, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            showToast(`¡Bienvenido de nuevo, ${user.displayName || 'Usuario'}!`, 'success');
            navigate('/projects'); // Redirect to projects dashboard
        } catch (err) {
            showToast('Error al iniciar sesión. Por favor verifica tus credenciales.', 'error');
            console.error(err);
        }
    };

    const handleGoogleLogin = async (e) => {
        e.preventDefault();
        try {
            const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
            const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const provider = new GoogleAuthProvider();
            // Forzar selección de cuenta para permitir elegir qué cuenta usar
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Verificar si el usuario ya existe en Firestore
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Usuario NO está registrado, cerrar sesión de Firebase y redirigir a registro
                await auth.signOut();
                showToast('Esta cuenta no está registrada. Por favor regístrate primero.', 'warning');
                navigate('/register');
                return;
            }

            // Usuario existe, actualizar lastLogin
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
            showToast(`¡Bienvenido de nuevo, ${user.displayName || 'Usuario'}!`, 'success');
            navigate('/projects');
        } catch (err) {
            showToast('Error al iniciar sesión con Google.', 'error');
            console.error(err);
        }
    }

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            showToast("Por favor ingresa tu correo para restablecer la contraseña.", "warning");
            return;
        }
        try {
            await resetPassword(email);
            showToast('Se ha enviado un correo para restablecer tu contraseña.', 'info');
        } catch (err) {
            showToast('Error al enviar el correo de recuperación.', 'error');
            console.error(err);
        }
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden py-4 sm:py-8">
            <div
                className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-20 pointer-events-none"
                data-alt="Abstract gradient mesh background in blue and purple tones"
            ></div>
            <div className="relative mx-auto w-full max-w-md px-6 bg-white dark:bg-surface-dark shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 sm:rounded-xl sm:px-10 py-6 transition-colors duration-200 animate-fade-in-up">
                <div className="w-full">
                    {/* Header / Logo */}
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-4 text-primary">
                            <span className="material-symbols-outlined !text-4xl">event_available</span>
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">EventMaster</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Inicia sesión en tu cuenta</h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">¡Bienvenido de nuevo! Por favor ingresa tus datos.</p>
                    </div>

                    {/* Form */}
                    <form className="space-y-4" onSubmit={handleLogin}>
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200 mb-1" htmlFor="email">Correo electrónico</label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">mail</span>
                                </div>
                                <input
                                    className="block w-full rounded-lg border-0 py-2 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-surface-border placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary bg-transparent sm:text-sm sm:leading-6 transition-all duration-200"
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200" htmlFor="password">Contraseña</label>
                                <button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-primary hover:text-blue-500">¿Olvidaste tu contraseña?</button>
                            </div>
                            <div className="relative rounded-lg shadow-sm group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
                                </div>
                                <input
                                    className="block w-full rounded-lg border-0 py-2 pl-10 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-surface-border placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary bg-transparent sm:text-sm sm:leading-6 transition-all duration-200"
                                    id="password"
                                    name="password"
                                    placeholder="********"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                                >
                                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Sign In Button */}
                        <div>
                            <button className="flex w-full justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 ease-in-out transform active:scale-[0.98]" type="submit">
                                Iniciar sesión
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative mt-4">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-surface-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm font-medium leading-6">
                            <span className="bg-white dark:bg-surface-dark px-4 text-slate-500 dark:text-slate-400">O continúa con</span>
                        </div>
                    </div>

                    {/* Social Logins */}
                    <div className="mt-4">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white dark:bg-[#252e38] px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-surface-border hover:bg-slate-50 dark:hover:bg-[#2f3b47] transition-all duration-200"
                        >
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-.4167-.0334-.8333-.1-1.2333h-8.35v3.2h4.8c-.2 1.0833-.8167 2-1.7333 2.6167v2.1666h2.8c1.6333-1.5 2.5833-3.7166 2.5833-6.2333 0-.6167-.0667-1.2167-.1833-1.8h-7.8667v-3.2h10.95C22.6836 7.8 22.8 8.1 22.8 8.4c0 5.95-4.8333 10.8-10.8 10.8-3.9 0-7.2333-2.1333-9.05-5.3L5.8 16.35c1.45 2.5333 4.1 4.1 7.2 4.1z" fill="#4285F4"></path>
                                <path d="M3.95 14.2333l2.85-2.2166C7.3833 12.8333 8.6667 13.5 10.05 13.5c1.4167 0 2.65-.5833 3.55-1.5167L16.4 14.15c-1.6333 1.5-3.8333 2.4-6.35 2.4-3.1 0-5.75-1.5667-7.2-4.1l-2.9 2.25c1.8167 3.1667 5.15 5.3 9.05 5.3" fill="#34A853"></path>
                                <path d="M2.95 13.9c-.3167-.9333-.5-1.9333-.5-2.95s.1833-2.0167.5-2.95L.05 5.75C-1.0833 8.0167-1.0833 10.9833.05 13.25l2.9-2.25z" fill="#FBBC05"></path>
                                <path d="M10.05 5.85c1.55 0 2.9333.5333 4.0167 1.4167l2.8833-2.8833C15.1333 2.6833 12.7167 1.95 10.05 1.95c-3.9 0-7.2333 2.1333-9.05 5.3l2.9 2.25C4.7667 7.0333 7.2167 5.85 10.05 5.85z" fill="#EA4335"></path>
                            </svg>
                            <span className="text-sm font-semibold leading-6">Continuar con Google</span>
                        </button>
                    </div>

                    {/* Footer Sign Up */}
                    <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        ¿No tienes una cuenta?{' '}
                        <Link className="font-semibold leading-6 text-primary hover:text-blue-500 transition-colors" to="/register">Regístrate gratis</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
