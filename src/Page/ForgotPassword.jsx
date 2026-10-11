import { useState } from 'react';
import { Link  } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    if (result.success) {
      setStatus('success');
      setMessage('¡Correo enviado! Revisa tu bandeja de entrada y sigue las instrucciones.');
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-red-600 selection:text-white">
      {/* Background glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block">
            <span className="text-white text-3xl font-black tracking-tight">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain inline-block mr-2 align-middle" />Barber<span className="text-red-600">Kalvin</span>
            </span>
          </Link>
          <p className="text-neutral-500 text-sm mt-2 font-medium">Recupera tu acceso</p>
        </div>

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/8 rounded-[2.5rem] p-8 shadow-2xl">
          {status === 'success' ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20">
                <svg className="h-10 w-10 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-black text-2xl mb-2">¡Correo Enviado!</h2>
                <p className="text-neutral-400 text-sm leading-relaxed">{message}</p>
              </div>
              <Link
                to="/login"
                className="block w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-center hover:bg-red-700 transition-all"
              >
                Volver al Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-white font-black text-2xl mb-2">¿Olvidaste tu <span className="text-red-600">contraseña?</span></h1>
                <p className="text-neutral-500 text-sm">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
              </div>

              {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                  <p className="text-red-400 text-sm font-medium">{message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Enviando...
                    </span>
                  ) : 'Enviar enlace'}
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

export default ForgotPassword;
