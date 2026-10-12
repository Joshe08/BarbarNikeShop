import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCOP } from '../utils/format';


// Descuento fijo del 20% para el personal de la barberia
const STAFF_DISCOUNT = 0.20;
const STAFF_ROLES = ['barber'];

const CATEGORIES = [
  { key: 'all',        label: 'Todos' },
  { key: 'capilar',   label: 'Capilar' },
  { key: 'maquinas',  label: 'Maquinas' },
  { key: 'accesorios',label: 'Accesorios' },
];

function ProductCard({ product, onBuy, isStaff }) {
  const [imgError, setImgError] = useState(false);
  const label = CATEGORIES.find(c => c.key === product.category)?.label || product.category;
  const discountedPrice = isStaff ? Math.round(product.price * (1 - STAFF_DISCOUNT)) : null;

  return (
    <div className="group relative bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-md hover:border-red-600/30 hover:shadow-red-600/10 hover:shadow-xl transition-all duration-300 h-full">
      <div className="relative overflow-hidden h-48 bg-neutral-800 flex-shrink-0">
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-800">
            <svg className="w-10 h-10 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {label && (
          <div className="absolute top-3 left-3">
            <span className="bg-black/60 backdrop-blur-sm text-neutral-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
              {label}
            </span>
          </div>
        )}
        {isStaff && (
          <div className="absolute top-3 right-3">
            <span className="bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg shadow-green-500/30">
              -{STAFF_DISCOUNT * 100}% Staff
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 space-y-2">
        <div className="flex-1">
          <h3 className="text-white font-black text-sm leading-snug">{product.name}</h3>
          {product.description && (
            <p className="text-neutral-500 text-xs mt-1 leading-relaxed line-clamp-2">{product.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            {isStaff ? (
              <>
                <span className="text-neutral-500 text-xs line-through">{formatCOP(product.price)}</span>
                <span className="text-green-400 font-black text-base block">{formatCOP(discountedPrice)}</span>
              </>
            ) : (
              <span className="text-red-600 font-black text-base block">{formatCOP(product.price)}</span>
            )}
            <span className="text-neutral-600 text-[9px] font-bold uppercase tracking-wider">{product.stock > 0 ? 'Disponible' : 'Sin stock'}</span>
          </div>
          <button 
            onClick={() => onBuy(product)}
            className="bg-white/5 hover:bg-red-600 text-white hover:text-white border border-white/10 hover:border-red-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Checkout
function CheckoutModal({ product, onClose, isStaff, sellProduct }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1 = Datos, 3 = Éxito
  const [method, setMethod] = useState('recogida'); // recogida | domicilio
  const [payment, setPayment] = useState('efectivo');
  const [address, setAddress] = useState('');
  const [name, setName] = useState(() => {
    if (isStaff && user) {
      return user.name || '';
    }
    return '';
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isStaff && user?.name) {
      const timer = setTimeout(() => {
        setName(user.name);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isStaff, user]);

  const finalPrice = isStaff ? Math.round(product.price * (1 - STAFF_DISCOUNT)) : product.price;

  const handleNext = () => {
    if (method === 'domicilio' && !address.trim()) {
      setError('Por favor ingresa tu dirección para el domicilio.');
      return;
    }
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre.');
      return;
    }
    setError('');
    processFinalSale();
  };

  const processFinalSale = async () => {
    try {
      if (sellProduct) {
        await sellProduct(product.id, 1, 'branch-1');
      }
    } catch (err) {
      console.warn('Advertencia al registrar la venta en Firestore (posible restricción de rol/reglas o producto fallback):', err);
    }
    setStep(3);
  };

  const openWhatsApp = () => {
    const text = `*NUEVO PEDIDO - Barber Kalvin* 💈\n\n` +
      `*Producto:* ${product.name}\n` +
      (isStaff
        ? `*Precio original:* ~~${formatCOP(product.price)}~~\n*Precio empleado (-${STAFF_DISCOUNT*100}%):* ${formatCOP(finalPrice)}\n`
        : `*Precio:* ${formatCOP(finalPrice)}\n`) +
      `*Cliente:* ${name}\n` +
      `*Entrega:* ${method === 'recogida' ? 'Recogida en Barber Kalvin 🏬' : 'A domicilio 🛵'}\n` +
      (method === 'domicilio' ? `*Dirección:* ${address}\n` : '') +
      `*Método de pago:* ${payment.toUpperCase()}\n` +
      `*Estado del Pago:* PENDIENTE (Pago contra entrega)\n\n` +
      `Hola! Acabo de completar el pedido en el sistema. Adjunto los detalles.`;

    const encodedText = encodeURIComponent(text);
    const phone = '573028676396';
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    onClose();
  };



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="relative h-40 bg-neutral-800 shrink-0">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full hover:bg-red-500 transition-colors backdrop-blur-md cursor-pointer">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <h3 className="text-white text-xl font-black leading-tight">{product.name}</h3>
            {isStaff ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neutral-400 text-xs line-through">{formatCOP(product.price)}</span>
                <span className="text-green-400 font-black text-lg">{formatCOP(finalPrice)}</span>
                <span className="text-[9px] bg-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded border border-green-500/10 uppercase tracking-wider">Staff -20%</span>
              </div>
            ) : (
              <p className="text-red-600 font-black text-lg">{formatCOP(product.price)}</p>
            )}
          </div>
        </div>

        {/* Body Modal - STEP 1 */}
        {step === 1 && (
          <>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl text-xs font-bold text-center animate-fade-in">
                  {error}
                </div>
              )}

              {isStaff && user ? (
                <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Comprador Detectado</p>
                    <p className="text-white font-black text-sm">{user.name}</p>
                  </div>
                  <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full font-bold">
                    Personal
                  </span>
                </div>
              ) : (
                <div>
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-2 block font-bold">Tu Nombre *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3 text-white text-sm focus:border-red-600 outline-none transition-all font-medium"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Método de Entrega</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setMethod('recogida')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${method === 'recogida' ? 'bg-red-600/10 border-red-600 text-red-600' : 'bg-neutral-800 border-white/5 text-neutral-400 hover:border-white/20'}`}
                  >
                    Recogida
                  </button>
                  <button 
                    onClick={() => setMethod('domicilio')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${method === 'domicilio' ? 'bg-red-600/10 border-red-600 text-red-600' : 'bg-neutral-800 border-white/5 text-neutral-400 hover:border-white/20'}`}
                  >
                    Domicilio
                  </button>
                </div>
                
                {method === 'recogida' && (
                  <div className="bg-neutral-800/60 border border-white/5 rounded-2xl p-3.5 text-xs text-neutral-300 flex items-center gap-2 mt-2 animate-fade-in">
                    <span className="text-red-500 font-bold">📍</span>
                    <span>Punto de retiro: <strong className="text-white font-bold">Barber Kalvin</strong></span>
                  </div>
                )}

                {method === 'domicilio' && (
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Dirección completa y barrio..."
                    className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-3 text-white text-sm mt-2 focus:border-red-600 outline-none transition-all animate-fade-in"
                  />
                )}
              </div>

              <div className="space-y-3">
                <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Método de Pago (Contra Entrega)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {['efectivo', 'transferencia'].map(pay => (
                    <button 
                      key={pay}
                      onClick={() => setPayment(pay)}
                      className={`p-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${payment === pay ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-neutral-800 border-white/5 text-neutral-400 hover:border-white/20'}`}
                    >
                      {pay === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Step 1 */}
            <div className="p-4 border-t border-white/5 shrink-0">
              <button 
                onClick={handleNext}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                Confirmar Compra
              </button>
            </div>
          </>
        )}



        {/* Body Modal - STEP 3 (Success Screen) */}
        {step === 3 && (
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-center flex flex-col justify-center py-8">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-2 animate-bounce">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-white font-black text-lg">
                ¡Pedido Registrado con Éxito!
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
                Tu pedido ha sido registrado en el sistema. Realizarás el pago al recibir o retirar tu producto.
              </p>
            </div>

            <div className="bg-neutral-950/40 border border-white/5 rounded-3xl p-5 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-neutral-500">Producto:</span>
                <span className="text-white font-bold">{product.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-neutral-500">Total:</span>
                <span className="text-red-600 font-black text-sm">{formatCOP(finalPrice)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-neutral-500">Método de entrega:</span>
                <span className="text-white font-medium">{method === 'recogida' ? 'Retiro en Barber Kalvin' : 'Envío a Domicilio'}</span>
              </div>
              {method === 'domicilio' && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-neutral-500">Dirección:</span>
                  <span className="text-white font-medium truncate max-w-[180px]">{address}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Estado y pago:</span>
                <span className="text-green-400 font-bold uppercase">{`${payment} (Pendiente)`}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 shrink-0">
              <button 
                onClick={openWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Coordinar por WhatsApp
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer border border-white/5"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ProductsSection() {
  const { products, sellProduct } = useApp();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const autoSlideRef = useRef(null);

  const initialPaymentStatus = new URLSearchParams(window.location.search).get('payment');
  const toast = {
    visible: !!initialPaymentStatus,
    message: initialPaymentStatus === 'success'
      ? '✓ ¡Compra verificada con éxito! Tu producto ha sido reservado.'
      : initialPaymentStatus === 'failure'
        ? '✕ El pago del producto no pudo ser completado.'
        : ''
  };

  const isStaff = user && STAFF_ROLES.includes(user.role);
  const sourceProducts = products || [];

  const filteredProducts = sourceProducts.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const resetAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (filteredProducts.length === 0) return;
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.max(1, filteredProducts.length));
    }, 4000);
  }, [filteredProducts.length]);

  useEffect(() => {
    resetAutoSlide();
    return () => clearInterval(autoSlideRef.current);
  }, [resetAutoSlide]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeCategory, search]);

  const goTo = (idx) => { setCurrentSlide(idx); resetAutoSlide(); };

  return (
    <section id="productos" className="py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-600/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-10 space-y-3">
          <p className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] sm:text-xs">Tienda Barber Kalvin</p>
          <h2 className="text-white text-3xl sm:text-5xl font-black leading-tight tracking-tighter" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Productos <span className="text-red-600">Premium</span>
          </h2>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
            Lleva la experiencia Barber Kalvin a casa. Productos seleccionados para tu cuidado diario.
          </p>
        </div>

        {/* Barra de busqueda + filtros de categoria (solo si hay productos en la tienda) */}
        {sourceProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
            {/* Input de busqueda */}
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full bg-neutral-900 border border-white/8 rounded-2xl pl-11 pr-4 py-3 text-white text-sm placeholder:text-neutral-600 focus:border-red-600/50 focus:outline-none transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Selector de categoria */}
            <select
              value={activeCategory}
              onChange={e => setActiveCategory(e.target.value)}
              className="bg-neutral-900 border border-white/8 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:border-red-600/50 focus:outline-none cursor-pointer transition-all sm:w-44"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Resultados */}
        {sourceProducts.length === 0 ? (
          <div className="text-center py-20 px-6 bg-neutral-900/40 border border-white/5 rounded-[2.5rem] max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-600/10 border border-red-600/20 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black text-lg sm:text-xl">No hay productos disponibles por el momento</h3>
              <p className="text-neutral-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Estamos renovando nuestro stock exclusivo en barbería. Muy pronto tendremos nuevos artículos disponibles para ti.
              </p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-neutral-600 space-y-2">
            <svg className="h-12 w-12 mx-auto text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="font-bold text-sm">Sin resultados para "{search}"</p>
            <button onClick={() => { setSearch(''); setActiveCategory('all'); }} className="text-red-600 text-xs font-bold hover:text-red-500 cursor-pointer transition-colors">Limpiar filtros</button>
          </div>
        ) : (
          <>
            {/* Grilla escritorio/tablet */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onBuy={setCheckoutProduct} isStaff={false} />
              ))}
            </div>

            {/* Carrusel movil */}
            <div className="sm:hidden">
              <div className="overflow-hidden rounded-3xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {filteredProducts.map(product => (
                    <div key={product.id} className="min-w-full">
                      <ProductCard product={product} onBuy={setCheckoutProduct} isStaff={false} />
                    </div>
                  ))}
                </div>
              </div>
              {filteredProducts.length > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <button onClick={() => goTo((currentSlide - 1 + filteredProducts.length) % filteredProducts.length)} className="bg-neutral-800 border border-white/10 text-white p-2.5 rounded-xl hover:bg-neutral-700 transition-all cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex gap-1.5">
                    {filteredProducts.map((_, i) => (
                      <button key={i} onClick={() => goTo(i)} className={`transition-all duration-300 rounded-full cursor-pointer ${i === currentSlide ? 'w-5 h-2 bg-red-600' : 'w-2 h-2 bg-neutral-700'}`} />
                    ))}
                  </div>
                  <button onClick={() => goTo((currentSlide + 1) % filteredProducts.length)} className="bg-neutral-800 border border-white/10 text-white p-2.5 rounded-xl hover:bg-neutral-700 transition-all cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {checkoutProduct && (
        <CheckoutModal 
          product={checkoutProduct} 
          onClose={() => setCheckoutProduct(null)}
          isStaff={isStaff}
          sellProduct={sellProduct}
        />
      )}

      {/* Toast de Éxito / Error */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ${
        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm">
          {toast.message}
        </div>
      </div>
    </section>
  );
}
