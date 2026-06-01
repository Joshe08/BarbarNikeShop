import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login, resendVerification, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem('logout_toast') === 'true') {
      localStorage.removeItem('logout_toast');
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
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
      if (result.emailNotVerified) {
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    setError('');
    setResendLoading(true);
    const result = await resendVerification(form.email, form.password);
    setResendLoading(false);
    if (result.success) {
      setResendSuccess(true);
      setShowResend(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex selection:bg-orange-500 selection:text-white">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900 items-center justify-center p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px]" />
        <div className="relative z-10 text-center space-y-6">
          <div className="text-white text-5xl font-black tracking-tight">
            Barber<span className="text-orange-500">Nike</span>
          </div>
          <div className="w-16 h-1 bg-orange-500 rounded-full mx-auto" />
          <p className="text-neutral-400 text-lg leading-relaxed max-w-xs">
            Gestión profesional de citas para la barbería y el salón de belleza más premium.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-10">
            {[
              { label: 'Barberos', value: '4+' },
              { label: 'Servicios', value: '14+' },
              { label: 'Clientes', value: '500+' },
              { label: 'Años', value: '5+' }
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-orange-500 font-black text-2xl">{s.value}</p>
                <p className="text-neutral-500 text-xs uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Link to="/">
              <span className="text-white text-3xl font-black">Barber<span className="text-orange-500">Nike</span></span>
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-white font-black text-3xl mb-2">Bienvenido <span className="text-orange-500">de vuelta</span></h1>
            <p className="text-neutral-500">Ingresa tus credenciales para continuar</p>
          </div>

          {resendSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-400 text-sm font-medium">Hemos reenviado el correo de verificación a tu Gmail con éxito.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
              {showResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-left text-orange-500 hover:text-orange-400 text-xs font-black uppercase tracking-widest pl-8 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {resendLoading ? 'Reenviando...' : '¿No recibiste el correo? Haz click aquí para reenviar'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handle('email', e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handle('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 pr-12 text-white placeholder:text-neutral-600 focus:border-orange-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPass ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-neutral-500 hover:text-orange-500 text-xs font-bold transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 disabled:opacity-40 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] cursor-pointer mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-neutral-500 text-sm">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-orange-500 font-black hover:text-orange-400 transition-colors">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-neutral-600 hover:text-neutral-400 text-xs font-bold transition-colors flex items-center justify-center gap-2">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio
            </Link>
        </div>
      </div>
    </div>
      
      {/* Toast de Éxito */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] transition-all duration-500 ${
        toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm">
          {toastMsg}
        </div>
      </div>
    </div>
  );
}

export default Login;
