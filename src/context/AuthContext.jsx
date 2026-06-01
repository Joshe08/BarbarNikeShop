/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updatePassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

const getErrorMessage = (code) => {
  const errors = {
    'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'Contraseña incorrecta. Intenta de nuevo.',
    'auth/invalid-email': 'El formato del correo electrónico no es válido.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/operation-not-allowed': 'Operación no permitida. Contacta al administrador.',
    'auth/invalid-action-code': 'El enlace de restablecimiento es inválido o ya ha caducado. Por favor, solicita uno nuevo.',
    'auth/expired-action-code': 'El enlace ha caducado. Solicita un nuevo correo de restablecimiento.',
  };
  return errors[code] || `Ocurrió un error inesperado (${code || 'desconocido'}). Intenta de nuevo.`;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Escuchador del estado de autenticación en Firebase Auth ---
  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      
      try {
        if (firebaseUser) {
          let userData = null;
          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (snap.exists()) {
              userData = snap.data();
            }
          } catch (err) {
            console.error('Error leyendo Firestore:', err);
          }

          if (userData && userData.active === false) {
            await signOut(auth).catch(() => {});
            if (mounted) setUser(null);
          } else {
            const baseUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || '',
              role: 'client',
              phone: '',
              active: true,
              emailVerified: firebaseUser.emailVerified
            };
            if (mounted) setUser(userData ? { ...baseUser, ...userData, emailVerified: firebaseUser.emailVerified } : baseUser);
          }
        } else {
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error('Error en onAuthStateChanged:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    });
    
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // --- Registro de nuevos clientes ---
  const register = async ({ name, email, password, phone }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Enviar correo de verificación de inmediato
      try {
        await sendEmailVerification(cred.user);
      } catch (verifErr) {
        console.warn('Error al enviar correo de verificación:', verifErr);
      }

      const userData = {
        name,
        email,
        phone: phone || '',
        role: 'client',
        active: true,
        createdAt: new Date().toISOString()
      };
      
      try {
        await setDoc(doc(db, 'users', cred.user.uid), userData);
      } catch (err) {
        console.warn('Advertencia guardando perfil:', err);
      }

      addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: 'Nuevo registro',
        message: `${name} (${email}) se registró`,
        type: 'new_user',
        read: false,
        createdAt: new Date().toISOString()
      }).catch(() => {});

      const baseUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || '',
        role: 'client',
        phone: phone || '',
        emailVerified: cred.user.emailVerified
      };

      setUser(userData ? { ...baseUser, ...userData, emailVerified: cred.user.emailVerified } : baseUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      setLoading(false);
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // --- Inicio de sesión ---
  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      let userData = null;
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) {
          userData = snap.data();
        }
      } catch (err) {
        console.error('Error obteniendo datos:', err);
      }

      if (userData && userData.active === false) {
        await signOut(auth).catch(() => {});
        setUser(null);
        setLoading(false);
        return { success: false, message: 'Cuenta desactivada.' };
      }

      const baseUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || '',
        role: 'client',
        phone: '',
        active: true,
        emailVerified: cred.user.emailVerified
      };

      setUser(userData ? { ...baseUser, ...userData, emailVerified: cred.user.emailVerified } : baseUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      setLoading(false);
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // --- Reenviar correo de verificacion (flujo con credenciales) ---
  const resendVerification = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await signOut(auth).catch(() => {});
      return { success: true };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // --- Enviar correo de verificación (flujo con sesión activa) ---
  const sendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      return { success: false, message: 'No hay usuario con sesión activa.' };
    } catch (error) {
      console.error('Error enviando verificación:', error);
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // --- Recargar estado de verificación del usuario ---
  const reloadUser = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            emailVerified: updatedUser.emailVerified
          };
        });
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error('Error recargando usuario:', error);
      throw error;
    }
  };

  // --- Cerrar sesion ---
  const logout = () => {
    setUser(null);
    return signOut(auth);
  };

  // --- Recuperar contraseña ---
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // --- Verificar código de restablecimiento ---
  const verifyResetCode = async (code) => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return { success: true, email };
    } catch (error) {
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // --- Confirmar nueva contraseña ---
  const confirmReset = async (code, newPassword) => {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error.code) };
    }
  };

  // --- Cambiar contraseña de usuario logueado ---
  const changeUserPassword = async (newPassword) => {
    try {
      if (!auth.currentUser) throw new Error('No hay usuario autenticado.');
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      let message = getErrorMessage(error.code);
      if (error.code === 'auth/requires-recent-login') {
        message = 'Por seguridad, debes cerrar sesión e iniciarla de nuevo para cambiar tu contraseña.';
      }
      return { success: false, message };
    }
  };

  // --- Crear cuenta de trabajador (usa app secundaria para no cerrar sesión del admin) ---
  const createWorkerAccount = async ({ name, email, password, role, specialty, phone, percentage, image, schedule }) => {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, createUserWithEmailAndPassword: createSecondary, signOut: secondarySignOut } = await import('firebase/auth');
    const { firebaseConfig } = await import('../firebase/config');

    const appName = `SecondaryApp-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, appName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const cred = await createSecondary(secondaryAuth, email, password);
      const uid = cred.user.uid;

      const userData = {
        name,
        email,
        phone: phone || '',
        role,
        active: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), userData);

      await setDoc(doc(db, 'workers', uid), {
        id: uid,
        name,
        email,
        phone: phone || '',
        role,
        specialty: specialty || 'Servicios Generales',
        percentage: percentage || 50,
        image: image || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face',
        category: role === 'barber' ? 'men' : 'women',
        active: true,
        schedule: schedule || {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
          saturday: { start: '08:00', end: '18:00' }
        }
      });

      addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: 'Nuevo trabajador registrado',
        message: `El administrador ha registrado al trabajador ${name} con el rol de ${role}.`,
        type: 'new_user',
        read: false,
        createdAt: new Date().toISOString()
      }).catch(err => console.warn('Error notificación trabajador:', err));

      await secondarySignOut(secondaryAuth).catch(() => {});
      await secondaryApp.delete().catch(() => {});
      return { success: true };
    } catch (error) {
      console.error('Error creando cuenta de trabajador:', error);
      await secondaryApp.delete().catch(() => {});
      let msg = 'Error al crear la cuenta del trabajador.';
      if (error.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado.';
      if (error.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      return { success: false, message: msg };
    }
  };

  // --- Actualización de perfil del usuario logueado ---
  const updateProfile = async ({ name, phone, image }) => {
    if (!user) return { success: false, message: 'Usuario no autenticado' };
    try {
      const uid = user.uid;
      const updates = { name, phone: phone || '', image: image || '' };

      await updateDoc(doc(db, 'users', uid), updates);

      const workerRoles = ['barber', 'stylist', 'manicurist'];
      if (workerRoles.includes(user.role)) {
        await updateDoc(doc(db, 'workers', uid), {
          name,
          phone: phone || '',
          image: image || ''
        });
      }

      setUser(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { success: false, message: 'Error al actualizar el perfil. Intenta de nuevo.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      login, register, logout, resetPassword, verifyResetCode, confirmReset, changeUserPassword,
      createWorkerAccount, updateProfile, resendVerification, sendVerificationEmail, reloadUser
    }}>
      {loading ? (
        <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-[9999]">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="w-full h-full border-4 border-white/5 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-orange-500 text-3xl font-black">B</span>
            </div>
          </div>
          <h1 className="text-white text-xl font-black tracking-widest uppercase">BarberNike</h1>
          <p className="text-orange-500 text-xs font-bold tracking-[0.2em] uppercase mt-2 animate-pulse">Cargando...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
}
