import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../utils/imageHelper';

/**
 * Componente modal premium que permite a los usuarios (tanto clientes como especialistas/staff)
 * editar su informacion de perfil personal (nombre, telefono/WhatsApp y foto de perfil).
 * 
 * @param {boolean} isOpen - Define si el modal esta visible en pantalla.
 * @param {function} onClose - Funcion callback para cerrar el modal.
 */
function ProfileModal({ isOpen, onClose }) {
  // Consumir el usuario logueado y la funcion de actualizacion del contexto de Auth
  const { user, updateProfile, changeUserPassword } = useAuth();
  
  // Estados para manejar los valores de los inputs del formulario
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [image, setImage] = useState(user?.image || '');
  
  // Estados de carga e interfaz
  const [uploading, setUploading] = useState(false); // Spinner de subida de imagen
  const [saving, setSaving] = useState(false);       // Spinner al guardar cambios en Firestore
  const [error, setError] = useState('');           // Mensajes de error en validaciones o Firebase
  const [success, setSuccess] = useState(false);     // Banner de exito al actualizar
  
  // Estados para cambiar contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Si el modal no debe estar abierto, no renderizar nada
  if (!isOpen) return null;

  /**
   * Captura la seleccion de archivo de imagen, realiza validaciones básicas en el cliente
   * y delega la subida a la utilidad uploadImage.
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validar que el archivo sea una imagen permitida
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Formato no permitido. Solo JPG, PNG o WEBP.');
      return;
    }

    // 2. Validar limite de tamano en cliente para no saturar el servidor (maximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen excede el limite de 5MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      // 3. Subir la imagen (con compresion automatica en imageHelper)
      const url = await uploadImage(file);
      if (url) {
        setImage(url); // Almacenar URL de la imagen en el estado local
      } else {
        setError('No se pudo procesar la imagen.');
      }
    } catch {
      setError('Error al subir la foto.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Procesa el cambio de contraseña utilizando el AuthContext.
   */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) return;

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setPasswordSaving(true);
    setError('');
    setSuccess(false);

    const result = await changeUserPassword(newPassword);
    setPasswordSaving(false);

    if (result.success) {
      setSuccess(true);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordForm(false);
      
      // Cerrar el modal tras 1.5s
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError(result.message || 'Error al cambiar la contraseña');
    }
  };

  /**
   * Guarda los cambios de los inputs en las colecciones de Firestore y actualiza el estado global de React.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    
    // Llamar al metodo centralizado de actualizacion de perfil
    const result = await updateProfile({ name, phone, image });
    setSaving(false);
    
    if (result.success) {
      setSuccess(true);
      // Cerrar el modal automaticamente despues de 1.5 segundos para dar feedback visual
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError(result.message || 'Error al guardar los cambios');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Fondo difuminado oscuro */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      {/* Tarjeta del modal */}
      <div className="relative bg-neutral-900 border border-white/10 p-6 sm:p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-6 text-left animate-fade-in">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center">
          <h3 className="text-white text-xl font-black">Mi <span className="text-red-600">Perfil</span></h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer transition-colors p-1 bg-white/5 rounded-full">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Alerta de Exito */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-400 text-sm font-medium">¡Perfil actualizado correctamente!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subida de foto de perfil circular */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 shadow-lg bg-neutral-800 flex items-center justify-center group">
              {image ? (
                <img src={image} alt="Avatar" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="text-neutral-500 flex flex-col items-center text-center justify-center">
                  <svg className="h-10 w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Sin foto</span>
                </div>
              )}

              {/* Spinner de carga de la foto */}
              {uploading && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Input oculto tipo file */}
            <label className="bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all uppercase tracking-wider active:scale-[0.98]">
              {uploading ? 'Cargando...' : 'Cambiar Foto'}
              <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} disabled={uploading} className="hidden" />
            </label>
          </div>

          {/* Nombre completo */}
          <div className="space-y-2">
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Nombre Completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              disabled={saving}
              className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* WhatsApp / Telefono */}
          <div className="space-y-2">
            <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">WhatsApp / Telefono</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ej: +57 300 000 0000"
              disabled={saving}
              className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* Sección de cambio de contraseña */}
          <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
            <button
              type="button"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-neutral-400 hover:text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer outline-none"
            >
              <span>{showPasswordForm ? '▲ Ocultar Cambio de Contraseña' : '▼ 🔒 Cambiar Contraseña'}</span>
            </button>

            {showPasswordForm && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-neutral-400 text-[10px] font-black uppercase tracking-widest block">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-red-600 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !newPassword || !confirmNewPassword}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-40 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {passwordSaving ? 'Guardando contraseña...' : 'Actualizar Contraseña'}
                </button>
              </div>
            )}
          </div>

          {/* Boton de guardar cambios */}
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98] cursor-pointer mt-4"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Guardando...
              </span>
            ) : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
