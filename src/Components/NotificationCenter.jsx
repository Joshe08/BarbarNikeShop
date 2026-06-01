import { useState, useRef, useEffect } from 'react';
import { useBookings } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';

const formatNotificationDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.toLocaleDateString()} a las ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '';
  }
};

function NotificationCenter() {
  const { isAuthenticated } = useAuth();
  const { notifications, markNotificationAsRead, deleteNotification, clearAllNotifications } = useBookings();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.allSettled(unread.map(n => markNotificationAsRead(n.id)));
  };

  const handleOpenDropdown = () => {
    const isOpening = !isOpen;
    setIsOpen(isOpening);
    // Al abrir, marcar todas como leídas inmediatamente
    if (isOpening && unreadCount > 0) {
      handleMarkAllRead();
    }
  };

  // Limpiar ELIMINA todas las notificaciones de forma atómica (lote)
  const handleClearAll = async () => {
    await clearAllNotifications();
  };

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <div className="relative z-[105]" ref={dropdownRef} style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Bell Button */}
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 bg-neutral-900 border border-white/5 hover:border-white/20 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center focus:outline-none"
        aria-label="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Badge desaparece al abrir el dropdown */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-neutral-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in z-[115]">
          {/* Header */}
          <div className="p-4 bg-neutral-900/80 border-b border-white/5 flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-sm">Notificaciones</h3>
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-bold mt-0.5">
                {notifications.length === 0 ? 'Sin notificaciones' : `${notifications.length} total`}
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-neutral-500 hover:text-red-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar todo
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-neutral-500 text-xs font-medium">Todo en orden, sin notificaciones</p>
              </div>
            ) : (
              <>
                {/* Sin leer primero */}
                {unread.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-orange-500">Sin leer ({unread.length})</p>
                    {unread.map(n => (
                      <div key={n.id} className="p-4 flex items-start gap-3 bg-orange-500/3 hover:bg-white/3 transition-colors">
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-orange-500 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold">{n.title}</p>
                          <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed break-words">{n.message}</p>
                          <p className="text-neutral-600 text-[9px] mt-1.5 font-bold">
                            {formatNotificationDate(n.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="text-neutral-600 hover:text-red-400 p-1 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Leídas */}
                {read.length > 0 && (
                  <div>
                    {unread.length > 0 && <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-neutral-600">Leídas</p>}
                    {read.map(n => (
                      <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-white/2 transition-colors">
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-neutral-700" />
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-300 text-xs font-medium">{n.title}</p>
                          <p className="text-neutral-500 text-[11px] mt-0.5 leading-relaxed break-words">{n.message}</p>
                          <p className="text-neutral-700 text-[9px] mt-1.5 font-bold">
                            {formatNotificationDate(n.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="text-neutral-700 hover:text-red-400 p-1 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
