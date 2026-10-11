import { formatCOP } from '../utils/format';
import { useApp } from '../context/AppContext';

function ServiceDetailModal({ service, onClose, showMargin = false, onBook }) {
  const { workers } = useApp();
  if (!service) return null;

  // Filtrar trabajadores calificados para este servicio
  const availableWorkers = workers.filter(w => {
    if (w.active === false) return false;
    if (service.workerRoles) {
      return service.workerRoles.includes(w.role);
    }
    return w.category === service.category;
  });

  const isMen = service.category === 'men';
  const accentText = isMen ? 'text-red-600' : 'text-violet-400';
  const accentBg = isMen ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-gradient-to-r from-violet-700 to-indigo-700 hover:opacity-90 shadow-violet-600/20';
  const dotColor = isMen ? 'bg-red-600' : 'bg-violet-500';

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-neutral-900 border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        
        {/* Header con imagen */}
        <div className="relative h-48 sm:h-52 overflow-hidden flex-shrink-0">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              if (service.imageFallback && e.currentTarget.src !== service.imageFallback) {
                e.currentTarget.src = service.imageFallback;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent"></div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white p-2.5 rounded-full hover:bg-black/90 transition-all cursor-pointer border border-white/5 active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <h3 className="text-white text-2xl font-black tracking-tight leading-tight">{service.name}</h3>
            <p className={`${accentText} text-xs font-bold uppercase tracking-wider mt-1`}>{service.includes}</p>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Precio y Duración */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
              <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Precio Especial</p>
              <p className={`font-black text-lg mt-0.5 ${accentText}`}>{formatCOP(service.price)}</p>
            </div>
            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
              <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Duración Estimada</p>
              <p className="text-white font-black text-lg mt-0.5">{service.duration}<span className="text-xs text-neutral-400 font-bold"> min</span></p>
            </div>
            {showMargin && (
              <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-2xl p-3 text-center">
                <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest">Comisión</p>
                <p className="text-green-400 font-black text-lg mt-0.5">{formatCOP(service.price * 0.4)}</p>
              </div>
            )}
          </div>

          {/* Descripción */}
          <p className="text-neutral-400 text-sm leading-relaxed font-medium">{service.description}</p>

          {/* Detalles específicos */}
          {service.details && service.details.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <div className={`w-1.5 h-3.5 ${dotColor} rounded-full`}></div>
                ¿Qué incluye el servicio?
              </h4>
              <div className="grid grid-cols-1 gap-2 bg-neutral-950/30 border border-white/5 p-4 rounded-2xl">
                {service.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4.5 w-4.5 ${accentText} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="leading-relaxed font-medium">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Especialistas Disponibles */}
          <div className="space-y-3">
            <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <div className={`w-1.5 h-3.5 ${dotColor} rounded-full`}></div>
              Especialistas que lo realizan
            </h4>
            <div className="flex flex-wrap gap-3">
              {availableWorkers.map(w => (
                <div key={w.id} className="flex items-center gap-2.5 bg-neutral-950/40 border border-white/5 px-3.5 py-2 rounded-2xl">
                  <img src={w.image} alt={w.name} className="w-8 h-8 rounded-xl object-cover border border-white/10" />
                  <div>
                    <p className="text-white text-xs font-black">{w.name}</p>
                    <p className="text-neutral-500 text-[9px] uppercase tracking-wider font-bold">{w.specialty}</p>
                  </div>
                </div>
              ))}
              {availableWorkers.length === 0 && (
                <p className="text-neutral-500 text-xs">No hay especialistas asignados para esta categoría.</p>
              )}
            </div>
          </div>
        </div>

        {/* Botón de acción al pie */}
        {onBook && (
          <div className="p-4 border-t border-white/5 bg-neutral-900/90 flex-shrink-0">
            <button
              onClick={() => {
                onBook(service);
                onClose();
              }}
              className={`w-full py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${accentBg}`}
            >
              Agendar este servicio
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceDetailModal;
