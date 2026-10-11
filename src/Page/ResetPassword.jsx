import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ResetPassword() {
  const { verifyResetCode, confirmReset } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get('oobCode');

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'invalid-code'
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkCode = async () => {
      if (!oobCode) {
        setStatus('invalid-code');
        setMessage('El enlace de restablecimiento es inválido o no contiene un código de acción válido.');
        setLoading(false);
        return;
      }

      const res = await verifyResetCode(oobCode);
      setLoading(false);

      if (res.success) {
        setEmail(res.email);
      } else {
        setStatus('invalid-code');
        setMessage(res.message || 'El enlace de restablecimiento es inválido o ha caducado.');
      }
    };

    checkCode();
  }, [oobCode, verifyResetCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword || !oobCode) return;

    if (password.length < 6) {
      setStatus('error');
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Las contraseñas no coinciden. Verifica e intenta de nuevo.');
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setMessage('');

    const res = await confirmReset(oobCode, password);
    setSubmitting(false);

    if (res.success) {
      setStatus('success');
      setMessage('¡Contraseña restablecida con éxito! Ya puedes iniciar sesión con tus nuevas credenciales.');
    } else {
      setStatus('error');
      setMessage(res.message || 'Ocurrió un error al restablecer tu contraseña. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-red-600 selection:text-white">
      {/* Background glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <span className="text-white text-3xl font-black tracking-tight">
              BARBER <span className="text-red-500">KALVIN</span>
            </span>
            <span className="text-red-500 text-[10px] uppercase font-bold tracking-[0.25em] mt-1">Barbería Profesional</span>
          </Link>
          <p className="text-neutral-500 text-sm mt-2 font-medium">Restablecer Contraseña</p>
        </div>

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/8 rounded-[2.5rem] p-8 shadow-2xl">
          {loading ? (
            <div className="text-center py-10 space-y-4">
              <div className="relative w-12 h-12 mx-auto">
                <div className="w-full h-full border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-neutral-400 text-sm font-medium animate-pulse">Verificando enlace de seguridad...</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20">
                <svg className="h-10 w-10 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-black text-2xl mb-2">¡Contraseña Cambiada!</h2>
                <p className="text-neutral-400 text-sm leading-relaxed">{message}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="block w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-center hover:bg-red-700 transition-all cursor-pointer shadow-lg shadow-red-600/20 active:scale-[0.98]"
              >
                Ir al Login
              </button>
            </div>
          ) : status === 'invalid-code' ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
                <svg className="h-10 w-10 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-black text-2xl mb-2">Enlace Inválido</h2>
                <p className="text-neutral-400 text-sm leading-relaxed">{message}</p>
              </div>
              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="block w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-center hover:bg-red-700 transition-all cursor-pointer"
                >
                  Solicitar Nuevo Correo
                </Link>
                <Link
                  to="/login"
                  className="block w-full bg-neutral-800 text-neutral-300 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-center hover:bg-neutral-700 transition-all cursor-pointer"
                >
                  Volver al Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-white font-black text-2xl mb-2">Crea tu nueva <span className="text-red-600">contraseña</span></h1>
                <p className="text-neutral-500 text-sm">Estás restableciendo la contraseña para: <span className="text-neutral-300 font-semibold">{email}</span></p>
              </div>

              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                  <p className="text-red-400 text-sm font-medium">{message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !password || !confirmPassword}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Guardando...
                    </span>
                  ) : 'Actualizar contraseña'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-neutral-500 hover:text-red-600 text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
