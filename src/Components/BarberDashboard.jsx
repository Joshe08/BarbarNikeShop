import { useState } from 'react';
import { BARBERS, SERVICES, INITIAL_BOOKINGS } from '../data/mockData';
import ServiceDetailModal from './ServiceDetailModal';

function BarberDashboard() {
  const [bookings] = useState(INITIAL_BOOKINGS.filter(b => b.barberId === 1));
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nueva reserva: Juan Perez para hoy a las 10:00", read: false },
    { id: 2, text: "Admin aprobo tu cambio de porcentaje", read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  // Find full service object for a booking
  const getServiceForBooking = (booking) => SERVICES.find(s => s.name === booking.service) || null;

  return (
    <div className="p-8 bg-neutral-950 min-h-screen animate-slide-up">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-4xl font-black">Panel <span className="text-red-600">Barbero</span></h1>
            <p className="text-neutral-500">Tu agenda para hoy, Alex</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button onClick={markAllRead} className="bg-neutral-900 p-4 rounded-2xl text-white border border-white/5 hover:border-red-600/30 transition-all relative cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 rounded-full border-2 border-neutral-950 flex items-center justify-center text-[10px] font-black">{unreadCount}</span>}
              </button>
              <div className="absolute top-full right-0 mt-4 w-80 glass rounded-3xl p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 z-50">
                <p className="text-white font-bold mb-4">Notificaciones</p>
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-3 rounded-xl text-xs ${n.read ? 'text-neutral-500' : 'text-white bg-white/5 border border-white/5'}`}>{n.text}</div>
                  ))}
                </div>
              </div>
            </div>
            <img src={BARBERS[0].image} className="w-14 h-14 rounded-2xl object-cover border-2 border-red-600" />
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-5 rounded-2xl text-center">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Citas Hoy</p>
            <p className="text-white font-black text-3xl mt-1">{bookings.length}</p>
          </div>
          <div className="glass p-5 rounded-2xl text-center">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Ingresos</p>
            <p className="text-red-600 font-black text-3xl mt-1">${bookings.reduce((a, b) => a + (b.servicePrice || 0), 0)}</p>
          </div>
          <div className="glass p-5 rounded-2xl text-center">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Pendientes</p>
            <p className="text-yellow-500 font-black text-3xl mt-1">{bookings.filter(b => b.status === 'pending').length}</p>
          </div>
        </div>

        {/* Appointments */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-red-600 rounded-full"></div>
            <h2 className="text-white font-bold text-2xl">Proximas Citas</h2>
          </div>
          <div className="grid gap-4">
            {bookings.map(booking => {
              const svc = getServiceForBooking(booking);
              return (
                <div key={booking.id} onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                  className="glass rounded-3xl overflow-hidden hover:border-red-600/20 transition-all duration-300 cursor-pointer">
                  {/* Summary Row */}
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600 font-black text-lg">
                        {booking.clientName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{booking.clientName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="bg-red-600/10 text-red-600 text-xs font-bold px-2 py-0.5 rounded-lg">{booking.service}</span>
                          <span className="text-neutral-500 text-xs">{booking.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {booking.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-neutral-500 transition-transform ${selectedBooking?.id === booking.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {selectedBooking?.id === booking.id && (
                    <div className="px-6 pb-6 border-t border-white/5 pt-5 space-y-4 animate-slide-up">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-800/50 p-4 rounded-xl">
                          <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Cliente</p>
                          <p className="text-white font-bold">{booking.clientName}</p>
                          {booking.clientPhone && <p className="text-neutral-400 text-sm mt-1">Tel: {booking.clientPhone}</p>}
                        </div>
                        <div className="bg-neutral-800/50 p-4 rounded-xl">
                          <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Fecha & Hora</p>
                          <p className="text-white font-bold">{booking.date}</p>
                          <p className="text-red-600 font-bold">{booking.time}</p>
                        </div>
                      </div>
                      {svc && (
                        <div className="bg-neutral-800/50 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-neutral-500 text-xs font-bold uppercase mb-1">Servicio</p>
                              <p className="text-white font-bold text-lg">{svc.name}</p>
                              <p className="text-neutral-400 text-sm">{svc.includes}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-600 font-black text-2xl">${svc.price}</p>
                              <p className="text-neutral-500 text-xs">{svc.duration} min</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {svc.details?.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                                <span className="text-red-600">-</span> {d}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        {booking.clientPhone && (
                          <a href={`https://wa.me/${booking.clientPhone}`} target="_blank" rel="noopener noreferrer"
                            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-center flex items-center justify-center gap-2 hover:bg-green-700 transition-all cursor-pointer">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            WhatsApp
                          </a>
                        )}
                        <button className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all cursor-pointer">Check-in</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {bookings.length === 0 && <p className="p-12 text-neutral-500 text-center font-medium glass rounded-3xl">No hay citas programadas.</p>}
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-white rounded-full"></div>
            <h2 className="text-white font-bold text-2xl">Servicios</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => setSelectedService(s)}
                className="glass p-4 rounded-2xl flex items-center gap-3 hover:border-red-600/20 transition-all text-left cursor-pointer group">
                <img src={s.image} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm group-hover:text-red-600 transition-colors truncate">{s.name}</p>
                  <p className="text-neutral-500 text-xs truncate">{s.includes}</p>
                </div>
                <p className="text-red-600 font-bold">${s.price}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} />
    </div>
  );
}

export default BarberDashboard;
