import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Genera slots de 30 min entre startTime y endTime,
 * excluyendo el rango de almuerzo [lunchStart, lunchEnd] si existe.
 */
export function generateTimeSlots(startTime, endTime, serviceDuration = 30, lunchStart = null, lunchEnd = null) {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;

  const lunchStartMin = lunchStart ? (() => { const [h, m] = lunchStart.split(':').map(Number); return h * 60 + m; })() : null;
  const lunchEndMin   = lunchEnd   ? (() => { const [h, m] = lunchEnd.split(':').map(Number);   return h * 60 + m; })() : null;

  while (current + serviceDuration <= end) {
    // Omitir slots que caen dentro del horario de almuerzo
    if (lunchStartMin !== null && lunchEndMin !== null) {
      // El slot [current, current+serviceDuration] se omite si se solapa con [lunchStart, lunchEnd]
      const slotEnd = current + serviceDuration;
      const overlapsLunch = current < lunchEndMin && slotEnd > lunchStartMin;
      if (!overlapsLunch) {
        const h = Math.floor(current / 60).toString().padStart(2, '0');
        const m = (current % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    } else {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    current += 30;
  }
  return slots;
}

/**
 * Returns true si el intervalo [aStart, aStart+aDur] se solapa con [bStart, bStart+bDur]
 */
function overlaps(aStart, aDur, bStart, bDur) {
  return aStart < bStart + bDur && aStart + aDur > bStart;
}

/**
 * Devuelve el day-of-week key para una fecha YYYY-MM-DD
 */
export function getDayKey(dateStr) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(dateStr + 'T12:00:00').getDay()];
}

/**
 * Hook useAvailability
 * Escucha Firestore en tiempo real para bookings de un worker+date
 * y calcula los slots disponibles, respetando el horario de almuerzo.
 */
export function useAvailability(worker, date, serviceDuration, excludeBookingId = null, enabled = true) {
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !worker?.id || !date) {
      const timer = setTimeout(() => {
        setBookedSlots([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setLoading(true);
    }, 0);

    const q = query(
      collection(db, 'bookings'),
      where('workerId', '==', worker.id),
      where('date', '==', date),
      where('status', 'in', ['pending', 'confirmed', 'in_progress'])
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const slots = snap.docs
          .filter(d => d.id !== excludeBookingId)
          .map(d => ({
            time: d.data().time,
            duration: d.data().serviceDuration || 30
          }));
        setBookedSlots(slots);
        setLoading(false);
      },
      (error) => {
        console.error('Availability snapshot error:', error);
        setBookedSlots([]);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [worker?.id, date, serviceDuration, excludeBookingId, enabled]);

  /**
   * Determina si un slot esta en el pasado (para hoy), bloqueado por cita,
   * o bloqueado por horario de almuerzo.
   */
  const getSlotStatus = (time) => {
    // Verificar si el slot ya paso (para el dia de hoy)
    const todayLocal = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    if (date === todayLocal) {
      const now = new Date();
      const [sh, sm] = time.split(':').map(Number);
      if (sh * 60 + sm <= now.getHours() * 60 + now.getMinutes()) {
        return 'past';
      }
    }

    // Verificar si el slot esta bloqueado por una cita existente
    const [th, tm] = time.split(':').map(Number);
    const slotStart = th * 60 + tm;
    const blocked = bookedSlots.some(b => {
      const [bh, bm] = b.time.split(':').map(Number);
      return overlaps(slotStart, serviceDuration || 30, bh * 60 + bm, b.duration);
    });

    return blocked ? 'blocked' : 'available';
  };

  /**
   * Devuelve todos los slots con su status para el worker en esa fecha,
   * respetando el horario de almuerzo configurado.
   */
  const getSlots = () => {
    if (!worker || !date) return [];

    const dayKey = getDayKey(date);
    const schedule = worker.schedule?.[dayKey];
    if (!schedule) return [];

    // Extraer horario de almuerzo si existe
    const lunchStart = schedule.lunchStart || null;
    const lunchEnd   = schedule.lunchEnd   || null;

    return generateTimeSlots(
      schedule.start,
      schedule.end,
      serviceDuration || 30,
      lunchStart,
      lunchEnd
    ).map(time => ({
      time,
      status: getSlotStatus(time)
    }));
  };

  const isWorkerAvailableOnDate = () => {
    if (!worker || !date) return false;
    const dayKey = getDayKey(date);
    return !!worker.schedule?.[dayKey];
  };

  return { bookedSlots, loading, getSlots, getSlotStatus, isWorkerAvailableOnDate };
}
