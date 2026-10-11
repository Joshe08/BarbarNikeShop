import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ClosuresModule({ setConfirmDialog }) {
  const { operationalStatus, updateOperationalStatus } = useApp();

  const [isOpen, setIsOpen] = useState(operationalStatus?.isOpen ?? true);
  const [reason, setReason] = useState(operationalStatus?.reason || '');
  const [reopenDate, setReopenDate] = useState(operationalStatus?.reopenDate || '');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleStatusUpdate = async (newIsOpen) => {
    if (!newIsOpen && !reason.trim()) {
      showToast('⚠️ Por favor indica el motivo del cierre temporal.');
      return;
    }

    setSubmitting(true);
    try {
      await updateOperationalStatus({
        isOpen: newIsOpen,
        reason: newIsOpen ? '' : reason.trim(),
        reopenDate: newIsOpen ? null : (reopenDate || null),
      });

      setIsOpen(newIsOpen);
      if (newIsOpen) {
        setReason('');
        setReopenDate('');
        showToast('✓ La barbería ha sido reabierta. El sistema ya acepta reservas.');
      } else {
        showToast('✓ Cierre temporal activado. Las nuevas reservas han sido bloqueadas.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error al actualizar el estado operativo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = () => {
    if (operationalStatus?.isOpen) {
      // Intenta cerrar -> pide confirmación
      setConfirmDialog({
        title: '¿Cerrar Barbería Temporalmente?',
        message: 'Esta acción suspenderá inmediatamente la recepción de nuevas citas públicas hasta que se reabra.',
        onConfirm: async () => {
          setConfirmDialog(null);
          await handleStatusUpdate(false);
        }
      });
    } else {
      // Reabrir
      setConfirmDialog({
        title: '¿Reabrir Barbería?',
        message: 'La barbería volverá a estar disponible para recibir reservas de clientes de inmediato.',
        onConfirm: async () => {
          setConfirmDialog(null);
          await handleStatusUpdate(true);
        }
      });
    }
  };

  const isCurrentlyOpen = operationalStatus?.isOpen ?? true;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[999] bg-neutral-900 border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Banner de Estado Actual */}
      <div className={`p-6 sm:p-8 rounded-[2.5rem] border transition-all ${
        isCurrentlyOpen 
          ? 'bg-green-500/10 border-green-500/20 text-white' 
          : 'bg-red-500/10 border-red-500/20 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg ${
              isCurrentlyOpen 
                ? 'bg-green-500 text-white shadow-green-500/30' 
                : 'bg-red-600 text-white shadow-red-600/30'
            }`}>
              {isCurrentlyOpen ? '✓' : '✕'}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full border ${
                isCurrentlyOpen 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {isCurrentlyOpen ? 'Operación Normal' : 'Cierre Temporal Activo'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                {isCurrentlyOpen ? 'Barber Kalvin está ABIERTA' : 'Barber Kalvin está CERRADA temporalmente'}
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm mt-1">
                {isCurrentlyOpen 
                  ? 'Los clientes pueden agendar citas normalmente según la disponibilidad de los barberos.' 
                  : `Cierre por: ${operationalStatus?.reason || 'Mantenimiento o fuerza mayor'}.`}
              </p>
              {operationalStatus?.reopenDate && !isCurrentlyOpen && (
                <p className="text-red-400 text-xs font-bold mt-1">
                  📅 Reapertura estimada: {operationalStatus.reopenDate}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={submitting}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95 ${
              isCurrentlyOpen
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
            }`}
          >
            {isCurrentlyOpen ? 'Pausar Operación / Cerrar' : 'Reabrir Barbería Ahora'}
          </button>
        </div>
      </div>

      {/* Formulario de Ajuste de Cierre */}
      <div className="bg-neutral-900/60 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-white font-black text-lg tracking-tight">Configurar Parámetros del Cierre</h3>
          <p className="text-neutral-500 text-xs mt-1">
            Indica el motivo y la fecha estimada de reapertura. Esta información se informará a los clientes en caso de intentar reservar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">
              Motivo del Cierre *
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej. Mantenimiento de instalaciones, fuerza mayor, festivo especial..."
              className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-4 text-white text-sm focus:border-red-600 outline-none transition-all placeholder:text-neutral-600 font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">
              Fecha y Hora Estimada de Reapertura (Opcional)
            </label>
            <input
              type="text"
              value={reopenDate}
              onChange={e => setReopenDate(e.target.value)}
              placeholder="Ej. Lunes 15 a las 9:30 AM"
              className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-4 text-white text-sm focus:border-red-600 outline-none transition-all placeholder:text-neutral-600 font-medium"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleStatusUpdate(false)}
            disabled={submitting || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all cursor-pointer"
          >
            {submitting ? 'Guardando...' : 'Aplicar Motivo de Cierre'}
          </button>
        </div>
      </div>

      {/* Historial de Cambios Operativos */}
      {operationalStatus?.history && operationalStatus.history.length > 0 && (
        <div className="bg-neutral-900/40 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 space-y-4">
          <h3 className="text-white font-black text-sm uppercase tracking-wider">Historial Reciente de Operación</h3>
          <div className="space-y-3">
            {operationalStatus.history.slice().reverse().map((entry, idx) => (
              <div key={idx} className="bg-neutral-950/40 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${entry.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <span className="text-white font-bold">{entry.isOpen ? 'Reapertura' : 'Cierre Temporal'}</span>
                    {entry.reason && <span className="text-neutral-400 ml-2">— {entry.reason}</span>}
                    {entry.reopenDate && <span className="text-red-400 ml-2">(Reapertura: {entry.reopenDate})</span>}
                  </div>
                </div>
                <div className="text-neutral-500 text-[11px]">
                  <span>{new Date(entry.changedAt).toLocaleString()}</span>
                  <span className="ml-2 text-neutral-400">por {entry.changedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
