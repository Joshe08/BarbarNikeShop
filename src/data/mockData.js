// ============================================================
// BARBEROS (Módulo Masculino)
// ============================================================
export const BARBERS = [
  {
    id: 'barber-1',
    name: "Alex 'Blade' Rivera",
    role: 'barber',
    percentage: 60,
    specialty: 'Fade & Lineup',
    phone: '573001234567',
    category: 'men',
    branchId: 'branch-1',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face&fm=webp&q=70',
    schedule: {
      monday: { start: '09:30', end: '19:30' },
      tuesday: { start: '09:30', end: '19:30' },
      wednesday: { start: '09:30', end: '19:30' },
      thursday: { start: '09:30', end: '19:30' },
      friday: { start: '09:30', end: '19:30' },
      saturday: { start: '09:30', end: '19:30' },
      sunday: { start: '10:00', end: '15:30' }
    }
  },
  {
    id: 'barber-2',
    name: "Jordan 'Styles' Smith",
    role: 'barber',
    percentage: 55,
    specialty: 'Beard & Scissor Cut',
    phone: '573009876543',
    category: 'men',
    branchId: 'branch-1',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&fm=webp&q=70',
    schedule: {
      monday: { start: '09:30', end: '19:30' },
      tuesday: { start: '09:30', end: '19:30' },
      wednesday: { start: '09:30', end: '19:30' },
      thursday: { start: '09:30', end: '19:30' },
      friday: { start: '09:30', end: '19:30' },
      saturday: { start: '09:30', end: '19:30' },
      sunday: { start: '10:00', end: '15:30' }
    }
  }
];

// ============================================================
// SERVICIOS MASCULINOS
// ============================================================
export const SERVICES = [
  {
    id: 'svc-m1',
    name: 'Corte Clásico',
    price: 20000,
    duration: 30,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Corte tradicional de cabello con máquina y tijera.',
    details: ['Corte a máquina y tijera', 'Lavado capilar', 'Peinado con cera mate'],
    includes: 'Lavado + Corte + Peinado',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m2',
    name: 'Cortes Creativos',
    price: 25000,
    duration: 45,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Cortes con diseños, degradados modernos (Skin Fade) y estilos creativos.',
    details: ['Diseño personalizado', 'Degradado afeitado', 'Líneas y grecas'],
    includes: 'Corte Creativo + Acabado',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m3',
    name: 'Corte VIP',
    price: 35000,
    duration: 50,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Experiencia premium de corte con masaje capilar y exfoliación rápida.',
    details: ['Corte personalizado', 'Masaje relajante', 'Limpieza facial express'],
    includes: 'Corte + Masaje + Exfoliación',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m4',
    name: 'Corte y Barba',
    price: 35000,
    duration: 60,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Arreglo completo de cabello y barba con toalla caliente.',
    details: ['Corte clásico o fade', 'Perfilado de barba con navaja', 'Toalla caliente hidratante'],
    includes: 'Corte + Barba + Toalla Caliente',
    image: 'https://images.unsplash.com/photo-1621605815841-28d944683b83?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m5',
    name: 'Barba',
    price: 15000,
    duration: 25,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Perfilado y recorte de barba con toalla caliente.',
    details: ['Afeitado al vapor', 'Bálsamo hidratante', 'Toalla aromatizada'],
    includes: 'Perfilado + Hidratación',
    image: 'https://images.unsplash.com/photo-1621605815841-28d944683b83?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m6',
    name: 'Peinados',
    price: 12000,
    duration: 15,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Peinado profesional para eventos o uso diario con pomadas premium.',
    details: ['Lavado rápido', 'Secado modelado', 'Fijación de larga duración'],
    includes: 'Lavado + Peinado',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m7',
    name: 'Depilación con Cera',
    price: 15000,
    duration: 20,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Depilación facial de cejas, nariz o mandíbula con cera caliente.',
    details: ['Cera hipoalergénica', 'Retoque de cejas', 'Crema calmante'],
    includes: 'Depilación + Cuidado de Piel',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m8',
    name: 'Cerquillos',
    price: 8000,
    duration: 15,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Marcación de contornos de la frente, patillas y cuello.',
    details: ['Definición con patillera', 'Limpieza con navaja', 'Tónico refrescante'],
    includes: 'Delineado de contornos',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m9',
    name: 'Keratina',
    price: 120000,
    duration: 90,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Alisado capilar semipermanente y reducción de frizz.',
    details: ['Aplicación de keratina premium', 'Planchado sellador', 'Brillo intenso'],
    includes: 'Alisado + Hidratación',
    image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m10',
    name: 'Aminoácidos',
    price: 90000,
    duration: 80,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Tratamiento de nutrición y restauración capilar profunda.',
    details: ['Aporte de aminoácidos esenciales', 'Sellado térmico', 'Fortalecimiento de hebra'],
    includes: 'Nutrición + Peinado',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m11',
    name: 'Tintes',
    price: 60000,
    duration: 60,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Coloración capilar completa con tonos de moda.',
    details: ['Coloración directa', 'Lavado post-tinte', 'Crema protectora'],
    includes: 'Tinte + Lavado + Peinado',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m12',
    name: 'Total Look',
    price: 70000,
    duration: 90,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Cambio de imagen completo: Corte VIP, Barba y Limpieza Facial.',
    details: ['Corte personalizado', 'Perfilado de barba', 'Limpieza facial profunda'],
    includes: 'Corte + Barba + Limpieza + Mascarilla',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m13',
    name: 'Rayitos',
    price: 80000,
    duration: 80,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Efectos de iluminación capilar localizada.',
    details: ['Decoloración controlada', 'Matización de tono', 'Tratamiento protector'],
    includes: 'Iluminación + Lavado',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m14',
    name: 'Limpieza Facial',
    price: 25000,
    duration: 40,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Limpieza facial profunda para remover impurezas y puntos negros.',
    details: ['Exfoliación', 'Extracción de impurezas', 'Tonificación e hidratación'],
    includes: 'Limpieza + Hidratación',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=70&fm=webp'
  },
  {
    id: 'svc-m15',
    name: 'Mascarillas',
    price: 15000,
    duration: 20,
    category: 'men',
    workerRoles: ['barber'],
    description: 'Aplicación de mascarilla negra o hidratante de carbón activo.',
    details: ['Mascarilla purificante', 'Remoción suave', 'Tónico facial'],
    includes: 'Mascarilla + Tonificación',
    image: 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=900&q=70&fm=webp'
  }
];

// ============================================================
// TODOS LOS TRABAJADORES
// ============================================================
export const ALL_WORKERS = [...BARBERS];

// ============================================================
// SEDES / SUCURSALES
// ============================================================
export const BRANCHES = [
  {
    id: 'branch-1',
    name: 'Barber Kalvin',
    address: 'Bogotá, Colombia',
    phone: '573028676396'
  }
];

// ============================================================
// DATOS INICIALES DE RESERVAS (para demo)
// ============================================================
export const INITIAL_BOOKINGS = [];

