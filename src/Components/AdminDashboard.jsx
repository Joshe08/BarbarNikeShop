import { useState, useMemo, useEffect } from 'react';
import { useBookings } from '../context/BookingContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCOP } from '../utils/format';
import ImageUploadField from './ImageUploadField';
import ReportsModule from './ReportsModule';
import CommissionsModule from './CommissionsModule';
import ClosuresModule from './ClosuresModule';
import PromotionsModule from './PromotionsModule';
import QRModule from './QRModule';

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',   color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  confirmed:   { label: 'Confirmada',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'En proceso',  color: 'bg-red-600/10 text-red-500 border-red-600/20' },
  completed:   { label: 'Finalizada',  color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  cancelled:   { label: 'Cancelada',   color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const LOW_STOCK_THRESHOLD = 5;
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo'
};

const FALLBACK_PRODUCTS = [
  { name: 'Cera Mate Premium', price: 35000, stock: 20, description: 'Control extremo con acabado mate. Fijacion fuerte todo el dia sin brillo.', category: 'capilar', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=70&fm=webp' },
  { name: 'Pomada Brillante', price: 32000, stock: 15, description: 'Acabado brillante con fijacion media. Ideal para looks clasicos y retro.', category: 'capilar', image: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=600&q=70&fm=webp' },
  { name: 'Shampoo Profesional', price: 28000, stock: 30, description: 'Limpieza profunda con formula sin sulfatos. Hidrata y fortalece desde la raiz.', category: 'capilar', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=70&fm=webp' },
  { name: 'Perfume Barber Fresh', price: 85000, stock: 10, description: 'Fragancia masculina de larga duracion. Notas de madera, citrico y musgo.', category: 'accesorios', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=70&fm=webp' },
  { name: 'Maquina de Corte Pro', price: 280000, stock: 5, description: 'Motor de alta potencia con 5 alturas de corte. Bateria de larga duracion.', category: 'maquinas', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=70&fm=webp' },
  { name: 'Gorra Barber Kalvin Classic', price: 45000, stock: 12, description: 'Gorra premium con logo bordado. Tela transpirable y ajuste perfecto.', category: 'accesorios', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=70&fm=webp' },
  { name: 'Acondicionador Intensivo', price: 25000, stock: 25, description: 'Hidratacion profunda que deja el cabello suave y manejable. Sin parabenos.', category: 'capilar', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=70&fm=webp' },
  { name: 'Recortadora de Barba', price: 150000, stock: 8, description: 'Precision milimetrica para definir tu barra. Incluye 8 peines guia.', category: 'maquinas', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=70&fm=webp' },
];

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-neutral-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-fade-in p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-white text-xl font-black mb-2">{title}</h3>
        <p className="text-neutral-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors cursor-pointer shadow-lg shadow-red-500/20">
            Aceptar
          </button>
        </div>
      </div>
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

// ─── Toast de Éxito ─────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}>
      <div className="flex items-center gap-3 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-green-500/30 font-bold text-sm">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        {message}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'orange' }) {
  const colors = {
    orange: 'text-red-600 border-red-600/10 bg-red-600/5',
    green:  'text-green-400 border-green-400/10 bg-green-400/5',
    blue:   'text-blue-400 border-blue-400/10 bg-blue-400/5',
    purple: 'text-purple-400 border-purple-400/10 bg-purple-500/5',
  };
  return (
    <div className={`bg-neutral-900 border rounded-3xl p-6 space-y-1.5 shadow-md ${colors[color] ? 'border-white/5' : 'border-white/5'}`}>
      <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className={`font-black text-2xl tracking-tight ${colors[color] ? colors[color].split(' ')[0] : 'text-white'}`}>{value}</p>
      {sub && <p className="text-neutral-600 text-xs font-medium">{sub}</p>}
    </div>
  );
}

function EditModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-neutral-900 border border-white/10 p-6 sm:p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-xl font-black">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer transition-colors p-1 bg-white/5 rounded-full">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full bg-neutral-800 border border-white/5 rounded-xl p-3 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all text-sm font-medium"
      />
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
  const msg = `Hola *${bk.clientName}*, te recordamos tu cita de hoy *${bk.date}* a las *${bk.time}* para el servicio de *${bk.service}* con *${bk.workerName}* en *Barber Kalvin*. ¡Te esperamos!`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
};


function AdminDashboard() {
  const { user } = useAuth();
  const { 
    workers, services, products, expenses, users, branches, sales,
    addWorker, updateWorker, deleteWorker,
    addService, updateService, deleteService,
    addProduct, updateProduct, deleteProduct,
    sellProduct, addExpense, updateExpense, deleteExpense,
    revertSale,
    updateUserRole, updateUserStatus, deleteUserDoc, appLoading
  } = useApp();
  const { bookings, updateBookingStatus, deleteBooking, loadingBookings } = useBookings();
  const [tab, setTab] = useState(() => localStorage.getItem('admin_dashboard_tab') || 'stats');
  const [inventorySubTab, setInventorySubTab] = useState(() => localStorage.getItem('admin_inventory_tab') || 'products');

  useEffect(() => {
    localStorage.setItem('admin_dashboard_tab', tab);
  }, [tab]);

  useEffect(() => {
    localStorage.setItem('admin_inventory_tab', inventorySubTab);
  }, [inventorySubTab]);

  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingCustomDate, setBookingCustomDate] = useState(() => {
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const getFirstDayOfMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [statsStartDate, setStatsStartDate] = useState(getFirstDayOfMonth());
  const [statsEndDate, setStatsEndDate] = useState(getTodayDateString());
  const [balanceStartDate, setBalanceStartDate] = useState(getFirstDayOfMonth());
  const [balanceEndDate, setBalanceEndDate] = useState(getTodayDateString());
  const [editingWorker, setEditingWorker] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sellingProduct, setSellingProduct] = useState(null);
  const [sellingQuantity, setSellingQuantity] = useState('1');
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm }
  const [cancelDialog, setCancelDialog] = useState(null); // { bookingId, nextStatus }
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Helper functions and calculations placed before early return to satisfy Rules of Hooks
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayString();
  const todayBookings = bookings ? bookings.filter(b => b.date === todayStr) : [];

  const isDateInRange = (dateStr, startDate, endDate) => {
    if (!dateStr) return false;
    let str;
    if (typeof dateStr === 'string') {
      str = dateStr;
    } else if (dateStr && typeof dateStr === 'object') {
      if (typeof dateStr.toDate === 'function') {
        str = dateStr.toDate().toISOString();
      } else if (dateStr.seconds) {
        str = new Date(dateStr.seconds * 1000).toISOString();
      } else {
        str = dateStr.toString();
      }
    } else {
      str = String(dateStr);
    }
    const cleanDateStr = str.includes('T') ? str.split('T')[0] : str;
    return cleanDateStr >= startDate && cleanDateStr <= endDate;
  };

  // --- Balance Sub-Tab Calculations ---
  const balanceCitasCount = useMemo(() => {
    if (!bookings) return 0;
    return bookings.filter(b => 
      b.status === 'completed' &&
      isDateInRange(b.date, balanceStartDate, balanceEndDate)
    ).length;
  }, [bookings, balanceStartDate, balanceEndDate]);

  const balanceCitasRevenue = useMemo(() => {
    if (!bookings) return 0;
    return bookings.filter(b => 
      b.status === 'completed' &&
      isDateInRange(b.date, balanceStartDate, balanceEndDate)
    ).reduce((sum, b) => sum + (b.servicePrice || 0), 0);
  }, [bookings, balanceStartDate, balanceEndDate]);

  const periodSales = useMemo(() => {
    if (!sales) return [];
    const sList = sales.filter(s => 
      isDateInRange(s.date, balanceStartDate, balanceEndDate)
    );
    return [...sList].sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  }, [sales, balanceStartDate, balanceEndDate]);

  const balanceProductsRevenue = useMemo(() => {
    return periodSales.reduce((sum, s) => sum + (s.total || 0), 0);
  }, [periodSales]);

  const balanceSalesCount = useMemo(() => {
    return periodSales.length;
  }, [periodSales]);

  const balanceExpensesCount = useMemo(() => {
    if (!expenses) return 0;
    return expenses.filter(e => 
      isDateInRange(e.date, balanceStartDate, balanceEndDate)
    ).length;
  }, [expenses, balanceStartDate, balanceEndDate]);

  const balanceExpensesAmount = useMemo(() => {
    if (!expenses) return 0;
    return expenses.filter(e => 
      isDateInRange(e.date, balanceStartDate, balanceEndDate)
    ).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses, balanceStartDate, balanceEndDate]);

  const balanceNetProfit = balanceCitasRevenue + balanceProductsRevenue - balanceExpensesAmount;

  if (appLoading || loadingBookings) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="flex items-center text-white text-3xl font-black tracking-tighter mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <span>BARBER <span className="text-red-500">KALVIN</span></span>
          </div>

          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className="absolute inset-0 rounded-full border-4 border-t-red-600 animate-spin" />
          </div>

          <div className="space-y-1 text-center">
            <p className="text-white text-sm font-black uppercase tracking-widest">Sincronizando panel</p>
            <p className="text-neutral-500 text-xs font-medium">Cargando base de datos en tiempo real...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Stats ──────────────────────────────────────────────────
  const filteredBookingsForStats = bookings;

  const completedBookings = filteredBookingsForStats.filter(b => b.status === 'completed' && isDateInRange(b.date, statsStartDate, statsEndDate));
  const totalRevenue = completedBookings.reduce((s, b) => s + (b.servicePrice || 0), 0);
  
  // Ingresos por Barberia
  const barberRevenue = totalRevenue;

  const completedCount = completedBookings.length;
  const pendingCount = filteredBookingsForStats.filter(b => b.status === 'pending' && isDateInRange(b.date, statsStartDate, statsEndDate)).length;
  const cancelledCount = filteredBookingsForStats.filter(b => b.status === 'cancelled' && isDateInRange(b.date, statsStartDate, statsEndDate)).length;

  // Top services y workers
  const topBookingsForPeriod = filteredBookingsForStats.filter(b => isDateInRange(b.date, statsStartDate, statsEndDate));

  const serviceCount = {};
  topBookingsForPeriod.forEach(b => { if (b.service) serviceCount[b.service] = (serviceCount[b.service] || 0) + 1; });
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const workerCount = {};
  topBookingsForPeriod.forEach(b => { if (b.workerName) workerCount[b.workerName] = (workerCount[b.workerName] || 0) + 1; });
  const topWorkers = Object.entries(workerCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Gastos
  const localExpenses = expenses.filter(e => isDateInRange(e.date, statsStartDate, statsEndDate)).reduce((sum, e) => sum + (e.amount || 0), 0);

  // Ventas de productos
  const localProductRevenue = sales.filter(s => isDateInRange(s.date, statsStartDate, statsEndDate)).reduce((sum, s) => sum + (s.total || 0), 0);

  // Ganancia neta (Citas + Ventas - Gastos)
  const localNetProfit = totalRevenue + localProductRevenue - localExpenses;

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2rem] text-center max-w-sm">
          <p className="text-red-400 font-bold">Acceso Denegado</p>
          <p className="text-neutral-400 text-xs mt-2">No tienes los permisos requeridos para ver esta página.</p>
        </div>
      </div>
    );
  }

  const handleRevertSale = (saleId) => {
    setConfirmDialog({
      title: '¿Revertir Venta?',
      message: '¿Seguro que deseas revertir esta venta? Esto eliminará el registro financiero de la venta y devolverá la cantidad vendida al inventario de productos.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await revertSale(saleId);
          showToast('✓ Venta revertida y stock devuelto con éxito');
        } catch (err) {
          console.error(err);
          showToast('✕ Error al revertir la venta');
        }
      }
    });
  };

  // Booking filter
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'today') return b.date === todayStr;
    if (bookingFilter === 'custom-day') return b.date === bookingCustomDate;
    const now = new Date();
    if (bookingFilter === 'week') {
      const bDate = new Date(b.date.replace(/-/g, '/'));
      const diff = (bDate - now) / (1000 * 60 * 60 * 24);
      return diff >= -7 && diff <= 7;
    }
    if (bookingFilter === 'month') {
      return b.date?.startsWith(now.toISOString().slice(0, 7));
    }
    return true;
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || '')); // Citas mas recientes arriba

  // Worker CRUD & Horarios
  const handleSaveWorker = async (w) => {
    const defaultSchedule = {
      monday: { start: '09:30', end: '19:30' },
      tuesday: { start: '09:30', end: '19:30' },
      wednesday: { start: '09:30', end: '19:30' },
      thursday: { start: '09:30', end: '19:30' },
      friday: { start: '09:30', end: '19:30' },
      saturday: { start: '09:30', end: '19:30' },
      sunday: { start: '10:00', end: '15:30' }
    };
    const workerToSave = {
      ...w,
      percentage: Number(w.percentage) || 0,
      schedule: w.schedule || defaultSchedule,
      branchId: w.branchId || 'branch-1'
    };

    if (w.id && workers.find(x => x.id === w.id)) {
      const { id, ...data } = workerToSave;
      await updateWorker(id, data);
    } else {
      await addWorker({ ...workerToSave, notifications: [] });
    }
    setEditingWorker(null);
  };

  const handleDeleteWorker = async (id) => {
    handleDeleteWorkerConfirm(id);
  };

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };


  const handleDeleteProduct = (id) => {
    setConfirmDialog({
      title: 'Eliminar Producto',
      message: '¿Estás seguro que deseas eliminar este producto permanentemente de la base de datos?',
      onConfirm: async () => {
        setEditingProduct(null);
        setSellingProduct(null);
        setConfirmDialog(null);
        try {
          await deleteProduct(id);
          showToast('✓ Producto eliminado correctamente');
        } catch (error) {
          console.error(error);
          showToast('✕ Error al eliminar producto');
        }
      }
    });
  };

  const handleDeleteBookingConfirm = (id) => {
    setConfirmDialog({
      title: 'Eliminar Cita',
      message: '¿Estás seguro de eliminar esta cita de forma permanente? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteBooking(id);
          showToast('✓ Cita eliminada correctamente');
        } catch (error) {
          console.error(error);
          showToast('✕ Error al eliminar la cita');
        }
      }
    });
  };

  const handleDeleteUser = (uid) => {
    setConfirmDialog({
      title: 'Borrar Usuario',
      message: '¿Seguro que deseas borrar permanentemente a este usuario? Esto borrará sus datos de la base de datos y no podrá ingresar.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteUserDoc(uid);
          showToast('✓ Usuario eliminado correctamente');
        } catch (error) {
          console.error(error);
          showToast('✕ Error al eliminar usuario');
        }
      }
    });
  };

  const handleDeleteExpense = (id) => {
    setConfirmDialog({
      title: 'Eliminar Gasto',
      message: '¿Estás seguro de eliminar este gasto permanentemente?',
      onConfirm: async () => {
        setEditingExpense(null);
        setConfirmDialog(null);
        try {
          await deleteExpense(id);
          showToast('✓ Gasto eliminado correctamente');
        } catch (error) {
          console.error(error);
          showToast('✕ Error al eliminar gasto');
        }
      }
    });
  };

  const handleDeleteWorkerConfirm = (id) => {
    setConfirmDialog({
      title: 'Eliminar Trabajador',
      message: '¿Estás seguro de eliminar este trabajador? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setEditingWorker(null);
        setConfirmDialog(null);
        try {
          await deleteWorker(id);
          showToast('✓ Trabajador eliminado correctamente');
        } catch (error) {
          console.error(error);
          showToast('✕ Error al eliminar trabajador');
        }
      }
    });
  };

  const handleSyncProducts = async () => {
    for (const p of FALLBACK_PRODUCTS) {
      await addProduct(p);
    }
  };

  const handleDayCheck = (day, checked) => {
    setEditingWorker(prev => {
      const schedule = { ...(prev.schedule || {}) };
      if (checked) {
        schedule[day] = schedule[day] || { start: '08:00', end: '18:00' };
      } else {
        delete schedule[day];
      }
      return { ...prev, schedule };
    });
  };

  const handleDayTimeChange = (day, field, val) => {
    setEditingWorker(prev => {
      const schedule = { ...(prev.schedule || {}) };
      if (schedule[day]) {
        schedule[day] = { ...schedule[day], [field]: val };
      }
      return { ...prev, schedule };
    });
  };

  // Service CRUD
  const handleSaveService = async (s) => {
    const serviceToSave = {
      ...s,
      price: Number(s.price) || 0,
      duration: Number(s.duration) || 0
    };
    if (s.id && services.find(x => x.id === s.id)) {
      const { id, ...data } = serviceToSave;
      await updateService(id, data);
    } else {
      await addService(serviceToSave);
    }
    setEditingService(null);
  };
  const handleDeleteService = (id) => {
    setConfirmDialog({
      title: 'Eliminar Servicio',
      message: '¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setEditingService(null);
        setConfirmDialog(null);
        try {
          await deleteService(id);
          showToast('✓ Servicio eliminado correctamente');
        } catch (error) {
          console.error(error);
          showToast('✕ Error al eliminar servicio');
        }
      }
    });
  };

  // Product CRUD
  const handleSaveProduct = async (p) => {
    const productToSave = {
      ...p,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0
    };
    if (p.id && products.find(x => x.id === p.id)) {
      const { id, ...data } = productToSave;
      await updateProduct(id, data);
    } else {
      await addProduct(productToSave);
    }
    setEditingProduct(null);
  };

  const TABS = [
    { key: 'stats',       label: 'Estadísticas' },
    { key: 'bookings',    label: 'Citas' },
    { key: 'workers',     label: 'Barberos' },
    { key: 'services',    label: 'Servicios' },
    { key: 'promotions',  label: '🔥 Promociones' },
    { key: 'inventory',   label: 'Inventario y Finanzas' },
    { key: 'reports',     label: 'Reportes' },
    { key: 'commissions', label: 'Comisiones' },
    { key: 'closures',    label: '🛑 Estado Operativo' },
    { key: 'users',       label: 'Usuarios' },
    { key: 'qr',          label: '📲 Código QR' },
  ];

  return (
    <div className="bg-neutral-950 min-h-screen">
      <Toast {...toast} />
      {confirmDialog && <ConfirmModal {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
      {cancelDialog && (
        <CancelModal
          onConfirm={(reason) => {
            updateBookingStatus(cancelDialog.bookingId, cancelDialog.nextStatus, reason || 'Cancelado por el administrador');
            setCancelDialog(null);
            showToast('✓ Cita cancelada correctamente');
          }}
          onCancel={() => setCancelDialog(null)}
        />
      )}
      {/* ── BANNER SUPERIOR ────────────────────────────── */}
      <div className="bg-gradient-to-r from-red-700/20 via-neutral-900 to-neutral-900 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-full bg-red-600/5 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-red-600/30 border border-red-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>
            </div>
            <div>
              <h1 className="text-white text-xl font-black tracking-tight">Panel de <span className="text-red-600">Administración</span></h1>
              <p className="text-neutral-500 text-xs">Barber Kalvin Shop · Control total</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-red-600/10 border border-red-600/20 px-4 py-2 rounded-2xl text-center">
              <p className="text-neutral-500 text-[9px] uppercase tracking-widest font-bold">Ingresos</p>
              <p className="text-red-600 font-black text-lg">{formatCOP(totalRevenue)}</p>
            </div>
            <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-2xl text-center">
              <p className="text-neutral-500 text-[9px] uppercase tracking-widest font-bold">Citas hoy</p>
              <p className="text-white font-black text-lg">{todayBookings.length}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-2xl text-center">
              <p className="text-neutral-500 text-[9px] uppercase tracking-widest font-bold">Pendientes</p>
              <p className="text-yellow-400 font-black text-lg">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* ── NAVEGACION DE TABS ─────────────────────────── */}
        <div className="relative">
          {/* Fade izquierdo/derecho para indicar scroll */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none sm:hidden" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none sm:hidden" />
          <div className="overflow-x-auto scrollbar-hide pb-1">
            <div className="flex gap-1 bg-neutral-900 border border-white/5 p-1.5 rounded-2xl w-max min-w-full shadow-md">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 sm:px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    tab === t.key
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ESTADÍSTICAS ───────────────────────────────── */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {/* Período para Estadísticas */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/40 p-5 rounded-3xl border border-white/5">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Filtrar Análisis y Ganancias</h3>
                <p className="text-neutral-500 text-xs mt-0.5">Controla ingresos, citas, egresos y ganancias de Barber Kalvin por período de tiempo.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-neutral-500 text-[9px] font-black uppercase tracking-widest pl-1">Desde</span>
                  <input
                    type="date"
                    value={statsStartDate}
                    onChange={e => setStatsStartDate(e.target.value)}
                    className="bg-neutral-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-neutral-300 outline-none focus:border-red-600 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-neutral-500 text-[9px] font-black uppercase tracking-widest pl-1">Hasta</span>
                  <input
                    type="date"
                    value={statsEndDate}
                    onChange={e => setStatsEndDate(e.target.value)}
                    className="bg-neutral-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-neutral-300 outline-none focus:border-red-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-red-600/20 to-red-600/5 border border-red-600/20 rounded-3xl p-5 col-span-2 sm:col-span-1">
                <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Ingresos totales</p>
                <p className="text-red-500 font-black text-2xl mt-1 tracking-tight">{formatCOP(totalRevenue)}</p>
                <p className="text-neutral-600 text-xs mt-1">Citas completadas</p>
              </div>
              <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
                <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Total citas</p>
                <p className="text-blue-400 font-black text-3xl mt-1">{filteredBookingsForStats.length}</p>
                <p className="text-neutral-600 text-xs mt-1">{pendingCount} pendientes</p>
              </div>
              <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
                <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Ganancia neta</p>
                <p className={`font-black text-2xl mt-1 tracking-tight ${localNetProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCOP(localNetProfit)}</p>
                <p className="text-neutral-600 text-xs mt-1">Ing. - gastos</p>
              </div>
              <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
                <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Gastos totales</p>
                <p className="text-red-400 font-black text-3xl mt-1">{formatCOP(localExpenses)}</p>
                <p className="text-neutral-600 text-xs mt-1">{cancelledCount} canceladas</p>
              </div>
            </div>

            {/* Segunda fila */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Barbería" value={formatCOP(barberRevenue)} sub="Ingresos por cortes" color="red" />
              <StatCard label="Citas Hoy" value={filteredBookingsForStats.filter(b => b.date === getTodayDateString()).length} sub="Agendadas para hoy" color="blue" />
              <StatCard label="Completadas" value={completedCount} sub="Citas finalizadas" color="green" />
              <StatCard label="Trabajadores" value={workers.filter(w => w.active).length} sub="Activos" color="blue" />
            </div>

            {/* Alerta stock bajo mejorada */}
            {products.filter(p => (p.stock || 0) <= LOW_STOCK_THRESHOLD).length > 0 && (
              <div className="bg-red-500/8 border border-red-500/20 p-5 rounded-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-red-400 font-black text-sm uppercase tracking-wider">Stock bajo — Requiere atención</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {products.filter(p => (p.stock || 0) <= LOW_STOCK_THRESHOLD).map(p => (
                    <div key={p.id} className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3">
                      <p className="text-white text-xs font-bold truncate">{p.name}</p>
                      <p className="text-red-400 font-black text-lg">{p.stock}</p>
                      <p className="text-neutral-600 text-[9px] uppercase tracking-wider">unidades</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 shadow-md">
                <h3 className="text-white font-black text-lg mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-red-600 rounded-full"></span>
                  Servicios mas solicitados
                </h3>
                {topServices.length === 0
                  ? <p className="text-neutral-600 text-sm">Sin datos aun</p>
                  : topServices.map(([name, count], i) => (
                    <div key={name} className="flex items-center gap-3 mb-4">
                      <span className="text-neutral-600 font-bold text-sm w-5">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-white text-sm font-bold">{name}</span>
                          <span className="text-red-600 text-xs font-bold">{count} citas</span>
                        </div>
                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full" style={{ width: `${(count / bookings.length) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 shadow-md">
                <h3 className="text-white font-black text-lg mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                  Trabajadores mas activos
                </h3>
                {topWorkers.length === 0
                  ? <p className="text-neutral-600 text-sm">Sin datos aun</p>
                  : topWorkers.map(([name, count], i) => (
                    <div key={name} className="flex items-center gap-3 mb-4">
                      <span className="text-neutral-600 font-bold text-sm w-5">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-white text-sm font-bold">{name}</span>
                          <span className="text-blue-400 text-xs font-bold">{count} citas</span>
                        </div>
                        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / bookings.length) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 shadow-md">
              <h3 className="text-white font-black text-lg mb-5 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
                Estado de citas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} className={`border rounded-2xl p-4 text-center ${cfg.color} shadow-sm`}>
                    <p className="font-black text-2xl">{bookings.filter(b => b.status === key).length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">{cfg.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ──────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              {[
                ['all', 'Todas'],
                ['today', 'Hoy'],
                ['custom-day', 'Día Específico'],
                ['week', 'Esta semana'],
                ['month', 'Este mes']
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setBookingFilter(k)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
                    bookingFilter === k
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-neutral-800 text-neutral-500 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}

              {bookingFilter === 'custom-day' && (
                <input
                  type="date"
                  value={bookingCustomDate}
                  onChange={e => setBookingCustomDate(e.target.value)}
                  className="bg-neutral-800 border border-white/5 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-300 hover:text-white outline-none cursor-pointer focus:border-red-600 transition-all"
                />
              )}

              <span className="ml-auto text-neutral-500 text-xs font-bold">{filteredBookings.length} citas registradas</span>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-md">
              {loadingBookings ? (
                <div className="p-12 text-center text-neutral-500 flex flex-col items-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Cargando citas en tiempo real...</span>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">No hay citas en este periodo</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredBookings.map(bk => (
                    <div key={bk.id} className="p-6 hover:bg-white/2 transition-colors space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-black text-base">{bk.clientName}</p>
                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${STATUS_CONFIG[bk.status]?.color}`}>
                              {STATUS_CONFIG[bk.status]?.label}
                            </span>
                            <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black bg-red-600/10 text-red-500 border border-red-600/20 uppercase tracking-wider">Barbería</span>
                          </div>
                          <p className="text-neutral-400 text-sm font-medium">
                            Servicio: <span className="text-white font-bold">{bk.service}</span> — Barbero: <span className="text-white font-bold">{bk.workerName}</span>
                          </p>
                          <p className="text-neutral-500 text-xs font-bold">
                            Fecha: {bk.date} · Hora: {bk.time}
                          </p>
                          {bk.cancelReason && (
                            <p className="text-red-400 text-[10px] font-black uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded-lg inline-block mt-1 border border-red-500/20">
                              Motivo: {bk.cancelReason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                          <span className="text-red-600 font-black text-lg">{formatCOP(bk.servicePrice)}</span>
                          
                          <select
                            value={bk.status}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'cancelled') {
                                setCancelDialog({ bookingId: bk.id, nextStatus: val });
                              } else if (val === 'noshow') {
                                updateBookingStatus(bk.id, 'cancelled', 'Inasistencia del cliente');
                                showToast('✓ Cita cancelada por inasistencia');
                              } else {
                                updateBookingStatus(bk.id, val);
                                showToast('✓ Estado de cita actualizado');
                              }
                            }}
                            className="bg-neutral-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-red-600 cursor-pointer"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmada</option>
                            <option value="in_progress">En proceso</option>
                            <option value="completed">Finalizada</option>
                            <option value="cancelled">Cancelada</option>
                            <option value="noshow">No Asistió</option>
                          </select>

                          {['pending', 'confirmed', 'in_progress'].includes(bk.status) && (() => {
                            const clientPhone = bk.clientPhone || users.find(u => u.uid === bk.clientId)?.phone || '';
                            const reminderLink = getReminderLink(bk, clientPhone);
                            return reminderLink ? (
                              <a
                                href={reminderLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-green-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                              >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.953-4.464 9.956-9.956.002-2.661-1.034-5.163-2.918-7.047C16.426 1.716 13.92 1.678 12.02 1.678c-5.491 0-9.956 4.465-9.96 9.96-.001 1.772.476 3.5 1.38 5.02L2.502 21.58l4.145-1.087zm12.506-6.2c-.3-.149-1.772-.875-2.046-.975-.274-.1-.474-.149-.674.15-.2.3-.772.975-.947 1.173-.175.199-.35.224-.65.075-.3-.15-1.263-.465-2.407-1.485-.89-.793-1.49-1.772-1.665-2.07-.175-.3-.019-.463.13-.612.135-.133.3-.35.45-.525.15-.175.2-.299.3-.5.1-.2.05-.375-.025-.525-.075-.15-.674-1.622-.924-2.22-.243-.585-.49-.507-.674-.516-.174-.008-.374-.01-.574-.01-.2 0-.525.075-.799.375-.274.3-1.047 1.024-1.047 2.497 0 1.472 1.073 2.893 1.222 3.093.15.2 2.112 3.224 5.116 4.525.714.31 1.272.495 1.706.633.714.227 1.365.195 1.88.118.574-.087 1.772-.724 2.022-1.424.25-.699.25-1.299.175-1.424-.075-.125-.275-.199-.575-.349z"/>
                                </svg>
                                Recordar
                              </a>
                            ) : null;
                          })()}

                          <button onClick={() => handleDeleteBookingConfirm(bk.id)} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-red-500/10 cursor-pointer transition-all">Eliminar</button>
                        </div>
                      </div>
                      
                      {/* Mostrar observaciones */}
                      {bk.notes && (
                        <div className="bg-neutral-950/40 border border-white/5 rounded-2xl p-4">
                          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Observaciones adicionales</p>
                          <p className="text-neutral-300 text-sm mt-1 italic">"{bk.notes}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WORKERS ───────────────────────────────────── */}
        {tab === 'workers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-black text-xl">Gestion de Especialistas</h2>
              <button
                onClick={() => setEditingWorker({ name: '', specialty: '', phone: '', role: 'barber', percentage: '50', image: '', category: 'men', schedule: {}, branchId: 'branch-1' })}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-lg shadow-red-600/20 cursor-pointer transition-all"
              >
                Agregar Especialista
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map(w => (
                <div key={w.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-md hover:border-white/10 transition-all">
                  <div className="flex items-start gap-4">
                    <img src={w.image || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face&fm=webp&q=70'} className="w-16 h-16 rounded-2xl object-cover border border-white/10 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-black text-lg">{w.name}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${w.active !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {w.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-red-600 text-xs font-bold uppercase tracking-widest mt-1">{w.specialty}</p>
                      <p className="text-neutral-500 text-xs font-medium uppercase mt-0.5">Rol: {w.role === 'barber' ? 'Barbero' : w.role === 'stylist' ? 'Estilista' : 'Manicurista'}</p>
                      <p className="text-neutral-500 text-xs font-medium mt-1">
                        Barbería: <span className="text-neutral-300 font-bold">Barber Kalvin</span>
                      </p>
                      {w.phone && <p className="text-neutral-600 text-xs mt-1">Tel: {w.phone}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Comision: {w.percentage}%</span>
                    <button
                      onClick={() => setEditingWorker({ ...w, percentage: w.percentage?.toString() || '' })}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Editar Horarios y Datos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SERVICES ──────────────────────────────────── */}
        {tab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-black text-xl">Catalogo de Servicios</h2>
              <button
                onClick={() => setEditingService({ name: '', price: '', duration: '30', category: 'men', description: '', includes: '', image: '' })}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-lg shadow-red-600/20 cursor-pointer transition-all"
              >
                Agregar Servicio
              </button>
            </div>

            <div className="space-y-8">
              {/* Category Men */}
              {services.filter(s => s.category === 'men' || !s.category).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                    <span className="w-1.5 h-5 bg-red-600 rounded-full animate-pulse" />
                    <h3 className="text-white font-black text-sm uppercase tracking-widest">Barbería (Hombres)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.filter(s => s.category === 'men' || !s.category).map(s => (
                      <div key={s.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-md hover:border-white/10 transition-all">
                        <div className="flex items-start gap-4">
                          <img src={s.image} className="w-16 h-16 rounded-2xl object-cover border border-white/10 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white font-black text-lg truncate">{s.name}</p>
                            <p className="text-red-600 text-xs font-bold uppercase tracking-widest mt-0.5">{formatCOP(s.price)}</p>
                            <p className="text-neutral-500 text-xs font-medium uppercase mt-0.5">Seccion: Barbería</p>
                            <span className="inline-block bg-white/5 text-neutral-400 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase mt-2">{s.duration} min</span>
                          </div>
                        </div>
                        <div className="border-t border-white/5 pt-4 flex justify-end">
                          <button
                            onClick={() => setEditingService({ ...s, price: s.price?.toString() || '', duration: s.duration?.toString() || '' })}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Editar Detalles
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INVENTORY & FINANCES ─────────────────────────────────── */}
        {tab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-white font-black text-xl">Inventario y Finanzas</h2>
              <div className="flex bg-neutral-900 border border-white/5 rounded-2xl p-1 shadow-md">
                <button
                  onClick={() => setInventorySubTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                    inventorySubTab === 'products' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Productos
                </button>
                <button
                  onClick={() => setInventorySubTab('expenses')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                    inventorySubTab === 'expenses' ? 'bg-red-500 text-white shadow-sm' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Gastos
                </button>
                <button
                  onClick={() => setInventorySubTab('balance')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                    inventorySubTab === 'balance' ? 'bg-green-500 text-white shadow-sm' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Balance y Ventas
                </button>
              </div>
            </div>

            {inventorySubTab === 'products' && (
              <div className="space-y-4 animate-fade-in">
                {products.length === 0 && (
                  <div className="bg-red-600/10 border border-red-600/20 rounded-3xl p-6 text-center space-y-3 mb-6">
                    <p className="text-red-500 font-bold text-sm">Tu inventario está vacío.</p>
                    <p className="text-neutral-400 text-xs">Puedes cargar los productos base de la barbería para que aparezcan aquí y en la página principal.</p>
                    <button onClick={handleSyncProducts} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 transition-colors cursor-pointer mt-2 inline-block">
                      Cargar productos base
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-6 shadow-md flex flex-col space-y-3">
                      <img src={p.image || 'https://via.placeholder.com/150'} alt={p.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                      <h4 className="text-white font-black text-lg truncate">{p.name}</h4>
                      <p className="text-red-600 font-black text-base">{formatCOP(p.price)}</p>
                      <p className="text-neutral-400 text-sm">Stock: {p.stock}</p>
                      {p.stock <= LOW_STOCK_THRESHOLD && (
                        <span className="inline-block bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold uppercase mt-1">
                          Stock bajo
                        </span>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setEditingProduct({ ...p, price: p.price?.toString() || '', stock: p.stock?.toString() || '' })} className="flex-1 bg-red-600/10 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all cursor-pointer">Editar</button>
                        <button onClick={() => { setSellingProduct(p); setSellingQuantity('1'); }} className="flex-1 bg-green-500/10 text-green-400 py-2 rounded-xl text-xs font-bold hover:bg-green-500 hover:text-white transition-all cursor-pointer">Vender</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-500/10 text-red-400 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Eliminar">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-center border border-dashed border-white/20 rounded-3xl p-6 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setEditingProduct({ name: '', price: '', stock: '', image: '' })}>
                    <span className="text-neutral-500 text-sm font-bold uppercase">+ Agregar Producto</span>
                  </div>
                </div>
              </div>
            )}

            {inventorySubTab === 'expenses' && (
              <div className="space-y-4 animate-fade-in">
                {expenses.length === 0 ? (
                  <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-10 text-center">
                    <p className="text-neutral-500 text-sm">No hay gastos registrados.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expenses.map(e => (
                      <div key={e.id} className="bg-neutral-900 border border-white/5 rounded-3xl p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-white font-black text-sm line-clamp-2">{e.description}</p>
                            <p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-1 font-bold">
                              {e.date ? new Date(e.date.replace(/-/g, '/')).toLocaleDateString() : ''}
                            </p>
                          </div>
                          <p className="text-red-400 font-black text-lg bg-red-500/10 px-2.5 py-1 rounded-xl">-{formatCOP(e.amount)}</p>
                        </div>
                        <div className="flex gap-2 border-t border-white/5 pt-4">
                          <button onClick={() => setEditingExpense({ ...e, amount: e.amount?.toString() || '' })} className="flex-1 bg-red-600/10 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all cursor-pointer">Editar</button>
                          <button onClick={() => handleDeleteExpense(e.id)} className="flex-1 bg-red-500/10 text-red-400 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center border border-dashed border-white/20 rounded-3xl p-5 cursor-pointer hover:bg-white/5 transition-colors mt-4" onClick={() => setEditingExpense({ description: '', amount: '', branchId: 'all', date: getTodayDateString() })}>
                  <span className="text-neutral-500 text-sm font-bold uppercase">+ Agregar Gasto</span>
                </div>
              </div>
            )}

            {inventorySubTab === 'balance' && (
              <div className="space-y-6 animate-fade-in">
                {/* Filtros de Balance */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/40 p-5 rounded-3xl border border-white/5">
                  <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider">Filtrar Balance y Ventas</h3>
                    <p className="text-neutral-500 text-xs mt-0.5">Controla ingresos de productos, citas y egresos en un período determinado.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex flex-col space-y-1">
                      <span className="text-neutral-500 text-[9px] font-black uppercase tracking-widest pl-1">Desde</span>
                      <input
                        type="date"
                        value={balanceStartDate}
                        onChange={e => setBalanceStartDate(e.target.value)}
                        className="bg-neutral-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-neutral-300 outline-none focus:border-red-600 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-neutral-500 text-[9px] font-black uppercase tracking-widest pl-1">Hasta</span>
                      <input
                        type="date"
                        value={balanceEndDate}
                        onChange={e => setBalanceEndDate(e.target.value)}
                        className="bg-neutral-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-neutral-300 outline-none focus:border-red-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* KPIs del Balance */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-3xl p-5">
                    <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Ganancia Neta</p>
                    <p className={`font-black text-2xl mt-1 tracking-tight ${balanceNetProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCOP(balanceNetProfit)}
                    </p>
                    <p className="text-neutral-600 text-xs mt-1">Citas + Ventas - Gastos</p>
                  </div>
                  <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
                    <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Ingresos por Citas</p>
                    <p className="text-blue-400 font-black text-2xl mt-1 tracking-tight">
                      {formatCOP(balanceCitasRevenue)}
                    </p>
                    <p className="text-neutral-600 text-xs mt-1">{balanceCitasCount} citas completadas</p>
                  </div>
                  <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
                    <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Ventas de Productos</p>
                    <p className="text-red-500 font-black text-2xl mt-1 tracking-tight">
                      {formatCOP(balanceProductsRevenue)}
                    </p>
                    <p className="text-neutral-600 text-xs mt-1">{balanceSalesCount} transacciones</p>
                  </div>
                  <div className="bg-neutral-900 border border-white/5 rounded-3xl p-5">
                    <p className="text-neutral-400 text-[9px] font-black uppercase tracking-widest">Egresos / Gastos</p>
                    <p className="text-red-400 font-black text-2xl mt-1 tracking-tight">
                      {formatCOP(balanceExpensesAmount)}
                    </p>
                    <p className="text-neutral-600 text-xs mt-1">{balanceExpensesCount} egresos registrados</p>
                  </div>
                </div>

                {/* Historial de Ventas */}
                <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 shadow-md">
                  <h3 className="text-white font-black text-sm uppercase tracking-wider mb-4">Historial de Ventas</h3>
                  {periodSales.length === 0 ? (
                    <p className="text-neutral-500 text-xs text-center py-6">No hay ventas registradas en este período.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-neutral-500">
                            <th className="pb-3 pr-4">Fecha</th>
                            <th className="pb-3 pr-4">Producto</th>
                            <th className="pb-3 pr-4 text-center">Cantidad</th>
                            <th className="pb-3 pr-4 text-right">Precio Unit.</th>
                            <th className="pb-3 pr-4 text-right">Total</th>
                            <th className="pb-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {periodSales.map(sale => (
                            <tr key={sale.id} className="text-xs text-neutral-300 hover:bg-white/[0.01] transition-colors">
                              <td className="py-3.5 pr-4 whitespace-nowrap">
                                {sale.date ? new Date(typeof sale.date === 'string' && !sale.date.includes('T') ? sale.date.replace(/-/g, '/') : sale.date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin fecha'}
                              </td>
                              <td className="py-3.5 pr-4 font-semibold text-neutral-200">
                                {sale.productName}
                              </td>
                              <td className="py-3.5 pr-4 text-center font-bold text-neutral-100">
                                {sale.quantity}
                              </td>
                              <td className="py-3.5 pr-4 text-right text-neutral-400">
                                {formatCOP(sale.price)}
                              </td>
                              <td className="py-3.5 pr-4 text-right font-black text-green-400">
                                {formatCOP(sale.total)}
                              </td>
                              <td className="py-3.5 text-center">
                                <button
                                  onClick={() => handleRevertSale(sale.id)}
                                  className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                                  title="Revertir venta (devolver stock)"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                  Revertir
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        {/* ── REPORTES ──────────────────────────────────── */}
        {tab === 'reports' && <ReportsModule />}

        {/* ── COMISIONES ────────────────────────────────── */}
        {tab === 'commissions' && <CommissionsModule />}

        {/* ── PROMOCIONES ────────────────────────────────── */}
        {tab === 'promotions' && <PromotionsModule setConfirmDialog={setConfirmDialog} />}

        {/* ── ESTADO OPERATIVO / CIERRES ─────────────────── */}
        {tab === 'closures' && <ClosuresModule setConfirmDialog={setConfirmDialog} />}

        {/* ── CÓDIGO QR ──────────────────────────────────── */}
        {tab === 'qr' && (
          <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6">
            <QRModule />
          </div>
        )}

        {/* ── USERS ─────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-white font-black text-xl">Usuarios Registrados ({users.length})</h2>
            </div>

            {/* Buscador y Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all"
                />
              </div>
              <div className="flex gap-1 bg-neutral-900 border border-white/5 p-1 rounded-2xl overflow-x-auto">
                {[['all','Todos'],['client','Clientes'],['barber','Barberos'],['admin','Admins']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setUserRoleFilter(val)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                      userRoleFilter === val ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-white'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Resultados */}
            {(() => {
              const filtered = users.filter(u => {
                const matchesSearch = !userSearch.trim() ||
                  u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(userSearch.toLowerCase());
                const matchesRole = userRoleFilter === 'all' || (u.role || 'client') === userRoleFilter;
                return matchesSearch && matchesRole;
              });
              return (
                <>
                  <p className="text-neutral-500 text-xs font-bold">Mostrando {filtered.length} de {users.length} usuarios</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((u, i) => (
                <div key={u.uid || i} className="bg-neutral-900 border border-white/5 p-5 rounded-3xl flex flex-col justify-center gap-4 shadow-md hover:border-white/10 transition-all min-h-[150px]">
                  {/* Fila superior: avatar + info + acciones */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex-shrink-0 overflow-hidden border border-white/5">
                        {u.photoURL || u.image ? (
                          <img src={u.photoURL || u.image} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-red-600 text-lg">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-white font-black text-base truncate">{u.name}</p>
                        <p className="text-neutral-400 text-xs truncate">{u.email}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.phone && <span className="text-neutral-500 text-[10px] font-bold">Tel: {u.phone}</span>}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${u.active !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {u.active !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <label className="text-neutral-500 text-[9px] font-black uppercase tracking-wider hidden sm:inline">Rol:</label>
                        <select
                          value={u.role || 'client'}
                          onChange={(e) => updateUserRole(u.uid, e.target.value)}
                          className="bg-neutral-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/10 outline-none cursor-pointer focus:border-red-600"
                        >
                          <option value="client">Cliente</option>
                          <option value="admin">Administrador</option>
                          <option value="barber">Barbero</option>
                          
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateUserStatus(u.uid, u.active !== false ? false : true)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer w-full text-center ${
                            u.active !== false
                              ? 'bg-neutral-800 text-neutral-400 border-white/5 hover:text-red-400'
                              : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-white'
                          }`}
                        >
                          {u.active !== false ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                        </button>
                        <button onClick={() => handleDeleteUser(u.uid)} className="bg-red-500/10 text-red-400 p-1.5 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer border border-red-500/20" title="Borrar Usuario">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fila inferior: puntos de fidelidad (solo para clientes) */}
                  {(!u.role || u.role.toLowerCase() === 'client') && (() => {
                    const pts = u.points || 0;
                    const lvl = pts >= 1000 ? { name: 'Diamante', badge: '💎', color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-400/20', bar: '#b9f2ff', next: null }
                      : pts >= 500  ? { name: 'Oro',     badge: '🥇', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-400/20',  bar: '#FFD700',  next: 1000 }
                      : pts >= 200  ? { name: 'Plata',   badge: '🥈', color: 'text-neutral-300', bg: 'bg-neutral-500/10 border-neutral-400/20', bar: '#c0c0c0',  next: 500  }
                      : { name: 'Bronce', badge: '🥉', color: 'text-amber-600', bg: 'bg-amber-900/10 border-amber-700/20', bar: '#cd7f32', next: 200 };
                    const progress = lvl.next ? Math.min(((pts / lvl.next) * 100), 100) : 100;
                    const nearReward = lvl.next && (lvl.next - pts) <= 100;
                    return (
                      <div className={`rounded-2xl border p-3 space-y-2 ${lvl.bg}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{lvl.badge}</span>
                            <div>
                              <p className={`text-xs font-black ${lvl.color}`}>{lvl.name}</p>
                              <p className="text-neutral-500 text-[10px] font-bold">Fidelidad</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-black text-lg ${lvl.color}`}>{pts.toLocaleString('es-CO')}</p>
                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">puntos</p>
                          </div>
                        </div>
                        {lvl.next && (
                          <div className="space-y-1">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, background: lvl.bar }} />
                            </div>
                            <p className="text-[10px] text-neutral-500 font-bold text-right">
                              {(lvl.next - pts).toLocaleString('es-CO')} pts para el siguiente nivel
                            </p>
                          </div>
                        )}
                        {nearReward && (
                          <div className="bg-red-600/10 border border-red-600/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                            <span className="text-sm">🔥</span>
                            <p className="text-red-500 text-[10px] font-black">¡Le faltan solo {lvl.next - pts} pts para el siguiente nivel!</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

              ))}
              {users.length === 0 && <p className="text-neutral-500 text-sm">No hay usuarios registrados aun</p>}
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>

      {/* ── Worker Edit Modal ────────────────────────────── */}
      {editingWorker && (
        <EditModal title={editingWorker.id ? 'Editar Especialista' : 'Nuevo Especialista'} onClose={() => setEditingWorker(null)}>
          <FormField label="Nombre" value={editingWorker.name} onChange={v => setEditingWorker(p => ({ ...p, name: v }))} />
          <FormField label="Especialidad" value={editingWorker.specialty} onChange={v => setEditingWorker(p => ({ ...p, specialty: v }))} />
          <div>
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Rol</label>
            <select value={editingWorker.role} onChange={e => setEditingWorker(p => ({ ...p, role: e.target.value, category: e.target.value === 'barber' ? 'men' : 'women' }))}
              className="w-full bg-neutral-800 border border-white/5 rounded-xl p-3 text-white outline-none focus:border-red-600 text-sm font-medium">
              <option value="barber">Barbero</option>
              
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Telefono" value={editingWorker.phone} onChange={v => setEditingWorker(p => ({ ...p, phone: v }))} />
            <FormField label="Comision (%)" type="number" value={editingWorker.percentage} onChange={v => setEditingWorker(p => ({ ...p, percentage: v }))} />
          </div>
          
          {/* Subida de Imagenes */}
          <ImageUploadField label="Foto del Especialista" imageUrl={editingWorker.image} onUploadComplete={url => setEditingWorker(p => ({ ...p, image: url }))} />

          {/* Horarios de Trabajo */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <h4 className="text-white text-xs font-black uppercase tracking-widest">Horarios de Trabajo</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {DAYS_OF_WEEK.map(day => {
                const daySched = editingWorker.schedule?.[day];
                const active = !!daySched;
                return (
                  <div key={day} className="bg-neutral-800/40 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={e => handleDayCheck(day, e.target.checked)}
                          className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-neutral-900 w-4 h-4 cursor-pointer"
                        />
                        {DAY_LABELS[day]}
                      </label>
                      {active && (
                        <div className="flex items-center gap-1">
                          <input type="text" placeholder="08:00" value={daySched.start || '08:00'} onChange={e => handleDayTimeChange(day, 'start', e.target.value)} className="bg-neutral-900 border border-white/5 text-white text-[11px] rounded-lg px-2 py-1 w-14 text-center" />
                          <span className="text-neutral-500 text-xs">a</span>
                          <input type="text" placeholder="18:00" value={daySched.end || '18:00'} onChange={e => handleDayTimeChange(day, 'end', e.target.value)} className="bg-neutral-900 border border-white/5 text-white text-[11px] rounded-lg px-2 py-1 w-14 text-center" />
                        </div>
                      )}
                    </div>
                    {/* Horario de almuerzo */}
                    {active && (
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-neutral-600 text-[10px] font-bold uppercase tracking-wider w-16">Almuerzo:</span>
                        <input
                          type="text"
                          placeholder="12:00"
                          value={daySched.lunchStart || ''}
                          onChange={e => handleDayTimeChange(day, 'lunchStart', e.target.value)}
                          className="bg-neutral-900 border border-white/8 text-neutral-300 text-[11px] rounded-lg px-2 py-1 w-14 text-center placeholder:text-neutral-700"
                        />
                        <span className="text-neutral-600 text-xs">a</span>
                        <input
                          type="text"
                          placeholder="13:00"
                          value={daySched.lunchEnd || ''}
                          onChange={e => handleDayTimeChange(day, 'lunchEnd', e.target.value)}
                          className="bg-neutral-900 border border-white/8 text-neutral-300 text-[11px] rounded-lg px-2 py-1 w-14 text-center placeholder:text-neutral-700"
                        />
                        {(daySched.lunchStart || daySched.lunchEnd) && (
                          <button onClick={() => { handleDayTimeChange(day, 'lunchStart', ''); handleDayTimeChange(day, 'lunchEnd', ''); }} className="text-neutral-600 hover:text-red-400 transition-colors cursor-pointer" title="Quitar almuerzo">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {editingWorker.id && <button onClick={() => handleDeleteWorker(editingWorker.id)} className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">Eliminar</button>}
            <button onClick={() => handleSaveWorker(editingWorker)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all cursor-pointer">Guardar</button>
          </div>
        </EditModal>
      )}

      {/* ── Service Edit Modal ───────────────────────────── */}
      {editingService && (
        <EditModal title={editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'} onClose={() => setEditingService(null)}>
          <FormField label="Nombre" value={editingService.name} onChange={v => setEditingService(p => ({ ...p, name: v }))} />
          <div>
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Categoria</label>
            <select value={editingService.category} onChange={e => setEditingService(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-neutral-800 border border-white/5 rounded-xl p-3 text-white outline-none focus:border-red-600 text-sm font-medium">
              <option value="men">Barberia (Hombres)</option>
              
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precio ($)" type="number" value={editingService.price} onChange={v => setEditingService(p => ({ ...p, price: v }))} />
            <FormField label="Duracion (min)" type="number" value={editingService.duration} onChange={v => setEditingService(p => ({ ...p, duration: v }))} />
          </div>
          <FormField label="Descripcion" value={editingService.description} onChange={v => setEditingService(p => ({ ...p, description: v }))} />
          <FormField label="Incluye" value={editingService.includes} onChange={v => setEditingService(p => ({ ...p, includes: v }))} />
          
          {/* Subida de Imagenes */}
          <ImageUploadField label="Foto del Servicio" imageUrl={editingService.image} onUploadComplete={url => setEditingService(p => ({ ...p, image: url }))} />

          <div className="flex gap-3 pt-2">
            {editingService.id && <button onClick={() => handleDeleteService(editingService.id)} className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">Eliminar</button>}
            <button onClick={() => handleSaveService(editingService)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all cursor-pointer">Guardar</button>
          </div>
        </EditModal>
      )}

      {/* ── Product Edit Modal ───────────────────────────── */}
      {editingProduct && (
        <EditModal title={editingProduct.id ? 'Editar Producto' : 'Nuevo Producto'} onClose={() => setEditingProduct(null)}>
          <FormField label="Nombre" value={editingProduct.name} onChange={v => setEditingProduct(p => ({ ...p, name: v }))} />
          <div>
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Descripcion</label>
            <textarea
              value={editingProduct.description || ''}
              onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))}
              placeholder="Descripcion del producto..."
              rows={2}
              className="w-full bg-neutral-800 border border-white/5 rounded-xl p-3 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all text-sm font-medium resize-none"
            />
          </div>
          <div>
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Categoria</label>
            <select value={editingProduct.category || 'capilar'} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-neutral-800 border border-white/5 rounded-xl p-3 text-white outline-none focus:border-red-600 text-sm font-medium">
              <option value="capilar">Cuidado Capilar</option>
              <option value="maquinas">Maquinas</option>
              <option value="accesorios">Accesorios</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Precio ($)" type="number" value={editingProduct.price} onChange={v => setEditingProduct(p => ({ ...p, price: v }))} />
            <FormField label="Stock" type="number" value={editingProduct.stock} onChange={v => setEditingProduct(p => ({ ...p, stock: v }))} />
          </div>
          <ImageUploadField label="Foto del Producto" imageUrl={editingProduct.image} onUploadComplete={url => setEditingProduct(p => ({ ...p, image: url }))} />
          <div className="flex gap-3 pt-2">
            {editingProduct.id && <button onClick={() => handleDeleteProduct(editingProduct.id)} className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">Eliminar</button>}
            <button onClick={() => setEditingProduct(null)} className="bg-neutral-800 text-neutral-400 px-4 py-3 rounded-xl font-bold hover:bg-neutral-700 transition-all cursor-pointer">Cancelar</button>
            <button onClick={() => handleSaveProduct(editingProduct)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all cursor-pointer">Guardar</button>
          </div>
        </EditModal>
      )}

      {/* ── Expense Edit Modal ───────────────────────────── */}
      {editingExpense && (
        <EditModal title={editingExpense.id ? 'Editar Gasto' : 'Nuevo Gasto'} onClose={() => setEditingExpense(null)}>
          <FormField label="Descripcion" value={editingExpense.description} onChange={v => setEditingExpense(p => ({ ...p, description: v }))} />
          <FormField label="Monto ($)" type="number" value={editingExpense.amount} onChange={v => setEditingExpense(p => ({ ...p, amount: v }))} />
          <div className="space-y-1 mb-4">
            <label className="text-neutral-500 text-[10px] font-black uppercase tracking-widest block font-bold">Fecha</label>
            <input
              type="date"
              value={editingExpense.date ? editingExpense.date.split('T')[0] : ''}
              onChange={e => setEditingExpense(p => ({ ...p, date: e.target.value }))}
              className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3 text-white text-sm focus:border-red-600/50 outline-none transition-all cursor-pointer font-bold"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditingExpense(null)} className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">Cancelar</button>
            <button onClick={async () => { 
              const formattedExpense = {
                ...editingExpense,
                amount: Number(editingExpense.amount) || 0,
                branchId: editingExpense.branchId || 'all',
                date: editingExpense.date || getTodayDateString()
              };
              if (editingExpense.id) await updateExpense(editingExpense.id, formattedExpense);
              else await addExpense(formattedExpense);
              setEditingExpense(null);
            }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all cursor-pointer">Guardar</button>
          </div>
        </EditModal>
      )}

      {/* ── Sell Product Modal ───────────────────────────── */}
      {sellingProduct && (
        <EditModal title="Vender Producto" onClose={() => setSellingProduct(null)}>
          <FormField label="Cantidad" type="number" value={sellingQuantity} onChange={v => setSellingQuantity(v)} />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setSellingProduct(null)} className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">Cancelar</button>
            <button onClick={async () => { await sellProduct(sellingProduct.id, Number(sellingQuantity) || 1, 'branch-1'); setSellingProduct(null); }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all cursor-pointer">Confirmar Venta</button>
          </div>
        </EditModal>
      )}
    </div>
  );
}

export default AdminDashboard;
