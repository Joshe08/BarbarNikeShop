import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ServiceDetailModal from './ServiceDetailModal';
import { formatCOP } from '../utils/format';



function ServiceCard({ service, onSelect }) {
  const { getServicePromoInfo } = useApp();
  const promoInfo = getServicePromoInfo ? getServicePromoInfo(service) : { hasPromo: false, promoPrice: service.price };

  return (
    <button
      onClick={() => onSelect(service)}
      className="group text-left bg-neutral-900/60 border border-white/5 rounded-[2rem] overflow-hidden hover:border-red-600/30 hover:shadow-xl hover:shadow-red-600/5 transition-all duration-500 cursor-pointer"
    >
      <div className="relative overflow-hidden h-44">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={e => {
            if (service.imageFallback && e.currentTarget.src !== service.imageFallback) {
              e.currentTarget.src = service.imageFallback;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/20 to-transparent" />
        
        {/* Badges de precio */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
          {promoInfo.hasPromo ? (
            <>
              <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-red-600/40 animate-pulse">
                {formatCOP(promoInfo.promoPrice)}
              </span>
              <span className="bg-black/70 backdrop-blur-sm text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded-full line-through border border-white/10">
                {formatCOP(service.price)}
              </span>
            </>
          ) : (
            <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full">
              {formatCOP(service.price)}
            </span>
          )}
        </div>

        {promoInfo.hasPromo && (
          <div className="absolute top-4 left-4">
            <span className="bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
              🔥 Promo Hoy
            </span>
          </div>
        )}
      </div>
      <div className="p-5 space-y-2">
        <p className="text-white font-black text-lg group-hover:text-red-600 transition-colors">{service.name}</p>
        <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">{service.description}</p>
        <div className="flex items-center gap-3 pt-1">
          <span className="bg-white/5 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {service.duration} min
          </span>
          <span className="text-red-600 text-[10px] font-bold uppercase tracking-widest">Ver detalles</span>
        </div>
      </div>
    </button>
  );
}

function Catalog({ onBookingClick, onBookService }) {
  const { menServices, appLoading } = useApp();
  
  const [selectedService, setSelectedService] = useState(null);

  

  return (
    <section id="catalogo" className="py-24 px-4 sm:px-8 bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14 space-y-4">
          <span className="text-red-600 text-[10px] font-black uppercase tracking-[0.3em]">Nuestros Servicios</span>
          <h2 className="text-white text-4xl sm:text-5xl font-black tracking-tighter leading-tight">
            Lo que <span className="text-red-600">ofrecemos</span>
          </h2>
          <p className="text-neutral-500 max-w-xl mx-auto text-base leading-relaxed">
            Servicios de barbería premium. Cortes, barba y tratamientos. Calidad garantizada en cada visita.
          </p>
        </div>

        

        {appLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-neutral-900/60 border border-white/5 rounded-[2rem] h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {menServices.map(s => (
              <ServiceCard key={s.id} service={s} onSelect={setSelectedService} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-14">
          <button
            onClick={onBookingClick}
            className={`inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-105 shadow-xl cursor-pointer active:scale-[0.98] ${
              'bg-red-600 hover:bg-red-700 shadow-red-600/30'
            }`}
          >
            Reservar cita ahora
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>

      <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} onBook={onBookService} />
    </section>
  );
}

export default Catalog;
