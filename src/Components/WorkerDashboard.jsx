import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useApp } from '../context/AppContext';
import { formatCOP } from '../utils/format';
import ProfileModal from './ProfileModal';

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
  confirmed:   { label: 'Confirmada', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     dot: 'bg-blue-400' },
  in_progress: { label: 'En proceso', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  completed:   { label: 'Finalizada', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   dot: 'bg-green-400' },
  cancelled:   { label: 'Cancelada',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       dot: 'bg-red-400' },
};

const ROLE_CONFIG = {
  barber:     { label: 'Barbero',     accent: 'orange', gradient: 'from-orange-600 to-amber-500' },
  stylist:    { label: 'Estilista',   accent: 'purple', gradient: 'from-purple-600 to-violet-500' },
  manicurist: { label: 'Manicurista', accent: 'pink',   gradient: 'from-pink-600 to-rose-500' },
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function StatCard({ label, value, colorClass = 'text-white', accentColor = '' }) {
  return (
    <div className={`bg-neutral-800/60 backdrop-blur-sm border rounded-2xl px-4 py-3 text-center transition-all ${accentColor ? 'border-white/8 hover:border-' + accentColor + '-500/30' : 'border-white/8'}`}>
      <p className={`font-black text-xl ${colorClass}`}>{value}</p>
      <p className="text-neutral-500 text-[9px] uppercase tracking-widest font-bold mt-0.5">{label}</p>
    </div>
  );
}

function CancelModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in p-6 sm:p-8 space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-white text-xl font-black">¿Cancelar Cita?</h3>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Por favor, escribe el motivo de la cancelación. Esta acción liberará el horario de la agenda.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-neutral-500 text-[10px] font-black uppercase tracking-widest block font-bold">Motivo (Opcional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej. Cambio de planes, enfermedad..."
            className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3 text-white text-sm focus:border-red-500/50 outline-none transition-all placeholder:text-neutral-600 font-medium"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer font-bold">
            Volver
          </button>
          <button 
            onClick={() => onConfirm(reason)} 
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all cursor-pointer font-bold"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- FUNCIONES AUXILIARES RECORDATORIO WHATSAPP ---
const cleanPhone = (phoneStr) => {
  if (!phoneStr) return '';
  let cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '57' + cleaned;
  }
  return cleaned;
};

const getReminderLink = (bk, clientPhoneStr) => {
  const formattedPhone = cleanPhone(clientPhoneStr);
  if (!formattedPhone) return null;
  const msg = `Hola *${bk.clientName}*, te recordamos tu cita de hoy *${bk.date}* a las *${bk.time}* para el servicio de *${bk.service}* con *${bk.workerName}* en *BarberNike (${bk.branchName || 'Sede Norte'})*. ¡Te esperamos!`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
};


function WorkerDashboard() {
  const { user } = useAuth();
  const { bookings, updateBookingStatus, loadingBookings } = useBookings();
  const { users } = useApp();
  const [view, setView] = useState(() => localStorage.getItem('worker_dashboard_view') || 'today');

  useEffect(() => {
    localStorage.setItem('worker_dashboard_view', view);
  }, [view]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(null); // { bookingId, nextStatus }

  // Lookup client's latest profile picture
  const getClientImage = (clientId, fallbackImage) => {
    const foundUser = users.find(u => u.uid === clientId || u.id === clientId);
    return foundUser?.image || fallbackImage || '';
  };

  const todayStr = getTodayStr();
  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.barber;

  const myBookings = useMemo(() =>
    bookings.filter(b => b.workerId === user?.uid || b.workerName === user?.name),
    [bookings, user]
  );

  const filteredBookings = useMemo(() => {
    return myBookings.filter(b => {
      if (view === 'today')    return b.date === todayStr;
      if (view === 'upcoming') return b.date >= todayStr && b.status !== 'cancelled' && b.status !== 'completed';
      if (view === 'history')  return b.status === 'completed' || b.status === 'cancelled';
      return true;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));
  }, [myBookings, view, todayStr]);

  const stats = useMemo(() => ({
    today:     myBookings.filter(b => b.date === todayStr).length,
    upcoming:  myBookings.filter(b => b.date > todayStr && !['cancelled','completed'].includes(b.status)).length,
    completed: myBookings.filter(b => b.status === 'completed').length,
    pending:   myBookings.filter(b => b.status === 'pending').length,
    revenue:   myBookings.filter(b => b.status === 'completed').reduce((s,b) => s+(b.servicePrice||0), 0),
  }), [myBookings, todayStr]);

  const nextBooking = useMemo(() =>
    myBookings
      .filter(b => (b.date > todayStr || (b.date === todayStr)) && !['cancelled','completed'].includes(b.status))
      .sort((a,b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''))[0],
    [myBookings, todayStr]
  );

  const workerRoles = ['barber', 'stylist', 'manicurist'];
  if (!user || !workerRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2rem] text-center max-w-sm">
          <p className="text-red-400 font-bold">Acceso Denegado</p>
          <p className="text-neutral-400 text-xs mt-2">No tienes los permisos requeridos para ver esta página.</p>
        </div>
      </div>
    );
  }

  const handleStatus = async (bookingId, newStatus, e) => {
    e.stopPropagation();

    if (newStatus === 'noshow') {
      setUpdatingId(bookingId);
      await updateBookingStatus(bookingId, 'cancelled', 'Inasistencia del cliente');
      setUpdatingId(null);
      setExpandedId(null);
    } else if (newStatus === 'cancelled') {
      setCancelDialog({ bookingId, nextStatus: newStatus });
    } else {
      setUpdatingId(bookingId);
      await updateBookingStatus(bookingId, newStatus);
      setUpdatingId(null);
      setExpandedId(null);
    }
  };

  const VIEWS = [
    { key: 'today',    label: 'Hoy',      count: stats.today },
    { key: 'upcoming', label: 'Próximas', count: stats.upcoming },
    { key: 'all',      label: 'Todas',    count: myBookings.length },
    { key: 'history',  label: 'Historial',count: stats.completed },
  ];

  if (loadingBookings) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className={`absolute inset-0 rounded-full border-4 border-t-${roleConfig.accent}-500 animate-spin`} />
          </div>
          <p className="text-neutral-500 text-sm font-bold">Cargando tu agenda...</p>
        </div>
      </div>
    );
  }

  const accentMap = { barber: 'orange', stylist: 'purple', manicurist: 'pink' };
  const accent = accentMap[user?.role] || 'orange';
  const accentColorMap = {
    orange: { border: 'border-orange-500/30', dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', glow: 'from-orange-500/8' },
    purple: { border: 'border-purple-500/30', dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', glow: 'from-purple-500/8' },
    pink:   { border: 'border-pink-500/30',   dot: 'bg-pink-500',   badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',     glow: 'from-pink-500/8' },
  };
  const ac = accentColorMap[accent];

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header elegante oscuro */}
      <div className="bg-neutral-950 border-b border-white/5 relative overflow-hidden">
        {/* Glow ambiental muy sutil */}
        <div className={`absolute top-0 left-0 w-96 h-full bg-gradient-to-r ${ac.glow} to-transparent blur-3xl pointer-events-none opacity-60`} />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Perfil */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 ${ac.border} bg-neutral-800 flex items-center justify-center font-black text-white text-2xl shadow-xl`}>
                  {user?.image
                    ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    : user?.name?.charAt(0)?.toUpperCase()
                  }
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-neutral-950 shadow" />
              </div>
              <div>
                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${ac.badge} mb-1`}>
                  {roleConfig.label}
                </span>
                <h1 className="text-white text-2xl font-black tracking-tight leading-tight">{user?.name || 'Trabajador'}</h1>
                <p className="text-neutral-500 text-xs mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProfileOpen(true)}
                className="bg-neutral-800 hover:bg-neutral-700 border border-white/8 hover:border-white/15 text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar perfil
              </button>
            </div>
          </div>

          {/* Stats rapidas - 2x2 en movil, 4 columnas en desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6">
            <StatCard label="Hoy" value={stats.today} colorClass="text-white" />
            <StatCard label="Proximas" value={stats.upcoming} colorClass="text-white" />
            <StatCard label="Finalizadas" value={stats.completed} colorClass="text-green-400" />
            <StatCard label="Ingresos" value={formatCOP(stats.revenue)} colorClass="text-orange-400" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* Próxima cita destacada */}
        {nextBooking && (
          <div className="bg-neutral-900 border border-white/8 rounded-3xl p-5 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r ${roleConfig.gradient} opacity-5`} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Próxima cita</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden border-2 border-white/8 shadow-md">
                    {getClientImage(nextBooking.clientId, nextBooking.clientImage) ? (
                      <img src={getClientImage(nextBooking.clientId, nextBooking.clientImage)} alt={nextBooking.clientName} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${roleConfig.gradient} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                        {nextBooking.clientName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg">{nextBooking.clientName}</p>
                    <p className="text-neutral-400 text-sm">{nextBooking.service} · {nextBooking.serviceDuration} min</p>
                    {nextBooking.clientPhone && (
                      <a
                        href={`https://wa.me/${nextBooking.clientPhone}`}
                        target="_blank" rel="noreferrer"
                        className="text-green-400 text-xs font-bold hover:text-green-300 transition-colors flex items-center gap-1 mt-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        {nextBooking.clientPhone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-4xl tabular-nums tracking-tight">{nextBooking.time}</p>
                  <p className="text-neutral-500 text-sm">{nextBooking.date}</p>
                  <p className="text-orange-400 font-bold text-sm mt-1">{formatCOP(nextBooking.servicePrice)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros de vista */}
        <div className="flex gap-1 bg-neutral-900 border border-white/5 p-1.5 rounded-2xl max-w-full overflow-x-auto scrollbar-hide select-none">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                view === v.key
                  ? `bg-gradient-to-r ${roleConfig.gradient} text-white shadow-lg`
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              {v.label}
              {v.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  view === v.key ? 'bg-white/20 text-white' : 'bg-white/5 text-neutral-400'
                }`}>
                  {v.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista de citas */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-16 text-center">
              <p className="text-white font-bold text-lg">Sin citas en esta vista</p>
              <p className="text-neutral-600 text-sm mt-1">Cambia el filtro para ver otras citas</p>
            </div>
          ) : (
            filteredBookings.map(bk => {
              const st = STATUS_CONFIG[bk.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedId === bk.id;
              const isUpdating = updatingId === bk.id;

              return (
                <div
                  key={bk.id}
                  className={`bg-neutral-900 border rounded-3xl transition-all duration-200 cursor-pointer overflow-hidden ${
                    isExpanded ? 'border-white/15' : 'border-white/5 hover:border-white/10'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : bk.id)}
                >
                  {/* Fila principal */}
                  <div className="p-5 flex items-center gap-4">
                    {/* Avatar cliente - con foto si existe */}
                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 overflow-hidden border-2 ${isExpanded ? 'border-white/20' : 'border-white/8'} shadow-md`}>
                      {getClientImage(bk.clientId, bk.clientImage) ? (
                        <img src={getClientImage(bk.clientId, bk.clientImage)} alt={bk.clientName} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${roleConfig.gradient} flex items-center justify-center text-white font-black text-lg`}>
                          {bk.clientName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-black">{bk.clientName}</p>
                        <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${st.bg} ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-neutral-400 text-sm truncate">{bk.service}</p>
                      <p className="text-neutral-600 text-xs mt-0.5">Fecha: {bk.date} · Hora: {bk.time} · {bk.serviceDuration} min {bk.branchName && `· Sede: ${bk.branchName}`}</p>
                    </div>

                    {/* Precio + flecha */}
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <div>
                        <p className="text-white font-black">{formatCOP(bk.servicePrice)}</p>
                        <p className="text-neutral-600 text-xs">servicio</p>
                      </div>
                      <svg
                        className={`h-4 w-4 text-neutral-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-5 space-y-4 bg-neutral-950/40">
                      {/* Nota del cliente */}
                      {bk.notes && (
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4">
                          <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-1.5">Nota del cliente</p>
                          <p className="text-neutral-300 text-sm italic">"{bk.notes}"</p>
                        </div>
                      )}

                      {/* Motivo de cancelación */}
                      {bk.cancelReason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                          <p className="text-red-400 text-[9px] font-black uppercase tracking-widest mb-1.5">Motivo de cancelación</p>
                          <p className="text-red-300 text-sm italic">"{bk.cancelReason}"</p>
                        </div>
                      )}

                      {/* WhatsApp */}
                      {(bk.clientPhone || users.find(u => u.uid === bk.clientId)?.phone) && (() => {
                        const clientPhone = bk.clientPhone || users.find(u => u.uid === bk.clientId)?.phone || '';
                        const reminderLink = getReminderLink(bk, clientPhone);
                        return (
                          <div className="flex flex-col sm:flex-row gap-3" onClick={e => e.stopPropagation()}>
                            <a
                              href={`https://wa.me/${cleanPhone(clientPhone)}`}
                              target="_blank" rel="noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-white/5 text-neutral-300 py-3 rounded-2xl text-sm font-bold transition-all"
                            >
                              <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                              Chat Libre
                            </a>
                            {['pending', 'confirmed', 'in_progress'].includes(bk.status) && reminderLink && (
                              <a
                                href={reminderLink}
                                target="_blank" rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 py-3 rounded-2xl text-sm font-bold transition-all"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Recordatorio
                              </a>
                            )}
                          </div>
                        );
                      })()}

                      {/* Cambiar estado */}
                      {!['completed', 'cancelled'].includes(bk.status) && (
                        <div>
                          <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-2">Actualizar estado</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { s: 'confirmed',   label: 'Confirmar',   cls: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500' },
                              { s: 'in_progress', label: 'Iniciar',     cls: 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500' },
                              { s: 'completed',   label: 'Finalizar',   cls: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-500' },
                              { s: 'cancelled',   label: 'Cancelar',    cls: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500' },
                              { s: 'noshow',      label: 'No Asistió',  cls: 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white' },
                            ].filter(({ s }) => s !== bk.status && (s === 'noshow' ? bk.status !== 'cancelled' : true)).map(({ s, label, cls }) => (
                              <button
                                key={s}
                                onClick={e => handleStatus(bk.id, s, e)}
                                disabled={isUpdating}
                                className={`py-2.5 rounded-2xl text-xs font-black border uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${cls}`}
                              >
                                {isUpdating ? '...' : label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {cancelDialog && (
        <CancelModal
          onConfirm={async (reason) => {
            const bookingId = cancelDialog.bookingId;
            const targetStatus = cancelDialog.nextStatus;
            setCancelDialog(null);
            setUpdatingId(bookingId);
            await updateBookingStatus(bookingId, targetStatus, reason || 'Cancelado por el especialista');
            setUpdatingId(null);
            setExpandedId(null);
          }}
          onCancel={() => setCancelDialog(null)}
        />
      )}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default WorkerDashboard;
