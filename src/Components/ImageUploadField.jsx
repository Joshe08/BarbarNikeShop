import { useState } from 'react';
import { uploadImage } from '../utils/imageHelper';

export default function ImageUploadField({ label, imageUrl, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validacion de Formato
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Solo formatos JPG, PNG o WEBP.');
      setSuccess(false);
      return;
    }

    // Validacion de Tamano (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen supera los 5MB.');
      setSuccess(false);
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);
    try {
      const url = await uploadImage(file);
      if (url) {
        onUploadComplete(url);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError('No se pudo procesar la imagen.');
      }
    } catch {
      setError('Error al procesar la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-1 block">{label}</label>
      <div className="flex items-center gap-6 bg-neutral-950/30 border border-white/5 p-4 rounded-3xl">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-800 flex items-center justify-center group shadow-md shadow-black/40">
          {imageUrl ? (
            <img src={imageUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-600">
              <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-bold">Sin foto</span>
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <label className={`inline-block border text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all ${uploading ? 'bg-neutral-800 border-white/5 text-neutral-500 cursor-not-allowed' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white active:scale-[0.98]'}`}>
            {uploading ? 'Procesando...' : 'Subir Foto'}
            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} disabled={uploading} className="hidden" />
          </label>
          
          <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-wide">Formatos: JPG, PNG, WEBP. Max: 5MB.</p>
          
          {error && (
            <div className="text-red-400 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="text-green-400 text-[10px] font-bold flex items-center gap-1.5">
              <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>¡Imagen cargada correctamente!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
