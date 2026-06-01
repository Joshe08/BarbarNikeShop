import { useState } from "react";
import Header from "./Header";
import Hero from "../Components/Main";
import Catalog from "../Components/Catalog";
import ProductsSection from "../Components/ProductsSection";
import BookingModal from "../Components/BookingModal";
import Footer from "../Components/Footer";

function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);

  const handleBookService = (service) => {
    setPreselectedService(service);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setPreselectedService(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 overflow-x-hidden selection:bg-orange-500 selection:text-white pt-[76px]">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      {/* Contenido principal */}
      <main>
        <Hero onBookingClick={() => setIsBookingOpen(true)} />
        <ProductsSection />
        <Catalog onBookingClick={() => setIsBookingOpen(true)} onBookService={handleBookService} />

        {/* CTA Section */}
        <section id="reserva" className="py-24 sm:py-32 px-4 sm:px-8 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500/5 blur-[120px] rounded-full animate-pulse-glow"></div>
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 sm:p-16 text-center space-y-8 md:space-y-10 shadow-2xl">
              <div className="space-y-4">
                <h2 className="text-white text-3xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tighter">
                  ¿Listo para un <span className="text-orange-500 underline decoration-orange-500/30 underline-offset-8">cambio?</span>
                </h2>
                <p className="text-neutral-400 text-base sm:text-xl max-w-xl mx-auto leading-relaxed">
                  Reserva tu cita ahora y vive la experiencia premium de BarberNike Shop. Calidad garantizada en cada corte.
                </p>
              </div>
              
              <button
                onClick={() => setIsBookingOpen(true)}
                className="group relative inline-flex items-center justify-center bg-orange-500 text-white px-10 sm:px-14 py-5 sm:py-6 rounded-2xl font-black text-lg sm:text-xl hover:bg-orange-600 transition-all hover:scale-105 shadow-[0_20px_50px_rgba(249,115,22,0.4)] cursor-pointer overflow-hidden"
              >
                <span className="relative z-10 uppercase tracking-widest">RESERVAR MI LUGAR</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </section>
      </main>

      <BookingModal isOpen={isBookingOpen} onClose={handleCloseBooking} preselectedService={preselectedService} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;
