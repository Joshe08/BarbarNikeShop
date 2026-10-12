import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useApp } from '../context/AppContext';
import { useAvailability } from '../hooks/useAvailability';
import { formatCOP } from '../utils/format';
import { sendBookingEmail } from '../utils/emailService';


// ─── helpers ───────────────────────────────────────────────
const SUBCATEGORY_LABELS = {
  cortes: 'Cortes & Peinados',
  coloracion: 'Coloracion',
  tratamientos: 'Tratamientos',
  unas: 'Manicura & Unas',
};

function buildWhatsAppUrl(selection, user, notes, editBooking) {
  // Enviar directamente al WhatsApp del especialista si está registrado, sino a la administración
  const workerPhone = selection.worker?.phone || editBooking?.workerPhone;
  const phone = workerPhone ? workerPhone.replace(/\D/g, '') : '573028676396';
  
  const serviceName = selection.service?.name || editBooking?.service || 'Servicio';
  const priceStr = selection.service?.price ? formatCOP(selection.service.price) : (editBooking?.price ? formatCOP(editBooking.price) : 'N/A');
  const workerName = selection.worker?.name || editBooking?.workerName || 'Especialista';
  const dateStr = selection.date || editBooking?.date;
  const timeStr = selection.time || editBooking?.time;

  const msg =
    `*Nueva Reserva - Barber Kalvin Shop*\n\n` +
    `*Cliente:* ${user?.name}\n` +
    `*Telefono:* ${user?.phone || 'N/A'}\n` +
    `*Servicio:* ${serviceName}\n` +
    `*Precio:* ${priceStr}\n` +
    `*Especialista:* ${workerName}\n` +
    `*Fecha:* ${dateStr}\n` +
    `*Hora:* ${timeStr}\n` +
    (notes ? `*Observaciones:* ${notes}\n\n` : `\n`) +
    `¡Nos vemos pronto!`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

function buildGoogleCalendarUrl(selection, editBooking) {
  const dateStr = selection.date || editBooking?.date;
  const timeStr = selection.time || editBooking?.time;
  const serviceName = selection.service?.name || editBooking?.service || 'Servicio';
  const workerName = selection.worker?.name || editBooking?.workerName || 'Especialista';
  const branchName = selection.branch?.name || editBooking?.branchName || 'Barber Kalvin';
  const branchAddress = selection.branch?.address || '';

  if (!dateStr || !timeStr) return '#';

  try {
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    const duration = selection.service?.duration || editBooking?.serviceDuration || 30;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`;
    const text = encodeURIComponent(`Cita en Barber Kalvin: ${serviceName}`);
    const details = encodeURIComponent(`Especialista: ${workerName}\nServicio: ${serviceName}\nSede: ${branchName}`);
    const location = encodeURIComponent(branchAddress || branchName);

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  } catch (err) {
    console.error('Error al generar URL de Google Calendar:', err);
    return '#';
  }
}

function buildIcsDataUri(selection, editBooking) {
  const dateStr = selection.date || editBooking?.date;
  const timeStr = selection.time || editBooking?.time;
  const serviceName = selection.service?.name || editBooking?.service || 'Servicio';
  const workerName = selection.worker?.name || editBooking?.workerName || 'Especialista';
  const branchName = selection.branch?.name || editBooking?.branchName || 'Barber Kalvin';
  const branchAddress = selection.branch?.address || '';

  if (!dateStr || !timeStr) return '#';

  try {
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    const duration = selection.service?.duration || editBooking?.serviceDuration || 30;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const formatIcsDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Barber Kalvin//NONSGML Citas//ES',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@barberkalvin.com`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:Cita en Barber Kalvin: ${serviceName}`,
      `DESCRIPTION:Especialista: ${workerName}\\nServicio: ${serviceName}\\nSede: ${branchName}`,
      `LOCATION:${branchAddress || branchName}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
  } catch (err) {
    console.error('Error al generar archivo ICS:', err);
    return '#';
  }
}

// ─── Slot Button ────────────────────────────────────────────
function SlotButton({ time, status, selected, onClick }) {
  const base = 'py-3 rounded-xl text-sm font-bold transition-all text-center';
  if (status === 'past')
    return <div className={`${base} bg-neutral-800/30 text-neutral-700 cursor-not-allowed`}>{time}</div>;
  if (status === 'blocked')
    return (
      <div className={`${base} bg-red-500/10 border border-red-500/20 text-red-500/60 cursor-not-allowed relative group`}>
        {time}
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-800 text-xs text-red-400 px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">Ocupado</span>
      </div>
    );
  return (
    <button
      onClick={onClick}
      className={`${base} cursor-pointer ${
        selected
          ? 'bg-red-600 text-white shadow-[0_5px_15px_rgba(249,115,22,0.4)]'
          : 'bg-neutral-800/50 border border-white/5 text-neutral-400 hover:border-red-600/50 hover:text-white'
      }`}
    >
      {time}
    </button>
  );
}

// ─── Worker Card ─────────────────────────────────────────────
function WorkerCard({ worker, selected, onSelect, accentClass }) {
  const roleBadge = { barber: 'Barbero', stylist: 'Estilista', manicurist: 'Manicurista' };
  return (
    <button
      onClick={onSelect}
      className={`p-5 rounded-[2rem] border transition-all flex flex-col items-center gap-4 cursor-pointer group ${
        selected ? `border-current ${accentClass} bg-current/10` : 'border-white/5 bg-neutral-800/30 hover:border-white/20'
      }`}
    >
      <div className="relative">
        <img src={worker.image} className="w-20 h-20 rounded-3xl object-cover border-2 border-white/10 group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-neutral-900" />
      </div>
      <div className="text-center">
        <p className="text-white font-black text-base">{worker.name}</p>
        <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${accentClass}`}>{worker.specialty}</p>
        <span className="text-neutral-600 text-[10px] uppercase tracking-widest">{roleBadge[worker.role]}</span>
      </div>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────
function AuthRequiredStep({ accentBg, accentShadow, onBack }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const result = await login(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.message || 'Correo o contraseña incorrectos.');
      }
    } else {
      if (!name) {
        setError('El nombre es obligatorio.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
      }
      const result = await register({ name, email, password, phone });
      setLoading(false);
      if (!result.success) {
        setError(result.message || 'Error al crear la cuenta.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-slide-up text-center max-w-md mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V8a4 4 0 10-8 0v3m-2 0h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-white font-black text-xl">
          {isLogin ? 'Inicia sesión para continuar' : 'Regístrate para continuar'}
        </h3>
        <p className="text-neutral-500 text-xs leading-relaxed max-w-xs mx-auto">
          {isLogin 
            ? 'Ingresa tus datos para confirmar tu fecha y hora de reserva.' 
            : 'Crea tu cuenta gratis para agendar y gestionar tus citas.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-left flex gap-2 animate-fade-in">
          <svg className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-xs font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleAuthSubmit} className="bg-neutral-900/60 border border-white/5 rounded-[2rem] p-6 text-left space-y-4">
        {!isLogin && (
          <>
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-[9px] font-black uppercase tracking-widest block">Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                disabled={loading}
                className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none text-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-[9px] font-black uppercase tracking-widest block">Teléfono / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                disabled={loading}
                className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none text-sm transition-all"
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-neutral-400 text-[9px] font-black uppercase tracking-widest block">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
            disabled={loading}
            className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none text-sm transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-neutral-400 text-[9px] font-black uppercase tracking-widest block">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none text-sm transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full ${accentBg} text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg ${accentShadow} transition-all cursor-pointer flex items-center justify-center gap-2`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Procesando...
            </>
          ) : (
            isLogin ? 'Iniciar sesión' : 'Registrarse'
          )}
        </button>
      </form>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-red-600 hover:text-red-500 text-xs font-bold transition-colors cursor-pointer"
        >
          {isLogin ? '¿No tienes una cuenta? Regístrate gratis' : '¿Ya tienes una cuenta? Inicia sesión'}
        </button>
        
        <button onClick={onBack} className="text-neutral-500 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver a cambiar mi selección
        </button>
      </div>
    </div>
  );
}

