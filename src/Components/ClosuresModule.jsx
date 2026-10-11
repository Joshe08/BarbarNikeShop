import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useBookings } from '../context/BookingContext';

export default function ClosuresModule({ setConfirmDialog }) {
  const { branches, closures, addClosure, deleteClosure } = useApp();
  const { bookings, updateBookingStatus } = useBookings();

  // Form states
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [autoCancel, setAutoCancel] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }, []);

  // Filter active, affected bookings for the selected branch & date
  const affectedBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter(b => 
      ['pending', 'confirmed', 'in_progress'].includes(b.status) &&
      b.date === selectedDate &&
      (selectedBranchId === 'all' || b.branchId === selectedBranchId)
    );
  }, [bookings, selectedBranchId, selectedDate]);

  const handleAddClosure = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      showToast('⚠️ Por favor selecciona una fecha para el cierre.');
      return;
    }
    if (!reason.trim()) {
      showToast('⚠️ Por favor ingresa el motivo del cierre.');
      return;
    }

    // Check if there is already a closure for this branch & date
    const alreadyClosed = closures.some(c => 
      c.date === selectedDate && 
      (c.branchId === 'all' || selectedBranchId === 'all' || c.branchId === selectedBranchId)
    );
    if (alreadyClosed) {
      showToast('⚠️ Ya existe un cierre programado para esa sede y fecha.');
      return;
    }

    setSubmitting(true);
    try {
      const branchName = selectedBranchId === 'all' 
        ? 'Todas las sedes' 
        : (branches.find(b => b.id === selectedBranchId)?.name || 'Sede');

      // 1. Add closure doc in Firestore
      await addClosure({
        branchId: selectedBranchId,
        branchName,
        date: selectedDate,
        reason: reason.trim(),
      });

      // 2. Auto-cancel affected bookings if option checked
      if (autoCancel && affectedBookings.length > 0) {
        const cancelReason = `Cierre de sede (${reason.trim()})`;
        await Promise.all(
          affectedBookings.map(b => 
            updateBookingStatus(b.id, 'cancelled', cancelReason)
          )
        );
      }

      showToast('✓ Cierre de sede programado con éxito.');
      // Reset form
      setSelectedDate('');
      setReason('');
      setAutoCancel(true);
    } catch (err) {
      console.error(err);
      showToast('❌ Error al guardar el cierre. Revisa tu conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClosure = (id) => {
    setConfirmDialog({
      title: '¿Reabrir Sede?',
      message: '¿Seguro que deseas eliminar este cierre y volver a abrir la sede en esta fecha?',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteClosure(id);
          showToast('✓ Cierre eliminado. La sede ya se encuentra abierta nuevamente.');
        } catch (err) {
          console.error(err);
          showToast('❌ Error al eliminar el cierre.');
        }
      }
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 5000);
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[999] bg-neutral-900 border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form panel */}
        <div className="lg:col-span-1 bg-neutral-900/60 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-wider">Cerrar Sede</h3>
            <p className="text-neutral-500 text-xs mt-1">Programa cierres temporales de sedes por mantenimiento, feriados o imprevistos.</p>
          </div>

          <form onSubmit={handleAddClosure} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Sede a cerrar</label>
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-white outline-none focus:border-red-600 text-sm transition-all"
              >
                <option value="all">Todas las Sedes (Cierre General)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Fecha de Cierre</label>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                required
                className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-white outline-none focus:border-red-600 text-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Motivo / Explicación</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej: Mantenimiento de instalaciones, Feriado nacional, Falta de fluido eléctrico..."
                required
                rows={3}
                className="w-full bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-white outline-none focus:border-red-600 text-sm transition-all resize-none"
              />
            </div>

            {/* Affected bookings alert */}
            {selectedDate && (
              <div className="pt-2">
                {affectedBookings.length > 0 ? (
                  <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-2">
                      <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-red-500 text-xs font-bold">⚠️ Se detectaron {affectedBookings.length} citas agendadas</p>
                        <p className="text-neutral-500 text-[10px] mt-0.5">Existen citas activas programadas en este día y sede.</p>
                      </div>
                    </div>

                    {/* Checkbox action */}
                    <label className="flex items-center gap-2 cursor-pointer bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-all select-none">
                      <input
                        type="checkbox"
                        checked={autoCancel}
                        onChange={e => setAutoCancel(e.target.checked)}
                        className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-neutral-800 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        Auto-cancelar y notificar clientes
                      </span>
                    </label>

                    {/* Preview list */}
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                      {affectedBookings.map(b => (
                        <div key={b.id} className="bg-neutral-950/40 p-2 rounded-lg text-[10px] flex justify-between items-center text-neutral-400">
                          <div>
                            <span className="text-white font-bold block">{b.clientName}</span>
                            <span>{b.service} ({b.workerName})</span>
                          </div>
                          <span className="text-red-600 font-bold font-mono">{b.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3.5 flex gap-2">
                    <svg className="h-4 w-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-400 text-xs font-semibold">Sin citas afectadas para esta fecha.</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Programar Cierre'
              )}
            </button>

          </form>
        </div>

        {/* Closures list panel */}
        <div className="lg:col-span-2 bg-neutral-900/60 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 space-y-6 flex flex-col">
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-wider">Cierres Programados</h3>
            <p className="text-neutral-500 text-xs mt-1">Lista de cierres vigentes o programados para el futuro. Al eliminarlos, la sede vuelve a estar disponible para agendar.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1">
            {closures.length === 0 ? (
              <div className="bg-neutral-800/30 border border-white/5 rounded-3xl p-16 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white font-bold text-base">No hay cierres programados</p>
                <p className="text-neutral-600 text-xs mt-1">Todas las sedes están operando con normalidad.</p>
              </div>
            ) : (
              [...closures]
                .sort((a,b) => (a.date || '').localeCompare(b.date || ''))
                .map(c => {
                  const isExpired = c.date < todayStr;
                  return (
                    <div
                      key={c.id}
                      className={`p-5 rounded-2xl border transition-all flex justify-between items-center gap-4 ${
                        isExpired 
                          ? 'bg-neutral-900/20 border-white/5 opacity-50' 
                          : 'bg-neutral-850 border-white/10 hover:border-red-600/30 shadow-lg shadow-black/20'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-red-600/10 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-red-600/20">
                            {c.branchName || 'Sede'}
                          </span>
                          {isExpired && (
                            <span className="bg-neutral-800 text-neutral-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              Pasado
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-black text-sm">{c.date}</p>
                          <p className="text-neutral-400 text-xs mt-1 italic font-medium leading-relaxed">
                            Motivo: "{c.reason}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteClosure(c.id)}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-3 rounded-2xl border border-red-500/25 transition-all cursor-pointer"
                        title="Eliminar cierre (reabrir sede)"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
