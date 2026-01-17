import React from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { events } = useEvents();
    const { currentUser } = useAuth();
    const upcomingEvents = events.slice(0, 3);

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-x-hidden">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="layout-container flex justify-center w-full">
                    <div className="flex max-w-[1280px] w-full items-center justify-between px-6 py-4 lg:px-10">
                        <Link to="/" className="flex items-center gap-4 text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
                            <div className="size-8 text-primary">
                                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_6_319)">
                                        <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_6_319"><rect fill="white" height="48" width="48" /></clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold leading-tight tracking-tight">EventMaster</h2>
                        </Link>
                        <nav className="hidden md:flex items-center gap-8">
                            <a className="text-sm font-medium hover:text-primary transition-colors" href="#events">Eventos</a>
                            <a className="text-sm font-medium hover:text-primary transition-colors" href="#features">Características</a>
                            <a className="text-sm font-medium hover:text-primary transition-colors" href="#community">Comunidad</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            {currentUser ? (
                                <Link to="/panel" className="cursor-pointer items-center justify-center rounded-lg px-5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-all flex gap-2">
                                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                                    <span>Ir al Panel</span>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="hidden sm:flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <span>Iniciar Sesión</span>
                                    </Link>
                                    <Link to="/register" className="cursor-pointer items-center justify-center rounded-lg px-5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-all transform active:scale-95">
                                        <span>Registrarse</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center bg-white dark:bg-background-dark pt-10 pb-16 lg:pt-20">
                <div className="w-full max-w-[1280px] px-6 lg:px-10">
                    <div className="flex flex-col-reverse lg:flex-row gap-12 items-center">
                        {/* Text Content */}
                        <div className="flex flex-col gap-6 lg:w-1/2 text-center lg:text-left">
                            <div className="flex flex-col gap-4">
                                <h1 className="text-slate-900 dark:text-white text-4xl lg:text-6xl font-black leading-tight tracking-tight animate-fade-in-up">
                                    Domina tus Eventos, <br /><span className="text-primary">Gestiona tu Éxito.</span>
                                </h1>
                                <h2 className="text-slate-600 dark:text-slate-400 text-lg font-normal leading-relaxed max-w-lg mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                    La plataforma todo-en-uno para ejecución perfecta de proyectos, seguimiento de tareas en tiempo real y colaboración en equipo.
                                </h2>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start w-full">
                                <Link to={currentUser ? "/panel" : "/register"} className="h-12 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white text-base font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center">
                                    {currentUser ? "Ir a mi Panel" : "Comenzar Gratis"}
                                </Link>
                            </div>
                            <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-gray-300 bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD9yVCdFnEgZ2gb9U3OhFPzNjJKb1TVGbbK6FknaFolbgplAdj8ckPEefXzzfHiFPKFHKYsyeYtU71Oc90PvTfhuPoRdn9k01qepGz-HMoP_UnKnH263ROz_hXX0GCXBno80wvrxgeO6eAr266h5g-uG2sBsu_jTWHNSw5WQPkU6-OGPYbK5ZogUQ-MomM2LXbCasJIOiXM5gMubKdjrOBMLAzCmeO9MYf1cQonYUBln_qAubfk8Bq6roufgEwnfxAkb1t0dNSrdDg")' }}></div>
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-gray-300 bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCd4fzEiiyOppcOhfo3poro_hNFU55NBO2aJvaXMSQEqDdpd7lOzvUD5HPICyJU2uNuhGYwBI2KbRbHfsOPlOL-2xccTeKaIB8UAx2brJDF7TjCHsMSGIyVxJOCrARzbo07iDp3HP-u5fpREdIkFXbjUQFn-JyqQUWyivUhyyyxZXku2LYn6KvWTI9xAjURSK1jRMWA9Z4TReK-Fz4MJXwG6m3Nb8m9gQ6d7joY-jIJsZKeUw2sHULTSsUg_6MQzKuZ4yw0vE7RqMk")' }}></div>
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-gray-300 bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCJMe_pm-IBgZEJ-nTrPfcS7pJYPNJpgN0wlUy_wS7ldMV6i3OIFHayY6h4A5c67muFh1Nx-Hb89CWprY7LU3OjUVemL-Pajuz00shWEttovlnJpeqKs6qJgMSmiHaKJIUac7qyK5Qwy63McI8g9_qgJKbXtBNoJ-Xrs3AETZn_EhcrxIkOrQ1iIal_vmFsOtY81-ZgMUQDFUgnXkvBgAhK7LnBPW6IyWM1I5ACOHiPnTpNiypWjx35WtiBi2xmhquZlQfjnvVElO0")' }}></div>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Más de 10,000 organizadores</p>
                            </div>
                        </div>
                        {/* Hero Image */}
                        <div className="lg:w-1/2 w-full perspective-1000 animate-zoom-in" style={{ animationDelay: '0.4s' }}>
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 transform lg:rotate-y-[-5deg] lg:rotate-x-[2deg] transition-transform duration-500 hover:rotate-0 hover-glow group">
                                <img
                                    src="/home.jpg"
                                    alt="Digital Marketing Masterclass"
                                    className="w-full h-full object-cover"
                                />
                                {/* Optional overlay to ensure it sits well on the page */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Events Section (DYNAMIC) */}
            <section className="w-full py-16 bg-slate-50 dark:bg-slate-800/50" id="events">
                <div className="layout-container flex justify-center w-full">
                    <div className="flex flex-col max-w-[1280px] w-full px-6 lg:px-10 items-center gap-10">
                        <div className="text-center max-w-2xl">
                            <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight mb-4">Próximos Eventos</h2>
                            <p className="text-slate-500 dark:text-slate-400">Descubre los eventos destacados que están sucediendo en nuestra comunidad.</p>
                        </div>

                        {upcomingEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full stagger-list">
                                {upcomingEvents.map(event => (
                                    <div key={event.id} className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg hover-glow animate-fade-in-up transition-all duration-300 flex flex-col h-full">
                                        <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                                            {event.imageUrl ? (
                                                <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <span className="material-symbols-outlined text-4xl">event</span>
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                                                {event.date ? new Date(event.date).toLocaleDateString() : 'Próximamente'}
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col gap-4 flex-1">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{event.name}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">{event.description}</p>
                                            <div className="mt-auto pt-4 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{typeof event.location === 'object' ? event.location?.venue : event.location}</span>
                                                <Link to={`/events/${event.id}`} className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                                                    Ver detalles <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 w-full max-w-2xl">
                                <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">event_busy</span>
                                <p className="text-slate-500 font-medium">No hay eventos públicos programados en este momento.</p>
                            </div>
                        )}

                        <div className="flex justify-center mt-4">
                            <Link to="/events" className="px-6 py-3 rounded-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                                Ver todos los eventos
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof Logos */}
            <section className="w-full border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-10">
                <div className="layout-container flex justify-center w-full">
                    <div className="flex flex-col max-w-[1280px] w-full px-6 lg:px-10 items-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-6">Confiado por equipos en todo el mundo</p>
                        <div className="flex flex-wrap justify-center gap-8 lg:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-slate-200">
                                <span className="material-symbols-outlined">diamond</span> Acme Corp
                            </div>
                            <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-slate-200">
                                <span className="material-symbols-outlined">bolt</span> FastLane
                            </div>
                            <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-slate-200">
                                <span className="material-symbols-outlined">forest</span> GreenTech
                            </div>
                            <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-slate-200">
                                <span className="material-symbols-outlined">waves</span> BlueOcean
                            </div>
                            <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-slate-200">
                                <span className="material-symbols-outlined">rocket_launch</span> StarJump
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Section */}
            <section className="flex flex-col items-center justify-center py-20 bg-white dark:bg-background-dark" id="features">
                <div className="w-full max-w-[1280px] px-6 lg:px-10">
                    <div className="flex flex-col gap-10">
                        <div className="flex flex-col gap-4 max-w-[720px]">
                            <h2 className="text-slate-900 dark:text-white text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                                ¿Por qué EventMaster?
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-lg font-normal leading-relaxed">
                                Todo lo que necesitas para entregar proyectos a tiempo y dentro del presupuesto, envuelto en una interfaz hermosa.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Feature 1 */}
                            <div className="group flex flex-row gap-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 hover-glow transition-all duration-300">
                                <div className="flex-none flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-3xl">event_available</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-slate-900 dark:text-white text-xl font-bold">Gestión Integral de Eventos</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-base">Crea y personaliza eventos con agendas detalladas, ponentes y ubicación en minutos.</p>
                                </div>
                            </div>
                            {/* Feature 2 */}
                            <div className="group flex flex-row gap-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 hover-glow transition-all duration-300">
                                <div className="flex-none flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-3xl">currency_bitcoin</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-slate-900 dark:text-white text-xl font-bold">Pagos Flexibles</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-base">Acepta inscripciones fácilmente usando billeteras digitales o **Binance Pay**. Facilita la asistencia global.</p>
                                </div>
                            </div>
                            {/* Feature 3 */}
                            <div className="group flex flex-row gap-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 hover-glow transition-all duration-300">
                                <div className="flex-none flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-3xl">military_tech</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-slate-900 dark:text-white text-xl font-bold">Gamificación</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-base">Motiva a tu comunidad con insignias digitales y recompensas exclusivas por su participación.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Community Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/50" id="community">
                <div className="layout-container flex justify-center w-full">
                    <div className="flex flex-col max-w-[1280px] w-full px-6 lg:px-10">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                            <div className="max-w-2xl">
                                <h2 className="text-slate-900 dark:text-white text-3xl lg:text-4xl font-bold leading-tight mb-4">Únete a nuestra próspera comunidad</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg">Conecta con miles de organizadores de eventos, gerentes de proyectos y directores creativos compartiendo sus flujos de trabajo.</p>
                            </div>
                            <a className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all" href="#">Ver Foro Comunitario <span className="material-symbols-outlined text-sm">arrow_forward</span></a>
                        </div>
                        {/* Community Gallery */}
                        <div className="w-full gap-4 overflow-hidden aspect-[16/7] grid grid-cols-4 grid-rows-2">
                            <div className="col-span-2 row-span-2 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden relative group cursor-pointer">
                                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDnD2G1gieoGQhKDBrpGz9uXl-jCASy4jkBF9SfwniDxN9R6Zhql-khJEFO5Ysx_TRYq5s1PXuC2eSbsFuM_HNN3irDzKmdqf5k6Xv0yg-TQMHgreLiQzsChqSIEqth6hVwzhr9T1-Eevu7V8_bzuOzJCuHlaftzTHlAV6NasE-1bunZng9UvePSCzkeswqGx9cflhiwir7BZS-Rfu-SaOpw3AIziE4e6SV7cksCRZ2-4SdBEqDQHDHghgbAEEbL4kuEiJX7HxxVTQ")' }}></div>
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-white font-bold text-lg">Cumbres Globales</p>
                                    <p className="text-white/80 text-sm">Gestionado por @SarahJ</p>
                                </div>
                            </div>
                            <div className="bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden relative group cursor-pointer">
                                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAojMGzpqVPSU6NmP0Vn9ruE2wUO12VJQRJwOhpsWSYtnJNg62l9jo6TYIco7J6WLdmzxnd7M5GP1rcraZSzf39BLgxj_IqDJxApT7f9fdUjX-NeedmaL_zRX8ubIEQJR8wOAHhVCj8qj4xlHYJ_zsXoeuILapKGV3222I8FjDse8HUzNMCU8QnNP6NvBiOELOLNZA8ZZKTMlw7Iie19HfJpxRfOwKCjXwV30Zs6khfrrGg-KM844QL5hkm2ArjawYIeivt-m8PRgM")' }}></div>
                            </div>
                            <div className="bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden relative group cursor-pointer">
                                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGJ-P_soQtxWjtxlipoEqZmueMQr7TCdSovIXAGAKE-gCt7pzLCZ8Rcy9vMaE83b_GJ3PPwOUGzezm2bzex9sWw2JRbAfEr_7g5V3RdujQjvistPJN3nFoA0zh5zc-_ON33nYmIi402xuki-J7GaAX9iUwnb3n50mucgS6CNhGftFT2gu48X5dB1EPX8ant1a61JnIGtZyuOwTcJAF-yzQQR1j0Cgj34FgS8rKKN3obU-G2wtPJUrhZiBMCEs02JDYT13SMQCe3FQ")' }}></div>
                            </div>
                            <div className="bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden relative group cursor-pointer">
                                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBvbf5OMfC8nNpMlXdzpnBSbHySl99jNIieBcWvs3kCSAzUsVeaukj2FaDoe0h1uFqiG1VmYE4w-FbFEAQqFqV9-OCXLAYq1XbFeaWuwQ6QK0wuxyorY1UEMnnuGhIfyD_lmi0hmx6vJLeqlg5IFeGUHbzJYx6ox_9pm7yDD-iiufrlLCqz803Om-ZFZeyr269-dDYZgc1bxhEiZsMLx96BM5luKjPTX4GN_aRYhts-it-aBf3M4rxDDm1vy_WscZ9fdNhj8NLiyl4")' }}></div>
                            </div>
                            <div className="bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center bg-primary/10 text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors">
                                <div className="text-center p-4">
                                    <h3 className="text-2xl font-bold">+5k</h3>
                                    <p className="text-sm font-medium">Nuevos Proyectos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="w-full py-24 bg-background-light dark:bg-background-dark">
                <div className="layout-container flex justify-center w-full px-6">
                    <div className="relative w-full max-w-[1280px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl group">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src="/section.jpg"
                                alt="Event background"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/70"></div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center justify-center py-20 px-6 text-center gap-8">
                            <h2 className="text-white text-3xl md:text-5xl font-black tracking-tight max-w-2xl">
                                ¿Listo para organizar tu mundo?
                            </h2>
                            <p className="text-white/90 text-lg md:text-xl max-w-xl">
                                Únete a miles de equipos que han cambiado a EventMaster para mejor enfoque y claridad.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <Link to={currentUser ? "/panel" : "/register"} className="h-14 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white text-lg font-bold transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center">
                                    {currentUser ? "Ir a mi Panel" : "Crear Cuenta Gratis"}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
                <div className="layout-container flex justify-center w-full px-6 lg:px-10">
                    <div className="w-full max-w-[1280px]">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-slate-400 text-sm">© 2024 EventMaster Inc. Todos los derechos reservados.</p>
                            <div className="flex gap-6">
                                <a className="text-slate-400 hover:text-primary" href="#"><span className="sr-only">Twitter</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg></a>
                                <a className="text-slate-400 hover:text-primary" href="#"><span className="sr-only">GitHub</span><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" /></svg></a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div >
    );
};

export default Home;
