function Footer() {
  const whatsappMsg = encodeURIComponent("Hola, Barber Kalvin. Quiero obtener información sobre sus servicios y horarios.");
  const socialLinks = [
    { label: 'Instagram', url: 'https://www.instagram.com/barberkalvin/' },
    { label: 'WhatsApp', url: `https://wa.me/573028676396?text=${whatsappMsg}` }
  ];

  const openingHours = [
    { days: 'Lunes a Sabado', hours: '09:30 AM - 07:30 PM' },
    { days: 'Domingos y Festivos', hours: '10:00 AM - 03:30 PM' }
  ];

  return (
    <footer className="bg-[#0a0f1d] border-t border-white/5 px-6 sm:px-8 py-16 sm:py-24 relative overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 blur-[120px] rounded-full -mb-32 -ml-32"></div>
      
      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
        
        {/* Info Column */}
        <div className="space-y-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start text-white text-2xl sm:text-3xl font-black tracking-tight">
            <span>BARBER <span className="text-red-500">KALVIN</span></span>
          </div>
          <p className="text-neutral-400 text-sm max-w-sm mx-auto md:mx-0 leading-relaxed font-medium">
            Elevando el estándar de la barbería y el estilismo clásico con un enfoque moderno, premium y exclusivo en cada detalle.
          </p>
          <div className="flex justify-center md:justify-start gap-4">
            {socialLinks.map(social => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-neutral-900 border border-white/10 hover:border-red-600/50 px-4 py-2.5 rounded-xl shadow-sm"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        {/* Hours Column */}
        <div className="space-y-6 text-center md:text-left">
          <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
            <span className="w-1.5 h-3 bg-red-600 rounded-full"></span>
            Horarios de Atencion
          </h4>
          <div className="space-y-3">
            {openingHours.map((schedule, idx) => (
              <div key={idx} className="bg-neutral-950/40 border border-white/5 p-4 rounded-2xl max-w-xs mx-auto md:mx-0">
                <p className="text-white text-xs font-bold uppercase tracking-wider">{schedule.days}</p>
                <p className="text-red-600 text-sm font-black mt-1">{schedule.hours}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Column */}
        <div className="space-y-6 text-center md:text-left">
          <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
            <span className="w-1.5 h-3 bg-red-600 rounded-full"></span>
            Contacto y Ubicacion
          </h4>
          <div className="space-y-4 text-sm text-neutral-400 font-medium">
            <div className="bg-neutral-950/40 border border-white/5 p-4 rounded-2xl max-w-xs mx-auto md:mx-0 text-xs space-y-3 leading-relaxed">
              <p>
                <span className="text-white font-bold block uppercase tracking-wider mb-1">Direccion:</span>
                Calle 6C #16-105 B/Pontevedra, Bogota, Colombia
              </p>
              <p>
                <span className="text-white font-bold block uppercase tracking-wider mb-1">Telefono / WhatsApp:</span>
                +57 302 8676396
              </p>
              <p>
                <span className="text-white font-bold block uppercase tracking-wider mb-1">Email:</span>
                contacto@barberkalvin.com
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-16 sm:mt-24 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">Copyright © 2026 Barber Kalvin</p>
        <p className="text-neutral-500 text-xs font-medium">Todos los derechos reservados. Bogota, Colombia.</p>
      </div>
    </footer>
  );
}

export default Footer;
