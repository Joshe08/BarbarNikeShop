import { useState, useMemo } from 'react';
import { useBookings } from '../context/BookingContext';
import { useApp } from '../context/AppContext';
import { formatCOP } from '../utils/format';

export default function CommissionsModule() {
  const { bookings } = useBookings();
  const { workers, updateWorker } = useApp();
  const [editingWorker, setEditingWorker] = useState(null);
  const [newPercentage, setNewPercentage] = useState('');
  const [savingPct, setSavingPct] = useState(false);
  const [error, setError] = useState('');

  const completedBookings = useMemo(() =>
    bookings.filter(b => b.status === 'completed'),
    [bookings]
  );

  // Calcular comisiones por trabajador
  const commissions = useMemo(() => {
    return workers.map(worker => {
      const workerBookings = completedBookings.filter(b => b.workerId === worker.id);
      const totalGenerated = workerBookings.reduce((s, b) => s + (b.servicePrice || 0), 0);
      const pct = worker.percentage || 50;
      const commission = (totalGenerated * pct) / 100;
      return {
        ...worker,
        appointmentsCount: workerBookings.length,
        totalGenerated,
        percentage: pct,
        commission,
        bookings: workerBookings,
      };
    }).sort((a, b) => b.commission - a.commission);
  }, [workers, completedBookings]);

  const totalCommissions = commissions.reduce((s, w) => s + w.commission, 0);
  const totalGenerated = commissions.reduce((s, w) => s + w.totalGenerated, 0);

  const roleLabel = { barber: 'Barbero' };
  const roleColor = {
    barber: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  const openEdit = (worker) => {
    setEditingWorker(worker);
    setNewPercentage(String(worker.percentage));
    setError('');
  };

  const savePercentage = async () => {
    setError('');
    if (!editingWorker) return;
    const pct = Number(newPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError('El porcentaje debe ser un número válido entre 0 y 100.');
      return;
    }
    setSavingPct(true);
    try {
      await updateWorker(editingWorker.id, { percentage: pct });
    } catch (err) {
      console.error(err);
      setError('Error guardando la comisión.');
    } finally {
      setSavingPct(false);
      if (!error) setEditingWorker(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-black text-2xl">Comisiones</h2>
          <p className="text-neutral-500 text-sm mt-1">Gestión de comisiones por barbero en Barber Kalvin</p>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Ingresos totales</p>
          <p className="text-red-600 font-black text-2xl mt-1">{formatCOP(totalGenerated)}</p>
          <p className="text-neutral-600 text-xs mt-0.5">Citas completadas totales</p>
        </div>
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Total comisiones</p>
          <p className="text-red-400 font-black text-2xl mt-1">{formatCOP(totalCommissions)}</p>
          <p className="text-neutral-600 text-xs mt-0.5">A pagar a los trabajadores</p>
        </div>
        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Ganancia del negocio</p>
          <p className="text-green-400 font-black text-2xl mt-1">{formatCOP(totalGenerated - totalCommissions)}</p>
          <p className="text-neutral-600 text-xs mt-0.5">Después de comisiones</p>
        </div>
      </div>

      {/* Tabla de trabajadores */}
      <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6">
        <h3 className="text-white font-black text-sm uppercase tracking-widest mb-5">Detalle por trabajador</h3>
        {commissions.length === 0 ? (
          <div className="text-center py-10 text-neutral-600 text-sm">No hay trabajadores registrados</div>
        ) : (
          <div className="space-y-3">
            {commissions.map(worker => (
              <div
                key={worker.id}
                className="bg-neutral-800/40 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={worker.image}
                      alt={worker.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{worker.name}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${roleColor[worker.role] || 'text-neutral-400 bg-neutral-700 border-white/10'}`}>
                        {roleLabel[worker.role] || worker.role}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3 flex-shrink-0 text-center">
                    <div>
                      <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Citas</p>
                      <p className="text-blue-400 font-black text-lg">{worker.appointmentsCount}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Generado</p>
                      <p className="text-red-600 font-black text-sm">{formatCOP(worker.totalGenerated)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">%</p>
                      <p className="text-white font-black text-lg">{worker.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Comisión</p>
                      <p className="text-green-400 font-black text-sm">{formatCOP(worker.commission)}</p>
                    </div>
                  </div>

                  {/* Barra de progreso y editar % */}
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="flex-1">
                      <div className="w-full bg-neutral-700 rounded-full h-1.5">
                        <div
                          className="bg-red-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${worker.percentage}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(worker)}
                      className="text-neutral-500 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                      title="Editar comisión"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Detalle de citas si hay */}
                {worker.appointmentsCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {worker.bookings.slice(0, 4).map(b => (
                      <div key={b.id} className="bg-neutral-900/60 rounded-xl p-2 text-xs">
                        <p className="text-neutral-400 truncate">{b.service}</p>
                        <p className="text-red-500 font-bold">{formatCOP(b.servicePrice || 0)}</p>
                        <p className="text-neutral-600">{b.date}</p>
                      </div>
                    ))}
                    {worker.appointmentsCount > 4 && (
                      <div className="bg-neutral-900/60 rounded-xl p-2 text-xs flex items-center justify-center text-neutral-500">
                        +{worker.appointmentsCount - 4} más
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal editar porcentaje */}
      {editingWorker && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setEditingWorker(null)} />
          <div className="relative bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-black text-lg">Editar comisión</h3>
              <button onClick={() => setEditingWorker(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img src={editingWorker.image} alt={editingWorker.name} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
              <div>
                <p className="text-white font-bold">{editingWorker.name}</p>
                <p className="text-neutral-500 text-xs capitalize">{roleLabel[editingWorker.role] || editingWorker.role}</p>
              </div>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold text-center animate-fade-in">
                {error}
              </div>
            )}
            <div>
              <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">
                Porcentaje de comisión (0-100%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPercentage}
                  onChange={e => setNewPercentage(e.target.value)}
                  className="w-full bg-neutral-800 border border-white/5 rounded-xl p-3 pr-10 text-white outline-none focus:border-red-600 transition-all text-lg font-black"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-black">%</span>
              </div>
            <p className="text-neutral-600 text-xs mt-2">
              Con {newPercentage || 0}%, la comisión actual sería{' '}
              <span className="text-red-500 font-bold">
                {formatCOP(((editingWorker?.totalGenerated || 0) * (Number(newPercentage) || 0)) / 100)}
              </span>
            </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingWorker(null)}
                className="flex-1 bg-neutral-800 text-neutral-300 py-3 rounded-2xl font-black text-sm cursor-pointer hover:bg-neutral-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={savePercentage}
                disabled={savingPct}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-black text-sm cursor-pointer hover:bg-red-700 transition-all disabled:opacity-40"
              >
                {savingPct ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
