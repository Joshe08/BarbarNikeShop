import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ReservaButton from "../Components/ReservaButton";
import NotificationCenter from "../Components/NotificationCenter";

/**
 * Componente Header principal de la aplicacion que contiene la barra de navegacion superior
 * y el Drawer/Sidebar movil responsivo con el menu de control del perfil del usuario.
 * 
 * @param {function} onBookingClick - Callback para desplegar el modal de reservas/agendamiento.
 */
function Header({ onBookingClick }) {
  // Consumir datos de autenticacion del usuario
  const { user, isAuthenticated, logout } = useAuth();
  
  // Estados para controlar los modales e interfaces locales de navegacion
  const [isMenuOpen, setIsMenuOpen] = useState(false);              // Control del Drawer movil
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);  // Confirmacion de salida
  const [toastMsg, setToastMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Escuchar si venimos de una redirección con un aviso de cierre de sesión
  useEffect(() => {
    const hasToast = location.state?.showLogoutToast || localStorage.getItem('logout_toast') === 'true';
    if (hasToast) {
      // Clear the state immediately to prevent re-triggering
      window.history.replaceState({}, '');
      localStorage.removeItem('logout_toast');
      
      // Show toast with a small delay to ensure render is complete
      const showTimer = setTimeout(() => {
        setToastMsg("✓ Sesión cerrada correctamente");
      }, 100);
      const hideTimer = setTimeout(() => {
        setToastMsg("");
      }, 3500);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [location.state, location.pathname]);

  // Bloquear el scroll del cuerpo cuando el menú móvil está abierto para evitar bloqueos en iOS
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Muestra el modal de confirmacion al intentar cerrar sesion
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Cierra la sesion en Firebase Auth y redirige al Landing principal
  const confirmLogout = () => {
    localStorage.setItem('logout_toast', 'true');
    logout();
    setIsMenuOpen(false);
    setShowLogoutConfirm(false);
    navigate("/login", { replace: true });
  };

  // --- Elementos de navegacion del menu principal con sus respectivos iconos vectoriales (SVG) ---
  const navItems = [
    { 
      label: "Inicio", 
      href: "#inicio",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      label: "Productos", 
      href: "#productos",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    { 
      label: "Catálogo", 
      href: "#catalogo",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      label: "Reserva", 
      href: "#reserva",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  // --- Manejo del click en los links de navegacion (soporta scroll suave a elementos o redireccion) ---
  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsMenuOpen(false); // Cerrar menu movil si esta abierto
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    
    // Si el elemento existe en la pagina actual, hacer scroll suave directo con un ligero delay
    // para permitir que el menu móvil empiece a cerrarse y evitar bloqueos de renderizado en iOS.
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      // Si no existe (ej: estamos en otra ruta), redirigir a Home primero y luego hacer scroll
      navigate("/");
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  return (
    <header
      className="w-full bg-black/95 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-[100] h-[76px]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Logo Tipográfico BARBER KALVIN */}
      <Link to="/" className="flex items-center text-white text-xl sm:text-2xl font-black tracking-tighter hover:opacity-90 transition-opacity z-[110]" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <span>BARBER <span className="text-red-500">KALVIN</span></span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center gap-8">
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-white text-sm font-medium tracking-wide hover:text-red-600 transition-colors duration-300 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-red-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* Notification Center */}
              <NotificationCenter />

              {/* Enlace al panel de control (Dashboard) o sección de mis citas */}
              <Link to="/dashboard" className="bg-red-600/10 hover:bg-red-600 hover:text-white text-red-600 border border-red-600/10 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer">
                {user.role === 'client' ? 'Mis Citas' : 'Panel'}
              </Link>

              {/* Contenedor de la informacion e inicial/foto del perfil del usuario en la barra de escritorio */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900 flex items-center justify-center font-black text-white text-sm shadow-inner notranslate" translate="no">
                  {user?.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-none">{user.name}</p>
                  <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              
              {/* Boton para desplegar el modal de reservas */}
              {user.role === "client" && <div onClick={onBookingClick}><ReservaButton /></div>}
              
              {/* Boton de salida / cerrar sesion */}
              <button onClick={handleLogoutClick} className="flex items-center gap-2 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-white/5 font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer">
                Salir
              </button>
            </div>
          ) : (
            <>
              <div onClick={onBookingClick}><ReservaButton /></div>
              <Link to="/login" className="bg-white hover:bg-red-600 text-black hover:text-white font-bold px-6 py-2.5 rounded-full transition-all text-sm">
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Actions and Toggle Button */}
      <div className="lg:hidden flex items-center gap-4 relative z-[120]">
        {isAuthenticated && <NotificationCenter />}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 focus:outline-none group cursor-pointer"
          aria-label="Toggle Menu"
        >
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 rounded-full ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 rounded-full ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`w-6 h-0.5 bg-white transition-all duration-300 rounded-full ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[200] lg:hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
        
        <div className={`absolute top-0 right-0 w-[320px] sm:w-[350px] h-[100dvh] bg-[#0f172a] flex flex-col shadow-[-10px_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out border-l border-white/5 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 bg-[#0a0f1d] border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h2 className="flex items-center text-white text-2xl font-black tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <span>BARBER <span className="text-red-500">KALVIN</span></span>
                </h2>
                <p className="text-neutral-400 text-[10px] uppercase tracking-[0.3em] font-black mt-1">Estilo · Precisión · Confianza</p>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="text-neutral-500 hover:text-white transition-colors p-2 -mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Seccion del cuerpo del menu movil (Drawer) */}
          <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
            {/* Iterar y renderizar cada elemento de navegacion (Inicio, Catalogo, Reserva) */}
            {navItems.map((item) => {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="flex items-center gap-5 px-4 py-4 rounded-2xl hover:bg-white/5 group transition-all duration-300 border border-transparent hover:border-white/5"
                >
                  {/* Cuadrado con icono SVG dinámico (reemplaza las siglas IN, CT, RS susceptibles a traduccion) */}
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 group-hover:bg-red-600/10 group-hover:text-red-600 group-hover:border-red-600/20 transition-all shadow-inner">
                    {item.icon}
                  </div>
                  <span className="text-neutral-300 font-bold text-lg group-hover:text-white group-hover:translate-x-1 transition-all">
                    {item.label}
                  </span>
                </a>
              );
            })}

            {/* Enlace al panel de control (Dashboard) del usuario si la sesion esta activa */}
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-5 px-4 py-4 rounded-2xl hover:bg-red-600/5 group transition-all duration-300 border border-transparent hover:border-red-600/10"
              >
                {/* Cuadrado con icono SVG de panel de control */}
                <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg shadow-red-600/5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-red-600 font-bold text-lg group-hover:text-red-500 group-hover:translate-x-1 transition-all">
                  {user.role === 'client' ? 'Mis Citas' : 'Dashboard'}
                </span>
              </Link>
            )}
            
            {/* Seccion de acciones rapidas en el menu movil */}
            <div className="pt-8 mt-8 border-t border-white/5 px-2">
               <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] mb-6 px-2">Acciones Rápidas</p>
               <div onClick={() => { onBookingClick(); setIsMenuOpen(false); }} className="mb-6 transform scale-105 origin-left">
                 <ReservaButton />
               </div>
            </div>
          </div>

          {/* Footer del menu movil con los datos de sesion del usuario logueado */}
          <div className="p-6 bg-[#0a0f1d] border-t border-white/5">
            {isAuthenticated ? (
              <div className="space-y-6">
                {/* Tarjeta de presentacion del usuario */}
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
                  {/* Foto de perfil circular o fallback a la inicial (ambos protegidos contra traductores de navegador) */}
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/20 flex-shrink-0 notranslate" translate="no">
                    {user?.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-base font-bold truncate">{user.name}</p>
                    <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                
                {/* Boton para cerrar la sesion */}
                <button 
                  onClick={handleLogoutClick}
                  className="w-full bg-neutral-900 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 py-4 rounded-2xl font-black text-xs transition-all border border-white/5 uppercase tracking-[0.2em] active:scale-95 shadow-lg cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-3 w-full bg-white text-black py-5 rounded-2xl font-black text-sm tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                INICIAR SESIÓN
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="relative bg-neutral-900 border border-white/10 p-6 sm:p-8 rounded-[2rem] w-full max-w-sm shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-white text-lg font-black uppercase tracking-wider">¿Cerrar Sesión?</h3>
              <p className="text-neutral-400 text-xs leading-relaxed font-medium">¿Estás seguro de que deseas salir del sistema? Tendrás que ingresar tus credenciales de nuevo.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all border border-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all shadow-lg shadow-red-500/10"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast de Éxito / Error */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] transition-all duration-500 ${
        toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm">
          {toastMsg}
        </div>
      </div>
    </header>
  );
}

export default Header;
