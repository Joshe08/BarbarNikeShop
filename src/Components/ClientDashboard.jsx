import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { formatCOP } from '../utils/format';
import BookingModal from './BookingModal';
import ProfileModal from './ProfileModal';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

// ─── Configuración de niveles de fidelidad ───────────────────────────
const LEVELS = [
  { name: 'Bronce',   min: 0,   max: 199,  color: '#cd7f32', glow: 'rgba(205,127,50,0.4)',  bg: 'from-amber-900/60 to-neutral-900',   border: 'border-amber-700/40',   badge: '🥉' },
  { name: 'Plata',    min: 200, max: 499,  color: '#c0c0c0', glow: 'rgba(192,192,192,0.4)', bg: 'from-neutral-600/60 to-neutral-900', border: 'border-neutral-400/40', badge: '🥈' },
  { name: 'Oro',      min: 500, max: 999,  color: '#FFD700', glow: 'rgba(255,215,0,0.4)',   bg: 'from-yellow-600/60 to-neutral-900',  border: 'border-yellow-400/40',  badge: '🥇' },
  { name: 'Diamante', min: 1000, max: Infinity, color: '#b9f2ff', glow: 'rgba(185,242,255,0.4)', bg: 'from-cyan-700/60 to-neutral-900', border: 'border-cyan-300/40', badge: '💎' },
];

const REWARDS = [
  { id: 'r1', name: 'Descuento $5.000',  points: 200,  icon: '💵', desc: 'Descuento directo en tu próxima cita' },
  { id: 'r2', name: 'Descuento $10.000', points: 400,  icon: '💶', desc: 'Descuento directo en tu próxima cita' },
  { id: 'r3', name: 'Corte gratis',      points: 800,  icon: '✂️', desc: 'Un corte de cabello sin costo (hasta $25.000)' },
  { id: 'r4', name: 'Producto gratis',   points: 1200, icon: '🎁', desc: 'Un producto de la tienda sin costo (hasta $30.000)' },
];

