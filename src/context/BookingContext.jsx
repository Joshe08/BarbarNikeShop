/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  doc, updateDoc, deleteDoc, where, getDocs, runTransaction, getDoc, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { sendBookingEmail } from '../utils/emailService';

const BookingContext = createContext(null);

// Máximo de citas activas que un cliente puede tener en un mismo día
const MAX_BOOKINGS_PER_DAY = 2;

export function BookingProvider({ children }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Escuchar citas en tiempo real
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setBookings([]);
        setLoadingBookings(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    
    const isStaff = ['admin', 'barber'].includes(user.role);
    const q = isStaff
      ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'bookings'), where('clientId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!isStaff) {
        // Ordenar en memoria para evitar requerir un índice compuesto en Firestore
        data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      }
      setBookings(data);
      setLoadingBookings(false);
    }, (error) => {
      console.error('Bookings snapshot error:', error);
      setLoadingBookings(false);
    });
    return unsubscribe;
  }, [user]);

  // Escuchar notificaciones del usuario actual en tiempo real
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setNotifications([]);
        setLoadingNotifications(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    const targetUserId = user.role === 'admin' ? 'admin' : user.uid;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', targetUserId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNotifications(data);
      setLoadingNotifications(false);
    }, (error) => {
      console.error('Notifications snapshot error:', error);
      setLoadingNotifications(false);
    });
    return unsubscribe;
  }, [user]);

  // Verificar si un horario está disponible para un trabajador
  const checkAvailability = async (workerId, date, time, serviceDuration, excludeId = null) => {
    const q = query(
      collection(db, 'bookings'),
      where('workerId', '==', workerId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed', 'in_progress'])
    );
    const snapshot = await getDocs(q);
    const existing = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(b => b.id !== excludeId);

    const [nh, nm] = time.split(':').map(Number);
    const newStart = nh * 60 + nm;
    const newEnd = newStart + (serviceDuration || 30);

    const conflict = existing.find(b => {
      const [bh, bm] = b.time.split(':').map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = bStart + (b.serviceDuration || 30);
      // Verificar también descansos del trabajador
      return newStart < bEnd && newEnd > bStart;
    });

    return !conflict;
  };

  // Verificar si el horario está en un período de descanso del trabajador
  const checkBreakConflict = async (workerId, date, time, serviceDuration) => {
    try {
      const workerSnap = await getDoc(doc(db, 'workers', workerId));
      if (!workerSnap.exists()) return false;
      const worker = workerSnap.data();
      const breaks = worker.breaks || [];

      const [nh, nm] = time.split(':').map(Number);
      const newStart = nh * 60 + nm;
      const newEnd = newStart + (serviceDuration || 30);

      const conflict = breaks.find(br => {
        if (!br.start || !br.end) return false;
        const [bh, bm] = br.start.split(':').map(Number);
        const [eh, em] = br.end.split(':').map(Number);
        const brStart = bh * 60 + bm;
        const brEnd = eh * 60 + em;
        return newStart < brEnd && newEnd > brStart;
      });

      return !!conflict;
    } catch {
      return false;
    }
  };

  // Crear reserva usando transacción de Firestore para evitar conflictos simultáneos
  const addBooking = async (bookingData) => {
    try {
      // 0. Verificar si la barbería está cerrada temporalmente
      const operationalSnap = await getDoc(doc(db, 'settings', 'operationalStatus'));
      if (operationalSnap.exists()) {
        const opStatus = operationalSnap.data();
        if (opStatus.isOpen === false) {
          const reopenNotice = opStatus.reopenDate ? ` Reabriremos el ${opStatus.reopenDate}.` : '';
          const reasonNotice = opStatus.reason ? ` Motivo: ${opStatus.reason}.` : '';
          return {
            success: false,
            message: `En este momento la barbería se encuentra cerrada temporalmente.${reasonNotice}${reopenNotice} No se permiten nuevas reservas.`
          };
        }
      }

      // Verificar límite diario de citas por cliente
      const dailyQuery = query(
        collection(db, 'bookings'),
        where('clientId', '==', bookingData.clientId),
        where('date', '==', bookingData.date),
        where('status', 'in', ['pending', 'confirmed', 'in_progress'])
      );
      const dailySnapshot = await getDocs(dailyQuery);
      if (dailySnapshot.size >= MAX_BOOKINGS_PER_DAY) {
        return {
          success: false,
          message: `Solo puedes agendar un máximo de ${MAX_BOOKINGS_PER_DAY} citas activas por día. Ya tienes ${dailySnapshot.size} cita(s) para el ${bookingData.date}.`
        };
      }

      // Verificar descansos del trabajador
      const breakConflict = await checkBreakConflict(
        bookingData.workerId,
        bookingData.date,
        bookingData.time,
        bookingData.serviceDuration
      );
      if (breakConflict) {
        return {
          success: false,
          message: `${bookingData.workerName} está en descanso en ese horario. Por favor elige otra hora.`
        };
      }

      // Usar transacción de Firestore para bloqueo atómico
      let createdBookingId = null;
      await runTransaction(db, async (transaction) => {
        // Consultar citas existentes del trabajador en esa fecha dentro de la transacción
        const q = query(
          collection(db, 'bookings'),
          where('workerId', '==', bookingData.workerId),
          where('date', '==', bookingData.date),
          where('status', 'in', ['pending', 'confirmed', 'in_progress'])
        );
        const snapshot = await getDocs(q);
        const existing = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const [nh, nm] = bookingData.time.split(':').map(Number);
        const newStart = nh * 60 + nm;
        const newEnd = newStart + (bookingData.serviceDuration || 30);

        const conflict = existing.find(b => {
          const [bh, bm] = b.time.split(':').map(Number);
          const bStart = bh * 60 + bm;
          const bEnd = bStart + (b.serviceDuration || 30);
          return newStart < bEnd && newEnd > bStart;
        });

        if (conflict) {
          throw new Error(`SLOT_TAKEN:${bookingData.workerName}`);
        }

        // Crear la cita dentro de la transacción
        const newRef = doc(collection(db, 'bookings'));
        createdBookingId = newRef.id;
        transaction.set(newRef, {
          ...bookingData,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      });

      // Notificaciones fuera de la transacción (no bloquean)
      const timeAndDate = `${bookingData.date} a las ${bookingData.time}`;

      await Promise.allSettled([
        addDoc(collection(db, 'notifications'), {
          userId: 'admin',
          title: 'Nueva Cita Agendada',
          message: `El cliente ${bookingData.clientName} agendó una cita para el ${timeAndDate} con ${bookingData.workerName}.`,
          type: 'new_booking',
          read: false,
          createdAt: new Date().toISOString()
        }),
        addDoc(collection(db, 'notifications'), {
          userId: bookingData.workerId,
          title: 'Nueva Cita en tu Agenda',
          message: `Tienes una nueva cita agendada por ${bookingData.clientName} el ${timeAndDate}.`,
          type: 'new_booking_worker',
          read: false,
          createdAt: new Date().toISOString()
        }),
        addDoc(collection(db, 'notifications'), {
          userId: bookingData.clientId,
          title: 'Cita Agendada',
          message: `Tu cita para el ${timeAndDate} con ${bookingData.workerName} ha sido registrada.`,
          type: 'new_booking_client',
          read: false,
          createdAt: new Date().toISOString()
        }),
      ]);

      return { success: true, bookingId: createdBookingId };
    } catch (error) {
      console.error('Booking creation error:', error);
      if (error.message?.startsWith('SLOT_TAKEN:')) {
        const workerName = error.message.split(':')[1];
        return {
          success: false,
          message: `Este horario acaba de ser tomado por otro cliente con ${workerName}. Por favor elige otro horario.`
        };
      }
      return { success: false, message: 'Error al guardar la reserva. Intenta de nuevo.' };
    }
  };

  const updateBookingStatus = async (id, status, cancelReason = '') => {
    try {
      const updateData = { status, updatedAt: new Date().toISOString() };
      if (status === 'cancelled' && cancelReason) {
        updateData.cancelReason = cancelReason;
      }
      await updateDoc(doc(db, 'bookings', id), updateData);

      const booking = bookings.find(b => b.id === id);
      if (booking) {
        const timeAndDate = `${booking.date} a las ${booking.time}`;
        const statusLabels = {
          pending: 'puesta en Pendiente',
          confirmed: 'Confirmada',
          in_progress: 'iniciada (En proceso)',
          completed: 'Finalizada',
          cancelled: 'Cancelada'
        };
        const statusLabel = statusLabels[status] || status;

        await addDoc(collection(db, 'notifications'), {
          userId: booking.clientId,
          title: `Cita ${status === 'cancelled' ? 'Cancelada' : 'Actualizada'}`,
          message: `Tu cita del ${timeAndDate} con ${booking.workerName} ha sido ${statusLabel}.${cancelReason ? ` Motivo: ${cancelReason}` : ''}`,
          type: 'status_change',
          read: false,
          createdAt: new Date().toISOString()
        });

        // ─── LÓGICA DE PUNTOS DE FIDELIZACIÓN AL COMPLETAR CITA ───
        if (status === 'completed') {
          try {
            const userRef = doc(db, 'users', booking.clientId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const currentPoints = userSnap.data().points || 0;
              // Regla: 1 punto por cada $200 COP
              const earnedPoints = Math.floor((booking.servicePrice || 0) / 200);
              
              if (earnedPoints > 0) {
                const newPointsTotal = currentPoints + earnedPoints;
                await updateDoc(userRef, { points: newPointsTotal });
                
                // Guardar la transacción de puntos en una colección para el historial
                await addDoc(collection(db, 'points_transactions'), {
                  clientId: booking.clientId,
                  clientName: booking.clientName,
                  type: 'earned',
                  points: earnedPoints,
                  description: `Puntos ganados por servicio: ${booking.service}`,
                  bookingId: id,
                  createdAt: new Date().toISOString()
                });

                // Notificar al cliente sobre sus nuevos puntos
                await addDoc(collection(db, 'notifications'), {
                  userId: booking.clientId,
                  title: '¡Has Ganado Puntos! 🎁',
                  message: `Acabas de acumular ${earnedPoints} puntos por tu cita de hoy. ¡Gracias por tu fidelidad!`,
                  type: 'points_earned',
                  read: false,
                  createdAt: new Date().toISOString()
                });
              }
            }
          } catch (ptsErr) {
            console.error('Error calculando/sumando puntos de fidelidad:', ptsErr);
          }
        }

        if (status === 'cancelled') {
          // Enviar correo de cancelación en segundo plano
          try {
            sendBookingEmail({
              ...booking,
              notes: cancelReason || 'Cancelado por administración / especialista'
            }, 'cancelacion');
          } catch (emailErr) {
            console.error('Error sending cancellation email:', emailErr);
          }

          await Promise.allSettled([
            addDoc(collection(db, 'notifications'), {
              userId: 'admin',
              title: 'Cita Cancelada',
              message: `La cita de ${booking.clientName} para el ${timeAndDate} con ${booking.workerName} fue cancelada.${cancelReason ? ` Motivo: ${cancelReason}` : ''}`,
              type: 'cancelled_booking',
              read: false,
              createdAt: new Date().toISOString()
            }),
            addDoc(collection(db, 'notifications'), {
              userId: booking.workerId,
              title: 'Cita Cancelada en tu Agenda',
              message: `La cita de ${booking.clientName} del ${timeAndDate} fue cancelada.${cancelReason ? ` Motivo: ${cancelReason}` : ''}`,
              type: 'cancelled_booking_worker',
              read: false,
              createdAt: new Date().toISOString()
            }),
          ]);
        }
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const deleteBooking = async (id) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (e) {
      console.error('Error deleting booking:', e);
    }
  };

  const updateBooking = async (updatedBooking) => {
    const { id, ...data } = updatedBooking;

    // Verificar descansos
    const breakConflict = await checkBreakConflict(
      data.workerId,
      data.date,
      data.time,
      data.serviceDuration
    );
    if (breakConflict) {
      return {
        success: false,
        message: `${data.workerName} está en descanso en ese horario. Por favor elige otra hora.`
      };
    }

    const available = await checkAvailability(
      data.workerId,
      data.date,
      data.time,
      data.serviceDuration,
      id
    );

    if (!available) {
      return {
        success: false,
        message: `El horario seleccionado con ${data.workerName} ya está ocupado. Por favor elige otro.`
      };
    }

    try {
      const currentBooking = bookings.find(b => b.id === id);
      const originalHistory = currentBooking?.history || [];
      const changeLog = [];

      if (currentBooking) {
        if (currentBooking.service !== data.service) changeLog.push(`Servicio: ${currentBooking.service} → ${data.service}`);
        if (currentBooking.workerName !== data.workerName) changeLog.push(`Especialista: ${currentBooking.workerName} → ${data.workerName}`);
        if (currentBooking.date !== data.date || currentBooking.time !== data.time)
          changeLog.push(`Horario: ${currentBooking.date} ${currentBooking.time} → ${data.date} ${data.time}`);
        if (currentBooking.notes !== data.notes) changeLog.push(`Notas: "${currentBooking.notes || ''}" → "${data.notes || ''}"`);
      }

      const historyEntry = {
        updatedAt: new Date().toISOString(),
        description: changeLog.length > 0 ? changeLog.join(', ') : 'Modificación de cita',
      };

      await updateDoc(doc(db, 'bookings', id), {
        ...data,
        history: [...originalHistory, historyEntry],
        updatedAt: new Date().toISOString()
      });

      const timeAndDate = `${data.date} a las ${data.time}`;
      await Promise.allSettled([
        addDoc(collection(db, 'notifications'), {
          userId: 'admin',
          title: 'Cita Modificada',
          message: `El cliente ${data.clientName} modificó su cita. Ahora: ${data.service} con ${data.workerName} para el ${timeAndDate}.`,
          type: 'booking_modified',
          read: false,
          createdAt: new Date().toISOString()
        }),
        addDoc(collection(db, 'notifications'), {
          userId: data.workerId,
          title: 'Cita Modificada en tu Agenda',
          message: `La cita de ${data.clientName} fue modificada. Nuevo horario: ${timeAndDate}. Servicio: ${data.service}.`,
          type: 'booking_modified_worker',
          read: false,
          createdAt: new Date().toISOString()
        }),
      ]);

      if (currentBooking && currentBooking.workerId !== data.workerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: currentBooking.workerId,
          title: 'Cita Removida de tu Agenda',
          message: `La cita de ${currentBooking.clientName} del ${currentBooking.date} a las ${currentBooking.time} fue reasignada a otro especialista.`,
          type: 'booking_removed_worker',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      return { success: true };
    } catch (e) {
      console.error('Error updating booking:', e);
      return { success: false, message: 'Error al actualizar la cita.' };
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // ─── CANJEAR PUNTOS DE FIDELIZACIÓN ───────────────────────────
  const redeemPoints = async (clientId, clientName, pointsCost, rewardName) => {
    try {
      const userRef = doc(db, 'users', clientId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return { success: false, message: 'Usuario no encontrado.' };

      const currentPoints = userSnap.data().points || 0;
      if (currentPoints < pointsCost) {
        return { success: false, message: `No tienes suficientes puntos. Necesitas ${pointsCost} pts y tienes ${currentPoints} pts.` };
      }

      const newPoints = currentPoints - pointsCost;
      await updateDoc(userRef, { points: newPoints });

      // Guardar la transacción de canje
      await addDoc(collection(db, 'points_transactions'), {
        clientId,
        clientName,
        type: 'redeemed',
        points: -pointsCost,
        description: `Canje: ${rewardName}`,
        createdAt: new Date().toISOString()
      });

      // Notificar al admin para aplicar el descuento
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: '🎁 Canje de Puntos',
        message: `${clientName} canjeó ${pointsCost} puntos por: "${rewardName}". Saldo restante: ${newPoints} pts. Aplicar descuento en su próxima cita.`,
        type: 'points_redeemed',
        read: false,
        createdAt: new Date().toISOString()
      });

      // Notificar al cliente
      await addDoc(collection(db, 'notifications'), {
        userId: clientId,
        title: '🎁 ¡Canje Exitoso!',
        message: `Canjeaste ${pointsCost} puntos por "${rewardName}". Tu nuevo saldo es ${newPoints} pts. ¡El administrador aplicará tu beneficio en tu próxima cita!`,
        type: 'points_redeemed_client',
        read: false,
        createdAt: new Date().toISOString()
      });

      return { success: true, newPoints };
    } catch (err) {
      console.error('Error canjeando puntos:', err);
      return { success: false, message: 'Error al canjear los puntos. Intenta de nuevo.' };
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const targetUserId = user.role === 'admin' ? 'admin' : user.uid;
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', targetUserId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const getWorkerBookings = (workerId) => bookings.filter(b => b.workerId === workerId);
  const getClientBookings = (clientId) => bookings.filter(b => b.clientId === clientId);

  // Contar citas activas de un cliente en una fecha específica
  const getClientDailyBookingCount = (clientId, date) => {
    return bookings.filter(
      b => b.clientId === clientId
        && b.date === date
        && ['pending', 'confirmed', 'in_progress'].includes(b.status)
    ).length;
  };

  return (
    <BookingContext.Provider value={{
      bookings, loadingBookings,
      notifications, loadingNotifications,
      addBooking, updateBookingStatus, deleteBooking, updateBooking,
      markNotificationAsRead, deleteNotification, clearAllNotifications,
      checkAvailability, checkBreakConflict, getWorkerBookings, getClientBookings,
      getClientDailyBookingCount, MAX_BOOKINGS_PER_DAY,
      redeemPoints
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBookings must be used within BookingProvider');
  return context;
}
