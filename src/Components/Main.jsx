function Hero({ onBookingClick }) {
  const handleScrollToCatalog = (e) => {
    e.preventDefault();
    const el = document.getElementById("catalogo");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="inicio" className="flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 py-16 md:py-24 gap-12 md:gap-16 max-w-7xl mx-auto min-h-[70vh] md:min-h-[85vh] relative">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-red-600/10 blur-[120px] rounded-full animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-white/5 blur-[150px] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      {/* Lado Izquierdo: Nombre de la Barbería */}
      <div className="flex-1 space-y-6 md:space-y-8 text-center md:text-left z-10">
        <div className="space-y-3">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
            <img src="/logo.png" alt="Barber Kalvin" className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-white/15 shadow-2xl" />
            <div className="text-left">
              <span className="text-red-500 font-black tracking-[0.3em] uppercase text-xs block">
                Barbería Profesional
              </span>
              <span className="text-neutral-400 text-[11px] tracking-widest uppercase font-bold">
                Estilo · Pasión · Precisión
              </span>
            </div>
          </div>
          <h1
            className="text-white text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            BARBER <span className="text-red-500">KALVIN</span>
          </h1>
        </div>
        
        <p className="text-neutral-400 text-base sm:text-lg max-w-md mx-auto md:mx-0 leading-relaxed font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Donde el estilo clásico se encuentra con la precisión moderna. Cortes, diseño de barba y tratamientos exclusivos para el caballero exigente.
        </p>
        
        <div className="pt-2 md:pt-4 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center md:justify-start">
          <button 
            onClick={onBookingClick}
            className="bg-red-600 hover:bg-red-700 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black transition-all shadow-[0_15px_35px_rgba(158,28,34,0.35)] active:scale-95 cursor-pointer text-sm sm:text-base uppercase tracking-widest"
          >
            RESERVAR AHORA
          </button>
          <a 
            href="#catalogo"
            onClick={handleScrollToCatalog}
            className="group border-2 border-white/10 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black hover:bg-white hover:text-black transition-all active:scale-95 flex items-center justify-center text-sm sm:text-base uppercase tracking-widest gap-2"
          >
            CATÁLOGO
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
 
      {/* Lado Derecho: Imagen */}
      <div className="flex-1 relative w-full max-w-lg md:max-w-xl animate-float">
        <div className="absolute -inset-4 bg-red-600/20 blur-[100px] rounded-full animate-pulse-glow"></div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-white/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <img
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=1000&fit=crop&fm=webp&q=70"
            alt="Barber Shop Interior"
            className="relative rounded-[2rem] shadow-2xl border border-white/10 object-cover w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] z-10"
          />
          <div className="absolute -bottom-6 -left-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-20 hidden sm:block transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <p className="text-black font-black text-2xl md:text-4xl leading-none">10+</p>
            <p className="text-neutral-500 font-bold text-xs md:text-sm uppercase tracking-widest">Años de Arte</p>
          </div>
          
          <div className="absolute top-10 -right-10 bg-red-600 p-6 md:p-8 rounded-[2rem] shadow-[0_30px_60px_rgba(249,115,22,0.3)] z-20 hidden lg:block transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <p className="text-white font-black text-2xl md:text-4xl leading-none">5.0</p>
            <p className="text-white/80 font-bold text-xs md:text-sm uppercase tracking-widest">Rating VIP</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
