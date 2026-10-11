import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// URL de la app (puedes cambiarla en producción)
const APP_URL = window.location.origin;

const QR_TEMPLATES = [
  {
    id: 'booking',
    label: 'Reservar Cita',
    icon: '📅',
    description: 'QR que lleva directo al formulario de reserva',
    url: `${APP_URL}/#reserva`,
  },
  {
    id: 'home',
    label: 'Página Principal',
    icon: '🏠',
    description: 'QR para la landing page principal de Barber Kalvin',
    url: `${APP_URL}/`,
  },
  {
    id: 'login',
    label: 'Iniciar Sesión',
    icon: '🔑',
    description: 'QR que lleva al login del sistema',
    url: `${APP_URL}/login`,
  },
];

export default function QRModule() {
  const [selected, setSelected] = useState(QR_TEMPLATES[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [size, setSize] = useState(256);
  const [downloaded, setDownloaded] = useState(false);

  const qrUrl = useCustom && customUrl.trim() ? customUrl.trim() : selected.url;

  const handleDownload = () => {
    const svg = document.getElementById('barber-kalvin-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = size + 40;
    canvas.height = size + 40;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 20, 20, size, size);
      const link = document.createElement('a');
      link.download = 'barber-kalvin-qr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl flex items-center justify-center text-xl">
          📲
        </div>
        <div>
          <h2 className="text-white font-black text-lg uppercase tracking-wider">Código QR</h2>
          <p className="text-neutral-500 text-xs">Genera QRs para que tus clientes reserven fácilmente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opciones de configuración */}
        <div className="space-y-4">
          {/* Plantillas */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 space-y-3">
            <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Destino del QR</p>
            <div className="space-y-2">
              {QR_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); setUseCustom(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    !useCustom && selected.id === t.id
                      ? 'bg-red-600/10 border-red-600/30 text-white'
                      : 'bg-neutral-800/50 border-white/5 text-neutral-400 hover:border-white/10'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{t.label}</p>
                    <p className="text-[11px] text-neutral-500">{t.description}</p>
                  </div>
                </button>
              ))}

              {/* URL personalizada */}
              <button
                onClick={() => setUseCustom(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  useCustom
                    ? 'bg-red-600/10 border-red-600/30 text-white'
                    : 'bg-neutral-800/50 border-white/5 text-neutral-400 hover:border-white/10'
                }`}
              >
                <span className="text-xl">🔗</span>
                <div className="flex-1">
                  <p className="font-bold text-sm">URL Personalizada</p>
                  <p className="text-[11px] text-neutral-500">Escribe cualquier URL</p>
                </div>
              </button>
              {useCustom && (
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-neutral-800 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-red-600 placeholder:text-neutral-600"
                />
              )}
            </div>
          </div>

          {/* Tamaño */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Tamaño</p>
              <span className="text-white font-black text-sm">{size}px</span>
            </div>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="w-full accent-red-600"
            />
            <div className="flex justify-between text-neutral-600 text-[10px] font-bold">
              <span>Pequeño</span>
              <span>Grande</span>
            </div>
          </div>

          {/* URL actual */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 space-y-2">
            <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">URL del QR</p>
            <p className="text-neutral-300 text-xs break-all font-mono bg-black/30 p-2 rounded-lg">{qrUrl || '—'}</p>
          </div>
        </div>

        {/* Preview del QR */}
        <div className="flex flex-col items-center gap-6">
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4 w-full">
            <p className="text-neutral-400 text-xs font-black uppercase tracking-widest self-start">Vista Previa</p>
            <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-black/50">
              <QRCodeSVG
                id="barber-kalvin-qr"
                value={qrUrl || APP_URL}
                size={Math.min(size, 280)}
                bgColor="#ffffff"
                fgColor="#111111"
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="text-center">
              <p className="text-white font-black text-sm">BARBER KALVIN</p>
              <p className="text-neutral-500 text-xs">{useCustom ? 'URL Personalizada' : selected.label}</p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="w-full space-y-3">
            <button
              onClick={handleDownload}
              className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest cursor-pointer transition-all ${
                downloaded
                  ? 'bg-green-500 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
              }`}
            >
              {downloaded ? '✓ Descargado' : '⬇ Descargar QR (PNG)'}
            </button>
            <p className="text-neutral-600 text-[11px] text-center leading-relaxed">
              Imprime este QR y colócalo en tu barbería para que los clientes reserven directamente desde su celular.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