function EmailVerificationStep({ accentBg, accentShadow, onBack }) {
  const { user, sendVerificationEmail, reloadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const refreshedUser = await reloadUser();
      setLoading(false);
      if (refreshedUser && refreshedUser.emailVerified) {
        setMessage('✓ ¡Excelente! Tu correo ha sido verificado con éxito.');
      } else {
        setError('El correo electrónico aún no ha sido verificado. Por favor, revisa tu bandeja de entrada y abre el enlace de verificación.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al verificar tu cuenta. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setMessage('');
    try {
      const result = await sendVerificationEmail();
      if (result.success) {
        setMessage('✓ Correo de verificación reenviado. Revisa tu bandeja de entrada.');
        setCooldown(60);
      } else {
        setError(result.message || 'Error al enviar el correo.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al enviar el correo. Intenta de nuevo.');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up text-center max-w-md mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-4a2 2 0 011.642 0l8 4A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.25 0l-2.25 1.5" />
        </svg>
      </div>

      <div className="space-y-1">
        <h3 className="text-white font-black text-xl">Verifica tu Correo</h3>
        <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
          Hemos enviado un enlace de verificación a tu correo <strong className="text-white">{user?.email}</strong>. 
          Por favor, confírmalo para poder agendar tu cita y evitar correos falsos.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-left flex gap-2 animate-fade-in">
          <svg className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-xs font-semibold">{error}</p>
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-left flex gap-2 animate-fade-in">
          <svg className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-400 text-xs font-semibold">{message}</p>
        </div>
      )}

      <div className="bg-neutral-900/60 border border-white/5 rounded-[2rem] p-6 text-left space-y-4">
        <button
          onClick={handleVerify}
          disabled={loading}
          className={`w-full ${accentBg} text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg ${accentShadow} transition-all cursor-pointer flex items-center justify-center gap-2`}
        >
          {loading ? 'Verificando...' : 'Ya verifiqué mi correo'}
        </button>

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full bg-neutral-800 text-neutral-300 hover:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-neutral-750 transition-all cursor-pointer"
        >
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar enlace de verificación'}
        </button>
      </div>

      <div>
        <button onClick={onBack} className="text-neutral-500 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver
        </button>
      </div>
    </div>
  );
}

function BookingModal({ isOpen, onClose, preselectedService = null, editBooking = null }) {
  const { user, isAuthenticated } = useAuth();
  const { addBooking, updateBooking, getClientDailyBookingCount, MAX_BOOKINGS_PER_DAY } = useBookings();
  const { barbers = [], menServices = [], branches = [], closures = [], operationalStatus, getServicePromoInfo } = useApp();

  const [category, setCategory] = useState('men');
  const [step, setStep] = useState(2); // Inicia en 2 (Barbero) para barbería unificada
  const [selection, setSelection] = useState({ 
    branch: branches[0] || { id: 'branch-1', name: 'Barber Kalvin' }, 
    worker: null, 
    service: null, 
    date: '', 
    time: '' 
  });
  const [notes, setNotes] = useState(''); // Observaciones
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const defaultBranch = branches[0] || { id: 'branch-1', name: 'Barber Kalvin' };

  const { getSlots, isWorkerAvailableOnDate, loading: availLoading } = useAvailability(
    selection.worker,
    selection.date,
    selection.service?.duration,
    editBooking?.id || null,
    true
  );

  const isMen = true;
  const accent = 'text-red-600';
  const accentBg = 'bg-red-600';
  const accentShadow = 'shadow-red-600/30';

  const reset = () => {
    setStep(2);
    setCategory('men');
    setSelection({ branch: defaultBranch, worker: null, service: null, date: '', time: '' });
    setNotes('');
    setBookingError('');
    setSubmitting(false);
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isOpen) {
      if (editBooking) {
        const foundWorker = (barbers || []).find(w => w.id === editBooking.workerId);
        const foundBranch = (branches || []).find(b => b.id === editBooking.branchId) || (branches || []).find(b => b.id === (foundWorker?.branchId || 'branch-1'));
        const foundService = (menServices || []).find(s => s.name === editBooking.service);
        setCategory('men');
        setSelection({
          branch: foundBranch || null,
          worker: foundWorker || null,
          service: foundService || null,
          date: editBooking.date,
          time: editBooking.time
        });
        setNotes(editBooking.notes || '');
        setStep(4);
      } else if (preselectedService) {
        setCategory('men');
        setSelection({
          branch: defaultBranch,
          worker: null,
          service: preselectedService,
          date: '',
          time: ''
        });
        setStep(2);
      } else {
        reset();
      }
    }
  }, [isOpen, preselectedService, editBooking, (barbers || []).length, (branches || []).length]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  if (!isOpen) return null;
  const availableWorkers = (barbers || []).filter(w => {
    // Restricción: un trabajador no puede agendarse consigo mismo
    if (user) {
      const isSelfId = w.id === user.uid || w.id === user.id || w.uid === user.uid;
      const isSelfEmail = w.email && user.email && w.email.toLowerCase() === user.email.toLowerCase();
      const isSelfName = w.name && user.name && w.name.trim().toLowerCase() === user.name.trim().toLowerCase();
      if (isSelfId || isSelfEmail || isSelfName) return false;
    }
    if (selection.service && selection.service.workerRoles) {
      return selection.service.workerRoles.includes(w.role);
    }
    return true;
  });

  const availableServices = menServices || [];

  const handleClose = () => { reset(); onClose(); };

  const continueAfterWorker = (worker) => {
    setSelection(p => ({ ...p, worker, date: '', time: '' }));
    if (selection.service) {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const continueAfterService = (service) => {
    setSelection(p => ({ ...p, service, date: '', time: '' }));
    setStep(4);
  };

  const handleConfirm = async () => {
    if (!isAuthenticated) return;
    if (editBooking) {
      setSubmitting(true);
      setBookingError('');
      
      const bookingData = {
        clientId: editBooking.clientId,
        clientName: editBooking.clientName,
        clientPhone: editBooking.clientPhone,
        clientEmail: editBooking.clientEmail,
        clientImage: editBooking.clientImage,
        branchId: selection.branch?.id || editBooking.branchId || 'branch-1',
        branchName: selection.branch?.name || editBooking.branchName || 'Barber Kalvin',
        workerId: selection.worker?.id || editBooking.workerId || '',
        workerName: selection.worker?.name || editBooking.workerName || 'Especialista no disponible',
        workerRole: selection.worker?.role || editBooking.workerRole || 'staff',
        service: selection.service?.name || editBooking.service || '',
        servicePrice: selection.service ? selection.service.price : (editBooking.servicePrice || 0),
        serviceDuration: selection.service ? selection.service.duration : (editBooking.serviceDuration || 30),
        category,
        date: selection.date,
        time: selection.time,
        notes,
      };

      const result = await updateBooking({ id: editBooking.id, ...bookingData, status: editBooking.status });
      setSubmitting(false);
      if (result.success) {
        setStep(7);
      } else {
        setBookingError(result.message);
      }
    } else {
      // Guardar cita directamente (pago en sede)
      handleFinalSubmitDirectly();
    }
  };

  const handleFinalSubmitDirectly = async () => {
    setSubmitting(true);
    setBookingError('');

    // Calcular precio real (aplica promoción si existe para la fecha seleccionada)
    const promoInfo = (selection.service && getServicePromoInfo)
      ? getServicePromoInfo(selection.service, selection.date)
      : { hasPromo: false, promoPrice: selection.service?.price || 0, promo: null };

    const finalServicePrice = promoInfo.hasPromo ? promoInfo.promoPrice : (selection.service ? selection.service.price : 0);
    
    const bookingData = {
      clientId: user.uid,
      clientName: user.name,
      clientPhone: user.phone || '',
      clientEmail: user.email,
      clientImage: user.image || '',
      branchId: selection.branch?.id || 'branch-1',
      branchName: selection.branch?.name || 'Barber Kalvin',
      workerId: selection.worker?.id || '',
      workerName: selection.worker?.name || 'Barbero no disponible',
      workerRole: selection.worker?.role || 'barber',
      service: selection.service?.name || '',
      servicePrice: finalServicePrice,
      originalPrice: selection.service?.price || 0,
      promoApplied: promoInfo.hasPromo ? (promoInfo.promo?.name || 'Promoción Especial') : null,
      serviceDuration: selection.service ? selection.service.duration : 30,
      category,
      date: selection.date,
      time: selection.time,
      notes,
      paymentMethod: 'local',
      paymentStatus: 'pending'
    };

    const result = await addBooking(bookingData);
    
    if (result.success) {
      setSubmitting(false);
      try {
        // Enviar correo de confirmación
        sendBookingEmail(bookingData, 'confirmacion');
      } catch (err) {
        console.error('Error sending confirmation email:', err);
      }
      setStep(7);
    } else {
      setSubmitting(false);
      setBookingError(result.message);
    }
  };



  const slots = selection.worker && selection.date && selection.service ? getSlots() : [];
  const workerAvailable = selection.worker && selection.date ? isWorkerAvailableOnDate() : true;
  const isOperationalClosed = operationalStatus && operationalStatus.isOpen === false;
  const isBranchClosed = isOperationalClosed || !!(selection.branch && selection.date && closures.some(
    c => (c.branchId === 'all' || c.branchId === selection.branch.id) && c.date === selection.date
  ));
  const isDailyLimitReached = !!(!editBooking && user && selection.date && getClientDailyBookingCount(user.uid || user.id, selection.date) >= MAX_BOOKINGS_PER_DAY);
  
  // Obtener fecha minima en hora local (considerando horario de cierre 20:00)
  const getMinDateInfo = () => {
    const now = new Date();
    const currentHour = now.getHours();
    // Si ya son las 20:00 o mas, solo se puede agendar para manana en adelante
    const isClosedForToday = currentHour >= 20;
    
    const baseDate = new Date(now);
    if (isClosedForToday) {
      baseDate.setDate(baseDate.getDate() + 1);
    }
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day   = String(baseDate.getDate()).padStart(2, '0');
    return {
      minDate: `${year}-${month}-${day}`,
      isClosedForToday,
    };
  };
  const { minDate, isClosedForToday } = getMinDateInfo();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-neutral-900 border border-white/10 rounded-none md:rounded-[2.5rem] w-full max-w-2xl h-full md:h-auto max-h-[100vh] md:max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-neutral-800/50 sticky top-0 z-10 backdrop-blur-md flex-shrink-0">
          <div>
            <h2 className="text-white text-xl font-black flex items-center gap-2">
              <span className={`text-xs uppercase tracking-widest ${accent}`}>Agendar</span> Cita
            </h2>
            {category && step > 0 && step < 5 && (
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${accent}`}>
                {isMen ? 'Barberia' : 'Salon Nike'}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-full transition-colors cursor-pointer">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 md:p-10 flex-1 overflow-y-auto">

          {/* Banner de Barbería Cerrada Temporalmente */}
          {operationalStatus && operationalStatus.isOpen === false && (
            <div className="mb-6 p-4 rounded-2xl bg-red-600/10 border border-red-600/30 text-center space-y-1">
              <span className="text-red-500 font-black text-xs uppercase tracking-widest block">
                🛑 Barbería Cerrada Temporalmente
              </span>
              <p className="text-neutral-300 text-xs">
                {operationalStatus.reason || 'Estamos realizando labores de mantenimiento.'}
              </p>
              {operationalStatus.reopenDate && (
                <p className="text-red-400 text-[11px] font-bold">
                  Reapertura programada: {operationalStatus.reopenDate}
                </p>
              )}
            </div>
          )}

          {/* Progress bar (steps 2-5: Barbero, Servicio, Horario, Confirmar) */}
          {step >= 2 && step <= 5 && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[
                  { stepNum: 2, label: 'Barbero' },
                  { stepNum: 3, label: 'Servicio' },
                  { stepNum: 4, label: 'Horario' },
                  { stepNum: 5, label: 'Confirmar' }
                ].map((item) => (
                  <span key={item.label} className={`text-[9px] font-bold uppercase tracking-widest ${step === item.stepNum ? accent : 'text-neutral-600'}`}>
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${accentBg}`}
                  style={{ width: `${((step - 2) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ─── STEP 2: Specialist ──────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <h3 className="text-white font-black text-2xl text-center">
                Elige tu <span className={accent}>Barbero</span>
              </h3>

              {/* Aviso si el usuario autenticado es staff */}
              {user && ['barber'].includes(user.role) && (
                <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-3 flex items-center gap-3">
                  <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-500 text-xs font-bold">No puedes agendar una cita contigo mismo. Selecciona otro barbero.</p>
                </div>
              )}

              {availableWorkers.length === 0 ? (
                <div className="bg-neutral-800/50 border border-white/5 rounded-3xl p-10 text-center">
                  <p className="text-neutral-500 text-sm">No hay barberos disponibles en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableWorkers.map(w => (
                    <WorkerCard
                      key={w.id}
                      worker={w}
                      selected={selection.worker?.id === w.id}
                      onSelect={() => continueAfterWorker(w)}
                      accentClass={accent}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: Service ──────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-slide-up">
              <h3 className="text-white font-black text-2xl text-center">
                Selecciona el <span className={accent}>Servicio</span>
              </h3>

              <div className="grid grid-cols-1 gap-4 max-h-[420px] overflow-y-auto pr-1">
                  {availableServices.map(s => (
                    <button key={s.id}
                      onClick={() => continueAfterService(s)}
                      className="p-5 rounded-[2rem] border transition-all text-left cursor-pointer group border-white/5 bg-neutral-800/30 hover:border-red-600/30"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-white font-black text-lg group-hover:text-red-600 transition-colors">{s.name}</p>
                          <p className="text-neutral-500 text-sm mt-1 line-clamp-2">{s.description}</p>
                          <span className="inline-block bg-white/5 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mt-3">{s.duration} min</span>
                        </div>
                        <p className="text-red-600 font-black text-2xl flex-shrink-0">{formatCOP(s.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>

              <button onClick={() => setStep(2)} className="text-neutral-500 hover:text-white text-sm font-bold transition-colors cursor-pointer flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver
              </button>
            </div>
          )}

          {/* ─── STEP 4: Date & Time ─────────────────────── */}
          {step === 4 && (
            <div className="space-y-8 animate-slide-up">
              <h3 className="text-white font-black text-2xl text-center">Fecha y <span className={accent}>Hora</span></h3>

              <div>
                <label className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-3 block">Elige un dia</label>
                {isClosedForToday && (
                  <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-3 mb-3">
                    <p className="text-red-500 text-xs font-bold flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      La barbería ya cerró por hoy. Las reservas están disponibles a partir de mañana.
                    </p>
                  </div>
                )}
                <input
                  type="date"
                  min={minDate}
                  value={selection.date}
                  onChange={e => {
                    let val = e.target.value;
                    if (val < minDate) val = minDate;
                    setSelection(p => ({ ...p, date: val, time: '' }));
                  }}
                  className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl p-4 text-white focus:border-red-600 outline-none transition-all"
                />
              </div>

              {selection.date && isBranchClosed && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-2">
                  <p className="text-red-400 font-bold text-sm flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Barbería Cerrada Temporalmente
                  </p>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    La barbería estará cerrada el día <span className="text-white font-bold">{selection.date}</span> debido a: <span className="text-white italic">"{closures.find(c => (c.branchId === 'all' || c.branchId === selection.branch?.id) && c.date === selection.date)?.reason || 'Motivo de fuerza mayor'}"</span>.
                  </p>
                  <p className="text-red-400/80 text-[10px] uppercase font-bold tracking-widest">Por favor, selecciona otra fecha.</p>
                </div>
              )}

              {selection.date && !isBranchClosed && isDailyLimitReached && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-2">
                  <p className="text-red-400 font-bold text-sm flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Límite de Citas Excedido
                  </p>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Ya tienes <span className="text-white font-bold">{MAX_BOOKINGS_PER_DAY}</span> citas activas agendadas para el día <span className="text-white font-bold">{selection.date}</span>.
                  </p>
                  <p className="text-red-400/80 text-[10px] uppercase font-bold tracking-widest">
                    Por seguridad, solo se permiten {MAX_BOOKINGS_PER_DAY} citas por cliente al día. Selecciona otra fecha.
                  </p>
                </div>
              )}

              {selection.date && !isBranchClosed && !isDailyLimitReached && !workerAvailable && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-red-400 text-sm font-bold">
                    {selection.worker?.name} no trabaja ese dia. Por favor elige otra fecha.
                  </p>
                </div>
              )}

              {selection.date && !isBranchClosed && !isDailyLimitReached && workerAvailable && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Horarios disponibles</label>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />Libre</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />Ocupado</span>
                    </div>
                  </div>
                  {availLoading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {[...Array(10)].map((_, i) => <div key={i} className="h-11 bg-neutral-800/50 rounded-xl animate-pulse" />)}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-neutral-500 text-sm text-center py-4">No hay horarios disponibles para este dia</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {slots.map(({ time, status }) => (
                        <SlotButton
                          key={time}
                          time={time}
                          status={status}
                          selected={selection.time === time}
                          onClick={() => setSelection(p => ({ ...p, time }))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => { if (preselectedService || editBooking) { setStep(2); } else { setStep(3); } }} className="text-neutral-500 hover:text-white text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Volver
                </button>
                <button
                  disabled={!selection.date || !selection.time || isBranchClosed || isDailyLimitReached}
                  onClick={() => setStep(5)}
                  className={`${accentBg} text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-30 shadow-lg ${accentShadow} active:scale-95 transition-all cursor-pointer`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Confirm ─────────────────────────── */}
          {step === 5 && (
            !isAuthenticated ? (
              <AuthRequiredStep
                accentBg={accentBg}
                accentShadow={accentShadow}
                onBack={() => setStep(4)}
              />
            ) : user && !user.emailVerified ? (
              <EmailVerificationStep
                accentBg={accentBg}
                accentShadow={accentShadow}
                onBack={() => setStep(4)}
              />
            ) : (
            <div className="space-y-6 animate-slide-up">
              <h3 className="text-white font-black text-2xl text-center">Revisar <span className={accent}>Reserva</span></h3>

              {!isAuthenticated && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-red-400 font-bold">Debes iniciar sesion para confirmar</p>
                  <div className="flex gap-3 justify-center">
                    <Link to="/login" onClick={handleClose} className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all">
                      Iniciar sesion
                    </Link>
                    <Link to="/register" onClick={handleClose} className="bg-neutral-800 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-700 transition-all">
                      Registrarme
                    </Link>
                  </div>
                </div>
              )}

              <div className="bg-neutral-800/30 p-6 rounded-[2rem] border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Establecimiento</span>
                  <span className="text-white font-black">{selection.branch?.name || 'Barber Kalvin'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Cliente</span>
                  <span className="text-white font-black">{user?.name || '—'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selection.worker?.image || 'https://images.unsplash.com/photo-1599351431247-f57930f489c3?w=400&h=400&fit=crop&fm=webp&q=70'} 
                      className="w-10 h-10 rounded-full object-cover border border-white/10" 
                      alt={selection.worker?.name || 'Especialista'}
                    />
                    <div>
                      <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest block">Barbero</span>
                      <span className="text-white font-bold text-sm">{selection.worker?.name || editBooking?.workerName || 'Especialista no disponible'}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                  <div>
                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Fecha</span>
                    <span className="text-white font-bold">{selection.date}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Hora</span>
                    <span className={`font-black text-lg ${accent}`}>{selection.time}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Servicio</span>
                    <span className="text-white font-bold">{selection.service?.name}</span>
                    <span className="text-neutral-600 text-xs block">{selection.service?.duration} min</span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Total a pagar en barbería</span>
                    {(() => {
                      const promo = (selection.service && getServicePromoInfo) 
                        ? getServicePromoInfo(selection.service, selection.date) 
                        : { hasPromo: false, promoPrice: selection.service?.price };
                      return (
                        <div>
                          {promo.hasPromo ? (
                            <div className="space-y-0.5">
                              <span className={`font-black text-2xl ${accent}`}>{formatCOP(promo.promoPrice)}</span>
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-xs text-neutral-500 line-through">{formatCOP(selection.service?.price)}</span>
                                <span className="bg-yellow-500/20 text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded">Promo aplicada</span>
                              </div>
                            </div>
                          ) : (
                            <span className={`font-black text-2xl ${accent}`}>{formatCOP(selection.service?.price)}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Campo de Observaciones */}
              <div className="space-y-2">
                <label className="text-neutral-500 text-[10px] font-black uppercase tracking-widest block">Observaciones adicionales (opcional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Detalles sobre algun corte especial, alergia, preferencia de bebida, etc..."
                  className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl p-4 text-white text-sm focus:border-red-600 outline-none transition-all resize-none h-20"
                />
              </div>

              {bookingError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-red-400 text-sm font-bold">{bookingError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setStep(4)} className="flex-1 bg-neutral-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-700 transition-all cursor-pointer">
                  Volver
                </button>
                {isAuthenticated && (
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className={`flex-1 ${accentBg} text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg ${accentShadow} active:scale-95 transition-all cursor-pointer disabled:opacity-50`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Confirmando...
                      </span>
                    ) : (editBooking ? 'Confirmar Cambios' : 'Confirmar Reserva')}
                  </button>
                )}
              </div>
            </div>
            )
          )}

          {/* ─── STEP 7: Success ─────────────────────────── */}
          {step === 7 && (
            <div className="space-y-8 text-center py-6 animate-slide-up">
              <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.15)]">
                <svg className="h-12 w-12 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>

              <div>
                <h3 className="text-white font-black text-4xl mb-3">¡Reserva Exitosa!</h3>
                <p className="text-neutral-500 font-medium">
                  Tu cita ha sido guardada. <span className="text-white">Notifica a tu especialista</span> por WhatsApp.
                </p>
              </div>

              <div className="bg-neutral-800/50 p-6 rounded-[2rem] border border-white/5 space-y-2">
                <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">{selection.branch?.name || editBooking?.branchName || 'Barber Kalvin'}</p>
                <p className={`font-black text-lg ${accent}`}>{selection.worker?.name || editBooking?.workerName || 'Especialista no disponible'}</p>
                <p className="text-white font-bold">{selection.service?.name || editBooking?.service || ''}</p>
                <p className="text-neutral-400 text-sm">{selection.date} — {selection.time}</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.open(buildWhatsAppUrl(selection, user, notes, editBooking), '_blank')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-600/30 cursor-pointer active:scale-[0.98]"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {selection.worker?.phone || editBooking?.workerPhone ? 'Notificar Especialista por WhatsApp' : 'Notificar por WhatsApp'}
                </button>

                {/* Card de Calendario Recordatorio */}
                <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-3 justify-center text-red-600 font-bold text-xs uppercase tracking-widest">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Programar Recordatorio (1 o 2h antes)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={buildGoogleCalendarUrl(selection, editBooking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-red-600/30"
                    >
                      <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                      Google Calendar
                    </a>
                    <a
                      href={buildIcsDataUri(selection, editBooking)}
                      download={`cita-barberkalvin-${selection.date || editBooking?.date || 'reserva'}.ics`}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-red-600/30"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Apple / iCal
                    </a>
                  </div>
                  <p className="text-neutral-400 text-[10px] leading-relaxed">
                    Al añadir la cita a tu calendario, tu dispositivo móvil o computadora te enviará una alerta automática 1 o 2 horas antes de iniciar.
                  </p>
                </div>

                <button onClick={handleClose} className="w-full bg-neutral-800 text-neutral-500 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-white transition-all cursor-pointer">
                  Volver al inicio
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default BookingModal;
