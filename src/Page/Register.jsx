import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    const result = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Débil', 'Media', 'Fuerte'];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-red-600 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-white text-3xl font-black tracking-tight">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain inline-block mr-2 align-middle" />Barber<span className="text-red-600">Kalvin</span>
            </span>
          </Link>
          <p className="text-neutral-500 text-sm mt-2">Crea tu cuenta y agenda tus citas</p>
        </div>

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/8 rounded-[2.5rem] p-8 shadow-2xl">
          <h1 className="text-white font-black text-2xl mb-2">
            Crear <span className="text-red-600">cuenta</span>
          </h1>
          <p className="text-neutral-500 text-sm mb-7">Es gratis y solo toma un minuto</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Nombre completo *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handle('name', e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Correo electrónico *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handle('email', e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">WhatsApp</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handle('phone', e.target.value)}
                  placeholder="573001234567"
                  className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Contraseña *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handle('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-4 pr-12 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPass ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${strengthColor[strength]}`}
                      style={{ width: `${(strength / 3) * 100}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold ${strength === 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Confirmar contraseña *</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => handle('confirm', e.target.value)}
                placeholder="Repite tu contraseña"
                required
                className={`w-full bg-neutral-800/60 border rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all ${
                  form.confirm && form.password !== form.confirm ? 'border-red-500/50' : 'border-white/5'
                }`}
              />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-red-400 text-xs mt-1 font-medium">Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (form.confirm && form.password !== form.confirm)}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] cursor-pointer mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creando cuenta...
                </span>
              ) : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-red-600 font-black hover:text-red-500 transition-colors">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
