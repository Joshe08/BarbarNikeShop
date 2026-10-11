import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCOP } from '../utils/format';

const DAYS_OF_WEEK = [
  { key: 1, label: 'Lunes' },
  { key: 2, label: 'Martes' },
  { key: 3, label: 'Miércoles' },
  { key: 4, label: 'Jueves' },
  { key: 5, label: 'Viernes' },
  { key: 6, label: 'Sábado' },
  { key: 0, label: 'Domingo' },
];

export default function PromotionsModule({ setConfirmDialog }) {
  const { promotions, addPromotion, updatePromotion, deletePromotion, menServices = [] } = useApp();

  const [editingPromo, setEditingPromo] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCreateNew = () => {
    setEditingPromo({
      name: '',
      description: '',
      discountType: 'percentage', // 'percentage' | 'fixed'
      discountValue: 20,
      daysOfWeek: [1, 2, 3], // Lun, Mar, Mie por defecto
      serviceIds: [], // vacío = todos los servicios
      startDate: '',
      endDate: '',
      active: true
    });
  };

  const handleToggleDay = (dayKey) => {
    setEditingPromo(prev => {
      const current = prev.daysOfWeek || [];
      const updated = current.includes(dayKey)
        ? current.filter(d => d !== dayKey)
        : [...current, dayKey];
      return { ...prev, daysOfWeek: updated };
    });
  };

  const handleToggleService = (serviceId) => {
    setEditingPromo(prev => {
      const current = prev.serviceIds || [];
      const updated = current.includes(serviceId)
        ? current.filter(id => id !== serviceId)
        : [...current, serviceId];
      return { ...prev, serviceIds: updated };
    });
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!editingPromo.name.trim()) {
      showToast('⚠️ Ingresa un nombre para la promoción.');
      return;
    }
    if (!editingPromo.discountValue || editingPromo.discountValue <= 0) {
      showToast('⚠️ Ingresa un valor de descuento válido.');
      return;
    }

    setSubmitting(true);
    try {
      const promoData = {
        ...editingPromo,
        discountValue: Number(editingPromo.discountValue),
      };

      if (editingPromo.id) {
        const { id, ...data } = promoData;
        await updatePromotion(id, data);
        showToast('✓ Promoción actualizada correctamente.');
      } else {
        await addPromotion(promoData);
        showToast('✓ Promoción creada correctamente.');
      }
      setEditingPromo(null);
    } catch (err) {
      console.error(err);
      showToast('❌ Error al guardar la promoción.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (promo) => {
    setConfirmDialog({
      title: '¿Eliminar Promoción?',
      message: `¿Estás seguro de eliminar "${promo.name}"? Los servicios volverán a sus precios estándar.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deletePromotion(promo.id);
          showToast('✓ Promoción eliminada con éxito.');
        } catch (err) {
          console.error(err);
          showToast('❌ Error al eliminar la promoción.');
        }
      }
    });
  };

  const handleToggleActive = async (promo) => {
    try {
      await updatePromotion(promo.id, { active: !promo.active });
      showToast(promo.active ? 'Promoción desactivada.' : 'Promoción activada.');
    } catch (err) {
      console.error(err);
      showToast('❌ Error al cambiar estado.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[999] bg-neutral-900 border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/60 p-6 sm:p-8 rounded-[2.5rem] border border-white/5">
        <div>
          <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.25em]">Módulo Comercial</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Promociones y Descuentos por Día
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-xl">
            Crea ofertas especiales vinculadas a días específicos (ej. Martes 20% off en Barba). Los clientes verán los precios promocionales automáticamente en el catálogo y la reserva.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Promoción
        </button>
      </div>

      {/* Lista de Promociones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-neutral-900/30 border border-white/5 rounded-[2.5rem] space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-white font-bold text-sm">No hay promociones activas</p>
            <p className="text-neutral-500 text-xs">Crea una promoción por días para dinamizar las horas valle de la barbería.</p>
          </div>
        ) : (
          promotions.map(promo => (
            <div
              key={promo.id}
              className={`bg-neutral-900/60 border rounded-[2rem] p-6 space-y-4 transition-all relative overflow-hidden ${
                promo.active ? 'border-red-600/30 shadow-lg shadow-red-600/5' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    promo.active ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {promo.active ? 'Activa' : 'Pausada'}
                  </span>
                  <h3 className="text-white font-black text-lg mt-2">{promo.name}</h3>
                  {promo.description && <p className="text-neutral-400 text-xs mt-1">{promo.description}</p>}
                </div>

                <div className="text-right">
                  <span className="text-red-500 font-black text-2xl">
                    {promo.discountType === 'percentage' ? `-${promo.discountValue}%` : formatCOP(promo.discountValue)}
                  </span>
                </div>
              </div>

              {/* Días aplicables */}
              <div className="space-y-1.5">
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Días de la semana</p>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map(d => {
                    const isSelected = Array.isArray(promo.daysOfWeek) && promo.daysOfWeek.includes(d.key);
                    return (
                      <span
                        key={d.key}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isSelected
                            ? 'bg-red-600/20 text-red-400 border-red-600/30'
                            : 'bg-neutral-800/40 text-neutral-600 border-transparent'
                        }`}
                      >
                        {d.label.slice(0, 3)}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Servicios incluidos */}
              <div className="space-y-1.5">
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Servicios</p>
                <p className="text-neutral-300 text-xs">
                  {!promo.serviceIds || promo.serviceIds.length === 0
                    ? 'Aplica para todos los servicios'
                    : `${promo.serviceIds.length} servicio(s) seleccionado(s)`}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleToggleActive(promo)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    promo.active ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {promo.active ? 'Pausar' : 'Activar'}
                </button>
                <button
                  onClick={() => setEditingPromo(promo)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(promo)}
                  className="p-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear / Editar Promoción */}
      {editingPromo && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setEditingPromo(null)} />
          <div className="relative bg-neutral-900 border border-white/10 p-6 sm:p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white text-xl font-black">
                  {editingPromo.id ? 'Editar Promoción' : 'Nueva Promoción'}
                </h3>
                <p className="text-neutral-500 text-xs">Define descuentos automáticos por días</p>
              </div>
              <button
                onClick={() => setEditingPromo(null)}
                className="text-neutral-400 hover:text-white p-2 rounded-full bg-white/5 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block font-bold">
                  Nombre de la Promoción *
                </label>
                <input
                  type="text"
                  value={editingPromo.name}
                  onChange={e => setEditingPromo(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej. Martes de Barba VIP"
                  className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3.5 text-white text-sm focus:border-red-600 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block font-bold">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={editingPromo.description || ''}
                  onChange={e => setEditingPromo(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ej. 20% de descuento en todos los servicios de barba"
                  className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3.5 text-white text-sm focus:border-red-600 outline-none"
                />
              </div>

              {/* Tipo y Valor de Descuento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block font-bold">
                    Tipo de Descuento
                  </label>
                  <select
                    value={editingPromo.discountType}
                    onChange={e => setEditingPromo(p => ({ ...p, discountType: e.target.value }))}
                    className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3.5 text-white text-sm focus:border-red-600 outline-none cursor-pointer"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Precio Fijo ($ COP)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block font-bold">
                    {editingPromo.discountType === 'percentage' ? 'Porcentaje (%)' : 'Precio Fijo ($)'}
                  </label>
                  <input
                    type="number"
                    value={editingPromo.discountValue}
                    onChange={e => setEditingPromo(p => ({ ...p, discountValue: e.target.value }))}
                    className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3.5 text-white text-sm focus:border-red-600 outline-none"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Selector de Días de la Semana */}
              <div className="space-y-2">
                <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block font-bold">
                  Días en que Aplica
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map(d => {
                    const isChecked = (editingPromo.daysOfWeek || []).includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => handleToggleDay(d.key)}
                        className={`p-2.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border ${
                          isChecked
                            ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                            : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {d.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Servicios */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block font-bold">
                    Servicios Incluidos
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingPromo(p => ({ ...p, serviceIds: [] }))}
                    className="text-[10px] text-red-500 font-bold hover:underline"
                  >
                    Seleccionar Todos
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-neutral-800/50 rounded-2xl border border-white/5">
                  {menServices.map(svc => {
                    const isSelected = (editingPromo.serviceIds || []).includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleService(svc.id)}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-600"
                        />
                        <span className="text-white font-medium flex-1">{svc.name}</span>
                        <span className="text-neutral-500 font-mono">{formatCOP(svc.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPromo(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all cursor-pointer shadow-lg shadow-red-600/30"
                >
                  {submitting ? 'Guardando...' : 'Guardar Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
