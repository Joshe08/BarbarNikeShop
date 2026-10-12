import { useState, useRef, useEffect } from "react";

function Hero({ onBookingClick }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const videoRef = useRef(null);
  const playCountRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Sincronizar estado inicial
    video.muted = true;
    setIsMuted(true);

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => setIsMuted(video.muted);

    const onEnded = () => {
      playCountRef.current += 1;
      if (playCountRef.current < 2) {
        // Segunda reproducción permitida
        video.currentTime = 0;
        video.play().catch(() => setIsPlaying(false));
      } else {
        // Máximo 2 reproducciones alcanzadas: detener y esperar interacción manual
        video.pause();
        setIsPlaying(false);
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ended", onEnded);

    // Iniciar primera reproducción automática (muteada para respetar políticas del navegador)
    video.play().catch(() => {
      setIsPlaying(false);
    });

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggleSound = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;

    setAudioError(false);
    if (video.muted) {
      // Intentar desmutear
      video.muted = false;
      video.volume = 1;
      setIsMuted(false);
      // Si el video estaba pausado o se bloquea el play con audio
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn("Autoplay with sound prevented by browser:", err);
          // Si el navegador bloqueó la reproducción con sonido
          video.muted = true;
          setIsMuted(true);
          setAudioError(true);
          setTimeout(() => setAudioError(false), 3000);
        });
      }
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <section id="inicio" className="flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 py-16 md:py-24 gap-12 lg:gap-16 max-w-7xl mx-auto min-h-[70vh] md:min-h-[85vh] relative">
      {/* Decorative Barber Pole Glows */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-red-600/10 blur-[130px] rounded-full animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-600/10 blur-[150px] rounded-full animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Lado Izquierdo: Identidad y Botones de Acción */}
      <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left z-10 w-full">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]">
              Barbería Profesional Exclusiva
            </span>
          </div>

          <h1
            className="text-white text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            BARBER <span className="text-red-500">KALVIN</span>
          </h1>

          <p className="text-neutral-400 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-red-500/90">
            Estilo · Precisión · Confianza
          </p>
        </div>
        
        <p className="text-neutral-300 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Donde el estilo clásico se encuentra con la precisión moderna. Cortes vanguardistas, ritual de barba y una experiencia de primera clase diseñada para ti.
        </p>
        
        <div className="pt-2 md:pt-4 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
          <button 
            onClick={onBookingClick}
            className="bg-red-600 hover:bg-red-700 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black transition-all shadow-[0_15px_35px_rgba(220,38,38,0.35)] active:scale-95 cursor-pointer text-sm sm:text-base uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            AGENDAR CITA
          </button>
          <a 
            href="#catalogo"
            onClick={handleScrollToCatalog}
            className="group border-2 border-white/10 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black hover:bg-white hover:text-black transition-all active:scale-95 flex items-center justify-center text-sm sm:text-base uppercase tracking-widest gap-2"
          >
            CONOCER NUESTROS SERVICIOS
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
 
      {/* Lado Derecho: Video Promocional Barber Kalvin */}
      <div className="flex-1 relative w-full max-w-lg lg:max-w-xl">
        <div className="absolute -inset-4 bg-gradient-to-tr from-red-600/20 via-blue-600/10 to-transparent blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="relative group rounded-[2.5rem] overflow-hidden border border-white/15 bg-neutral-900 shadow-2xl shadow-black/80">
          {/* Overlay de gradiente para contraste y estilo cine */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-black/30 pointer-events-none z-10" />

          {/* Video element (sin loop infinito, controlado por playCountRef hasta 2 reproducciones) */}
          <video
            ref={videoRef}
            src="/video/barber-kalvin.mp4"
            autoPlay
            muted={isMuted}
            playsInline
            preload="auto"
            className="w-full h-[420px] sm:h-[500px] md:h-[560px] object-cover block cursor-pointer transition-transform duration-700 group-hover:scale-[1.01]"
            onClick={togglePlay}
          />

          {/* Badge superior "Video Oficial" */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-white text-[10px] font-black uppercase tracking-widest">
              Barber Kalvin Live
            </span>
          </div>

          {/* Feedback si el navegador bloquea audio */}
          {audioError && (
            <div className="absolute top-4 right-4 z-20 bg-red-600/90 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg border border-red-400 animate-bounce">
              Toca de nuevo para reproducir audio
            </div>
          )}

          {/* Controles de Audio y Play flotantes sobre el video */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <button
              onClick={toggleSound}
              type="button"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isMuted 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30 active:scale-95' 
                  : 'bg-white text-black hover:bg-neutral-200 active:scale-95'
              }`}
            >
              {isMuted ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  Activar sonido
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  Silenciar
                </>
              )}
            </button>

            <button
              onClick={togglePlay}
              type="button"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              title={isPlaying ? "Pausar video" : "Reproducir video"}
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Pausar</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Reproducir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
