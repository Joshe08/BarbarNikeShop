import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ServiceDetailModal from './ServiceDetailModal';
import { formatCOP } from '../utils/format';

const SUBCATEGORIES = {
  cortes: { label: 'Cortes & Peinados' },
  coloracion: { label: 'Coloracion' },
  tratamientos: { label: 'Tratamientos' },
  unas: { label: 'Manicura & Unas' },
};

function ServiceCard({ service, onSelect }) {
  return (
    <button
      onClick={() => onSelect(service)}
      className="group text-left bg-neutral-900/60 border border-white/5 rounded-[2rem] overflow-hidden hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500 cursor-pointer"
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
        <div className="absolute top-4 right-4">
          <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full">
            {formatCOP(service.price)}
          </span>
        </div>
      </div>
      <div className="p-5 space-y-2">
        <p className="text-white font-black text-lg group-hover:text-orange-500 transition-colors">{service.name}</p>
        <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">{service.description}</p>
        <div className="flex items-center gap-3 pt-1">
          <span className="bg-white/5 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {service.duration} min
          </span>
          <span className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Ver detalles</span>
        </div>
      </div>
    </button>
  );
}

function WomanServiceCard({ service, onSelect }) {
  return (
    <button
      onClick={() => onSelect(service)}
      className="group text-left bg-neutral-900/60 border border-white/5 rounded-[2rem] overflow-hidden hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-500 cursor-pointer"
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
        <div className="absolute top-4 right-4">
          <span className="bg-gradient-to-r from-violet-700 via-violet-800 to-indigo-700 text-white text-xs font-black px-3 py-1 rounded-full border border-violet-500/30 shadow-md">
            {formatCOP(service.price)}
          </span>
        </div>
      </div>
      <div className="p-5 space-y-2">
        <p className="text-white font-black text-lg group-hover:text-violet-400 transition-colors">{service.name}</p>
        <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">{service.description}</p>
        <div className="flex items-center gap-3 pt-1">
          <span className="bg-white/5 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{service.duration} min</span>
          <span className="text-violet-400 text-[10px] font-bold uppercase tracking-widest">Ver detalles</span>
        </div>
      </div>
    </button>
  );
}

function Catalog({ onBookingClick, onBookService }) {
  const { menServices, womenServices, appLoading } = useApp();
  const [tab, setTab] = useState('men');
  const [selectedService, setSelectedService] = useState(null);

  const groupedWomen = SUBCATEGORIES
    ? Object.entries(SUBCATEGORIES).map(([key, meta]) => ({
        key,
        ...meta,
        services: womenServices.filter(s => s.subcategory === key)
      })).filter(g => g.services.length > 0)
    : [];

  return (
    <section id="catalogo" className="py-24 px-4 sm:px-8 bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14 space-y-4">
          <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em]">Nuestros Servicios</span>
          <h2 className="text-white text-4xl sm:text-5xl font-black tracking-tighter leading-tight">
            Lo que <span className="text-orange-500">ofrecemos</span>
          </h2>
          <p className="text-neutral-500 max-w-xl mx-auto text-base leading-relaxed">
            Servicios premium para hombres y mujeres. Calidad garantizada en cada visita.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-1.5 flex gap-1">
            <button
              onClick={() => setTab('men')}
              className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all cursor-pointer ${
                tab === 'men'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              Barberia
            </button>
            <button
              onClick={() => setTab('women')}
              className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all cursor-pointer ${
                tab === 'women'
                  ? 'bg-gradient-to-r from-violet-700 to-indigo-700 text-white shadow-lg shadow-violet-600/30'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              Salon Nike
            </button>
          </div>
        </div>

        {appLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-neutral-900/60 border border-white/5 rounded-[2rem] h-72 animate-pulse" />
            ))}
          </div>
        ) : tab === 'men' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {menServices.map(s => (
              <ServiceCard key={s.id} service={s} onSelect={setSelectedService} />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {groupedWomen.map(group => (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-white font-black text-xl">{group.label}</h3>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.services.map(s => (
                    <WomanServiceCard key={s.id} service={s} onSelect={setSelectedService} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-14">
          <button
            onClick={onBookingClick}
            className={`inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-105 shadow-xl cursor-pointer active:scale-[0.98] ${
              tab === 'women'
                ? 'bg-gradient-to-r from-violet-700 to-indigo-700 shadow-violet-600/30 hover:opacity-90'
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
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