function getLevelInfo(points) {
  return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

function getNextLevel(points) {
  return LEVELS.find(l => l.min > points) || null;
}

// ─── Tarjeta Dorada de Fidelidad ─────────────────────────────────────
function LoyaltyCard({ user, points, onRedeem }) {
  const level = getLevelInfo(points);
  const next  = getNextLevel(points);
  const progress = next ? Math.min(((points - level.min) / (next.min - level.min)) * 100, 100) : 100;

  return (
    <div className={`relative rounded-[2rem] p-6 bg-gradient-to-br ${level.bg} border ${level.border} overflow-hidden shadow-2xl`}
      style={{ boxShadow: `0 0 60px ${level.glow}` }}>

      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${level.color}, transparent)` }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${level.color}, transparent)` }} />
        {/* Líneas decorativas tipo tarjeta */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 400 200">
          <circle cx="320" cy="100" r="80" fill="none" stroke="white" strokeWidth="40"/>
          <circle cx="280" cy="100" r="80" fill="none" stroke="white" strokeWidth="40"/>
        </svg>
      </div>

      <div className="relative z-10 space-y-5">
        {/* Encabezado de la tarjeta */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">BarberNike</p>
            <p className="text-white/80 text-xs font-bold mt-0.5">Tarjeta de Fidelidad</p>
          </div>
          <div className="text-right">
            <span className="text-2xl">{level.badge}</span>
            <p className="text-[10px] font-black uppercase tracking-widest mt-0.5"
              style={{ color: level.color }}>{level.name}</p>
          </div>
        </div>

        {/* Puntos en grande */}
        <div>
          <p className="font-black tracking-wider text-5xl" style={{ color: level.color }}>
            {points.toLocaleString('es-CO')}
          </p>
          <p className="text-white/50 text-xs font-bold tracking-widest uppercase mt-1">puntos acumulados</p>
        </div>

        {/* Nombre del titular */}
        <div>
          <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Titular</p>
          <p className="text-white font-black text-base uppercase tracking-wider">{user?.name || 'CLIENTE'}</p>
        </div>

        {/* Barra de progreso al siguiente nivel */}
        {next && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-white/50">Progreso a {next.badge} {next.name}</span>
              <span style={{ color: level.color }}>{next.min - points} pts restantes</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${level.color}, white)` }} />
            </div>
          </div>
        )}
        {!next && (
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-xs font-black" style={{ color: level.color }}>💎 ¡Nivel Máximo Alcanzado! Eres VIP</p>
          </div>
        )}

        {/* Botón de canje */}
        <button
          onClick={onRedeem}
          className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer text-neutral-900"
          style={{ background: `linear-gradient(135deg, ${level.color}, white)` }}
        >
          🎁 Canjear Puntos
        </button>
      </div>
    </div>
  );
}

// ─── Modal de Canje ───────────────────────────────────────────────────
function RedeemModal({ points, user, onClose, redeemPoints }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const handleRedeem = async () => {
    if (!selected) return;
    setLoading(true);
    const res = await redeemPoints(user.uid, user.name, selected.points, selected.name);
    setLoading(false);
    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={!loading ? onClose : undefined} />
      <div className="relative bg-neutral-900 border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-500/10 border-b border-white/5 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-white font-black text-xl">Canjear Puntos</h3>
            <p className="text-yellow-400 font-black text-sm mt-0.5">🏆 {points.toLocaleString('es-CO')} pts disponibles</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {result ? (
            result.success ? (
              <div className="text-center space-y-4 py-6">
                <div className="text-6xl">🎉</div>
                <h4 className="text-white font-black text-xl">¡Canje Exitoso!</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Canjeaste <span className="text-yellow-400 font-black">{selected.points} puntos</span> por <strong className="text-white">{selected.name}</strong>.
                  <br />El administrador aplicará tu beneficio en tu próxima cita.
                </p>
                <p className="text-neutral-500 text-xs">Nuevo saldo: <span className="text-white font-black">{result.newPoints} pts</span></p>
                <button onClick={onClose}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                  Entendido
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-6">
                <div className="text-5xl">😕</div>
                <p className="text-red-400 font-bold">{result.message}</p>
                <button onClick={() => setResult(null)}
                  className="w-full bg-neutral-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                  Volver
                </button>
              </div>
            )
          ) : (
            <>
              <p className="text-neutral-400 text-xs text-center">Selecciona la recompensa que deseas canjear</p>
              <div className="space-y-3">
                {REWARDS.map(r => {
                  const canAfford = points >= r.points;
                  const isSelected = selected?.id === r.id;
                  return (
                    <button key={r.id}
                      onClick={() => canAfford && setSelected(r)}
                      disabled={!canAfford}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-yellow-500 bg-yellow-500/10'
                          : canAfford
                          ? 'border-white/5 bg-neutral-800 hover:border-white/15'
                          : 'border-white/5 bg-neutral-900/40 opacity-40 cursor-not-allowed'
                      }`}>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-black text-sm">{r.name}</p>
                          <p className="text-neutral-500 text-[11px] mt-0.5">{r.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-sm" style={{ color: canAfford ? '#FFD700' : '#666' }}>
                            {r.points.toLocaleString('es-CO')} pts
                          </p>
                          {!canAfford && (
                            <p className="text-[10px] text-neutral-600 mt-0.5">
                              Faltan {(r.points - points).toLocaleString('es-CO')} pts
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selected && (
                <button
                  onClick={handleRedeem}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-neutral-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-lg shadow-yellow-500/20 disabled:opacity-50 mt-2">
                  {loading ? 'Procesando...' : `Canjear ${selected.name} (${selected.points} pts)`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────
function ClientDashboard() {
  const { user, reloadUser, sendVerificationEmail } = useAuth();
  const { bookings, updateBookingStatus, redeemPoints } = useBookings();
  const [editingBooking, setEditingBooking] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);

  // Puntos e historial
  const [pointsHistory, setPointsHistory] = useState([]);

  // Estados para verificación de correo y notificaciones locales
  const [checkingVerif, setCheckingVerif] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [toast, setToast] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') return { visible: true, message: '✓ ¡Pago verificado con éxito! Tu reserva ha sido confirmada.' };
    if (paymentStatus === 'failure') return { visible: true, message: '✕ El pago de la reserva no pudo ser completado.' };
    return { visible: false, message: '' };
  });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  // Cargar historial de transacciones de puntos
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'points_transactions'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
    const unsub = onSnapshot(q, snap => {
      setPointsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  // Manejo del contador de reenvío de correo
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const forbiddenRoles = ['admin', 'barber', 'stylist', 'manicurist'];
  if (!user || forbiddenRoles.includes(user.role)) {
    return null;
  }

  const handleVerifyEmail = async () => {
    setCheckingVerif(true);
    try {
      const refreshedUser = await reloadUser();
      setCheckingVerif(false);
      if (refreshedUser && refreshedUser.emailVerified) {
        showToast('✓ ¡Excelente! Tu correo ha sido verificado con éxito.');
      } else {
        showToast('✕ Tu correo electrónico aún no ha sido verificado.');
      }
    } catch (err) {
      console.error(err);
      showToast('✕ Error al verificar. Intenta de nuevo.');
      setCheckingVerif(false);
    }
  };

  const handleResendVerif = async () => {
    if (resendCooldown > 0) return;
    try {
      const result = await sendVerificationEmail();
      if (result.success) {
        showToast('✓ Enlace de verificación reenviado.');
        setResendCooldown(60);
      } else {
        showToast(`✕ ${result.message || 'Error al enviar.'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('✕ Error al enviar el correo.');
    }
  };

  // Filtrar citas del cliente actual
  const clientBookings = bookings.filter(b => b.clientId === user.uid);
  const activeBookings = clientBookings
    .filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status))
    .sort((a, b) => new Date(`${(a.date || '1970-01-01').replace(/-/g, '/')} ${a.time || '00:00'}`) - new Date(`${(b.date || '1970-01-01').replace(/-/g, '/')} ${b.time || '00:00'}`));

  const pastBookings = clientBookings
    .filter(b => ['completed', 'cancelled'].includes(b.status))
    .sort((a, b) => new Date(`${(b.date || '1970-01-01').replace(/-/g, '/')} ${b.time || '00:00'}`) - new Date(`${(a.date || '1970-01-01').replace(/-/g, '/')} ${a.time || '00:00'}`));

  const handleCancelBooking = async (bookingId) => {
    setCancelling(true);
    try {
      await updateBookingStatus(bookingId, 'cancelled', cancelReason);
    } catch (error) {
      console.error('Error canceling booking:', error);
    } finally {
      setCancelling(false);
      setCancelConfirmId(null);
      setCancelReason('');
    }
  };

  const STATUS_LABELS = {
    pending:     { label: 'Pendiente',  color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    confirmed:   { label: 'Confirmada', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    in_progress: { label: 'En proceso', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    completed:   { label: 'Finalizada', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    cancelled:   { label: 'Cancelada',  color: 'bg-red-500/10 text-red-400 border-red-500/20' }
  };

  const userPoints = user?.points || 0;
  const level = getLevelInfo(userPoints);

  return (
    <div className="p-4 sm:p-8 bg-neutral-950 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">

        {/* Banner de verificación de correo */}
        {user && !user.emailVerified && (
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 text-orange-500 flex-shrink-0">
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-4a2 2 0 011.642 0l8 4A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.25 0l-2.25 1.5" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Verificación de correo requerida</h3>
                <p className="text-neutral-400 text-xs">
                  Hemos enviado un correo a <strong className="text-white">{user.email}</strong>. Por favor, verifícalo para agendar nuevas citas.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={handleVerifyEmail} disabled={checkingVerif}
                className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-95 disabled:opacity-50">
                {checkingVerif ? "Verificando..." : "Ya lo verifiqué"}
              </button>
              <button onClick={handleResendVerif} disabled={resendCooldown > 0}
                className="flex-1 md:flex-none bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-neutral-300 hover:text-white font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50">
                {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : "Reenviar correo"}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900 flex items-center justify-center font-black text-white text-2xl shadow-inner">
              {user?.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-white text-3xl sm:text-4xl font-black">
                  Hola, <span className="text-orange-500">{user.name}</span>
                </h1>
                <button onClick={() => setProfileOpen(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white p-2 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                  title="Editar Perfil">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <p className="text-neutral-500 text-sm mt-1">Gestiona y reprograma tus citas premium en tiempo real.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-neutral-900 border border-white/5 px-6 py-3 rounded-2xl text-center shadow-md">
              <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-black">Total Reservas</p>
              <p className="text-white font-black text-2xl mt-0.5">{clientBookings.length}</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 px-6 py-3 rounded-2xl text-center shadow-md">
              <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-black">Activas</p>
              <p className="text-orange-500 font-black text-2xl mt-0.5">{activeBookings.length}</p>
            </div>
          </div>
        </div>

        {/* ─── TARJETA DE FIDELIDAD + HISTORIAL ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta dorada */}
          <LoyaltyCard user={user} points={userPoints} onRedeem={() => setRedeemOpen(true)} />

          {/* Historial de puntos */}
          <div className="bg-neutral-900 border border-white/5 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-base flex items-center gap-2">
                <span className="text-yellow-400 text-xl">🏆</span>
                Historial de Puntos
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Nivel {level.badge} {level.name}
              </span>
            </div>

            {pointsHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                <span className="text-4xl opacity-30">🎯</span>
                <p className="text-neutral-500 text-sm">Aún no tienes transacciones de puntos.</p>
                <p className="text-neutral-600 text-xs">Completa una cita para empezar a ganar puntos.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {pointsHistory.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/50 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">{tx.type === 'earned' ? '⬆️' : '🎁'}</span>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-bold truncate">{tx.description}</p>
                        <p className="text-neutral-500 text-[10px] mt-0.5">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`font-black text-sm ml-3 flex-shrink-0 ${tx.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'earned' ? '+' : ''}{tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Mini resumen */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              {[
                { label: 'Ganados', val: pointsHistory.filter(t => t.type === 'earned').reduce((s, t) => s + (t.points || 0), 0), color: 'text-green-400' },
                { label: 'Canjeados', val: Math.abs(pointsHistory.filter(t => t.type === 'redeemed').reduce((s, t) => s + (t.points || 0), 0)), color: 'text-red-400' },
                { label: 'Saldo', val: userPoints, color: 'text-yellow-400' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className={`font-black text-sm ${item.color}`}>{item.val.toLocaleString('es-CO')}</p>
                  <p className="text-neutral-600 text-[9px] font-bold uppercase tracking-widest">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── CITAS ACTIVAS ─────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-black text-xl flex items-center gap-2">
              <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
              Próximas Citas
            </h2>
            {activeBookings.length > 0 && (
              <button onClick={() => setIsNewBookingOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer">
                Nueva Cita
              </button>
            )}
          </div>

          {activeBookings.length === 0 ? (
            <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-12 text-center flex flex-col items-center space-y-6">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-md">
                <svg className="w-8 h-8 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-white font-black text-xl">¿Listo para lucir tu mejor versión?</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  No tienes ninguna cita programada. Reserva con tu especialista favorito y acumula puntos con cada servicio.
                </p>
              </div>
              <button onClick={() => setIsNewBookingOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer">
                Agendar Nueva Cita
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeBookings.map(bk => {
                const isMen = bk.category === 'men';
                const statusMeta = STATUS_LABELS[bk.status] || { label: bk.status, color: 'text-white' };
                const earnablePoints = Math.floor((bk.servicePrice || 0) / 1000);

                return (
                  <div key={bk.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-lg hover:border-white/10 transition-all relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${isMen ? 'from-orange-500/5' : 'from-violet-500/5'} blur-2xl rounded-full`} />

                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-black border uppercase tracking-widest ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                          <h3 className="text-white font-black text-xl mt-3">{bk.service}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-black text-xl">{formatCOP(bk.servicePrice)}</p>
                          {earnablePoints > 0 && (
                            <p className="text-yellow-400 text-[10px] font-black mt-0.5">+{earnablePoints} pts al completar</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs bg-neutral-950/40 p-3.5 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Especialista</p>
                          <p className="text-white font-black mt-0.5 truncate">{bk.workerName}</p>
                          <p className="text-neutral-400 text-[10px] capitalize mt-0.5">{bk.workerRole === 'barber' ? 'Barbero' : bk.workerRole === 'stylist' ? 'Estilista' : 'Manicurista'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Sede</p>
                          <p className="text-white font-black mt-0.5 truncate">{bk.branchName || 'Sede Norte'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Fecha y Hora</p>
                          <p className="text-white font-black mt-0.5">{bk.date}</p>
                          <p className="text-neutral-400 font-bold mt-0.5">{bk.time}</p>
                        </div>
                      </div>

                      {bk.notes && (
                        <div className="bg-neutral-950/20 border border-white/5 p-3 rounded-xl">
                          <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Observaciones:</p>
                          <p className="text-neutral-400 text-xs italic mt-0.5">"{bk.notes}"</p>
                        </div>
                      )}

                      {bk.history && bk.history.length > 0 && (
                        <div className="border-t border-white/5 pt-3 mt-3">
                          <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1.5">Historial de reprogramación</p>
                          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                            {bk.history.map((log, idx) => (
                              <p key={idx} className="text-[10px] text-neutral-400 leading-relaxed">
                                <span className="text-neutral-500 font-bold">{new Date(log.updatedAt).toLocaleDateString()}:</span> {log.description}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 border-t border-white/5 pt-4">
                      <button onClick={() => setEditingBooking(bk)}
                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer text-center">
                        Reprogramar
                      </button>
                      <button onClick={() => setCancelConfirmId(bk.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/10 transition-all cursor-pointer">
                        Cancelar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── HISTORIAL DE CITAS ─────────────────────────────────── */}
        <div className="space-y-6">
          <h2 className="text-white font-black text-xl flex items-center gap-2">
            <div className="w-1.5 h-5 bg-neutral-800 rounded-full"></div>
            Historial de Citas
          </h2>

          {pastBookings.length === 0 ? (
            <p className="text-neutral-500 text-sm italic">No tienes citas registradas en tu historial.</p>
          ) : (
            <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-neutral-500 text-[10px] uppercase tracking-widest font-black bg-neutral-950/40">
                      <th className="py-4 px-6">Servicio</th>
                      <th className="py-4 px-6">Especialista</th>
                      <th className="py-4 px-6">Fecha & Hora</th>
                      <th className="py-4 px-6">Precio</th>
                      <th className="py-4 px-6">Puntos</th>
                      <th className="py-4 px-6 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pastBookings.map(bk => {
                      const statusMeta = STATUS_LABELS[bk.status] || { label: bk.status, color: 'text-white' };
                      const pts = Math.floor((bk.servicePrice || 0) / 1000);
                      return (
                        <tr key={bk.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6 font-black text-white">{bk.service}</td>
                          <td className="py-4 px-6 text-neutral-300">
                            <span className="font-bold">{bk.workerName}</span>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest block font-bold capitalize mt-0.5">
                              {bk.workerRole === 'barber' ? 'Barbero' : bk.workerRole === 'stylist' ? 'Estilista' : 'Manicurista'} {bk.branchName && `· ${bk.branchName}`}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-neutral-400">
                            <p className="font-bold">{bk.date}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{bk.time}</p>
                          </td>
                          <td className="py-4 px-6 text-white font-black">{formatCOP(bk.servicePrice)}</td>
                          <td className="py-4 px-6">
                            {bk.status === 'completed' && pts > 0 ? (
                              <span className="text-yellow-400 font-black text-sm">+{pts} pts</span>
                            ) : (
                              <span className="text-neutral-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black border uppercase tracking-widest ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                            {bk.cancelReason && (
                              <p className="text-red-400 text-[10px] font-medium mt-2 max-w-[150px] ml-auto truncate" title={bk.cancelReason}>
                                Motivo: {bk.cancelReason}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ─── MODALES ──────────────────────────────────────────────── */}
      <BookingModal isOpen={!!editingBooking} onClose={() => setEditingBooking(null)} editBooking={editingBooking} />
      <BookingModal isOpen={isNewBookingOpen} onClose={() => setIsNewBookingOpen(false)} />

      {redeemOpen && (
        <RedeemModal
          points={userPoints}
          user={user}
          onClose={() => setRedeemOpen(false)}
          redeemPoints={redeemPoints}
        />
      )}

      {cancelConfirmId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setCancelConfirmId(null)} />
          <div className="relative bg-neutral-900 border border-white/10 p-6 sm:p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-white text-xl font-black">¿Cancelar Reserva?</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Esta acción no se puede deshacer. Se liberará tu horario y se notificará automáticamente al especialista.
              </p>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-neutral-500 text-[10px] font-black uppercase tracking-widest block">Motivo (Opcional)</label>
              <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="Ej. Problema de salud..."
                className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl p-3 text-white text-sm focus:border-red-500/50 outline-none transition-all placeholder:text-neutral-600" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCancelConfirmId(null); setCancelReason(''); }}
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer">
                Volver
              </button>
              <button onClick={() => handleCancelBooking(cancelConfirmId)} disabled={cancelling}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50">
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm">
          {toast.message}
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;
