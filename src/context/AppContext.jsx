/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, getDocs, setDoc, getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { BARBERS, SERVICES, BRANCHES } from '../data/mockData';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

const SERVICE_IMAGE_FALLBACKS = {
  'svc-m1': 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-m2': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-m3': 'https://images.unsplash.com/photo-1621605815841-28d944683b83?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-m4': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w1': 'https://images.unsplash.com/photo-1560066984-138daaa0345b?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w2': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w3': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w4': 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w5': 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w6': 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w7': 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w8': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w9': 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=70&fm=webp',
  'svc-w10': 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=70&fm=webp'
};

const getServiceImageFallback = (id, data) => {
  if (SERVICE_IMAGE_FALLBACKS[id]) return SERVICE_IMAGE_FALLBACKS[id];
  if (data.subcategory === 'unas') {
    return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=70&fm=webp';
  }
  if (data.subcategory === 'coloracion') {
    return 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=70&fm=webp';
  }
  if (data.category === 'women') {
    return 'https://images.unsplash.com/photo-1560066984-138daaa0345b?auto=format&fit=crop&w=900&q=70&fm=webp';
  }
  return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=70&fm=webp';
};

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([...BARBERS]);
  const [services, setServices] = useState([...SERVICES]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState(BRANCHES);
  const [closures, setClosures] = useState([]);
  const [appLoading, setAppLoading] = useState(true);

  // Seed initial data into Firestore if collections are empty or needs migration
  const seedInitialData = async () => {
    try {
      const migrationRef = doc(db, 'metadata', 'migration');
      const migrationSnap = await getDoc(migrationRef);
      const currentVersion = migrationSnap.exists() ? migrationSnap.data().version : 0;

      if (currentVersion < 3) {
        // Overwrite/Force Update branches
        for (const branch of BRANCHES) {
          await setDoc(doc(db, 'branches', branch.id), branch);
        }

        // Clear existing services to replace with new coherent pricing catalog
        const servicesSnap = await getDocs(collection(db, 'services'));
        for (const sDoc of servicesSnap.docs) {
          await deleteDoc(sDoc.ref);
        }
        const allServices = [...SERVICES];
        for (const service of allServices) {
          await setDoc(doc(db, 'services', service.id), service);
        }

        // Overwrite default workers to apply new schedule & branch
        const allWorkers = [...BARBERS];
        for (const worker of allWorkers) {
          await setDoc(doc(db, 'workers', worker.id), {
            ...worker,
            branchId: worker.branchId || 'branch-1'
          });
        }

        // Save migration version 3
        await setDoc(migrationRef, { version: 3 });
        console.log("Database successfully migrated to version 3 (Hollywood Services and Schedules)");
      } else {
        // Regular seeding in case of a clean database
        const branchesSnap = await getDocs(collection(db, 'branches'));
        if (branchesSnap.empty) {
          for (const branch of BRANCHES) {
            await setDoc(doc(db, 'branches', branch.id), branch);
          }
        }
        const workersSnap = await getDocs(collection(db, 'workers'));
        if (workersSnap.empty) {
          const allWorkers = [...BARBERS];
          for (const worker of allWorkers) {
            await setDoc(doc(db, 'workers', worker.id), {
              ...worker,
              branchId: worker.branchId || 'branch-1'
            });
          }
        }
        const servicesSnap = await getDocs(collection(db, 'services'));
        if (servicesSnap.empty) {
          const allServices = [...SERVICES];
          for (const service of allServices) {
            await setDoc(doc(db, 'services', service.id), service);
          }
        }
      }
    } catch (error) {
      console.error("Migration/Seeding error:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(true);
      if (!user) {
        setUsers([]);
      }
    }, 0);

    if (user) {
      seedInitialData().catch(error => {
        console.error("Seed initial data error:", error);
      });
    }

    // Listener: trabajadores
    const unsubWorkers = onSnapshot(collection(db, 'workers'), (snap) => {
      const loadedWorkers = snap.docs.map(d => {
        const data = d.data();
        let fallbackImg = 'https://images.unsplash.com/photo-1599351431247-f57930f489c3?w=400&h=400&fit=crop';
        if (data.category === 'women') {
          fallbackImg = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop';
        }
        return {
          ...data,
          id: d.id,
          branchId: data.branchId || 'branch-1',
          image: data.image && data.image.trim() !== "" ? data.image : fallbackImg
        };
      });
      // Si la BD de workers está vacía (BD nueva o migración pendiente), usar el fallback local de mockData
      if (loadedWorkers.length > 0) {
        setWorkers(loadedWorkers);
      } else {
        const allW = [...BARBERS];
        setWorkers(allW);
      }
    }, (error) => {
      console.error("Workers snapshot error:", error);
      const allW = [...BARBERS];
      setWorkers(allW);
    });

    // Listener: servicios
    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      const loadedServices = snap.docs.map(d => {
        const data = d.data();
        const fallbackImg = getServiceImageFallback(d.id, data);
        return {
          ...data,
          id: d.id,
          image: data.image && data.image.trim() !== "" ? data.image : fallbackImg,
          imageFallback: fallbackImg
        };
      });
      // Si la BD de servicios está vacía, usar el fallback local de mockData
      if (loadedServices.length > 0) {
        setServices(loadedServices);
      } else {
        const allS = [...SERVICES];
        setServices(allS);
      }
      setAppLoading(false);
    }, (error) => {
      console.error("Services snapshot error:", error);
      const allS = [...SERVICES];
      setServices(allS);
      setAppLoading(false);
    });

    // Listener: usuarios (solo si hay sesion)
    const unsubUsers = user
      ? onSnapshot(collection(db, 'users'), (snap) => {
          setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id })));
        }, (error) => {
          console.error("Users snapshot error:", error);
        })
      : () => {};

    // Listener: productos
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => {
      console.error('Products snapshot error:', error);
    });

    // Listener: ventas
    const unsubSales = onSnapshot(collection(db, 'sales'), (snap) => {
      setSales(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => {
      console.error('Sales snapshot error:', error);
    });

    // Listener: gastos
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      const loadedExpenses = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      loadedExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setExpenses(loadedExpenses);
    }, (error) => {
      console.error('Expenses snapshot error:', error);
    });

    // Listener: sedes
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      // Si Firestore todavía no tiene sedes (BD nueva o migración pendiente), usa los datos por defecto
      setBranches(loaded.length > 0 ? loaded : BRANCHES);
    }, (error) => {
      console.error('Branches snapshot error:', error);
      // En caso de error de red, usar los datos locales como fallback
      setBranches(BRANCHES);
    });

    // Listener: cierres de sedes
    const unsubClosures = onSnapshot(collection(db, 'closures'), (snap) => {
      setClosures(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => {
      console.error('Closures snapshot error:', error);
    });

    return () => {
      clearTimeout(timer);
      unsubWorkers();
      unsubServices();
      unsubUsers();
      unsubProducts();
      unsubSales();
      unsubExpenses();
      unsubBranches();
      unsubClosures();
    };
  }, [user]);



  const addWorker = async (workerData) => {
    const docRef = await addDoc(collection(db, 'workers'), { ...workerData, active: true });
    return docRef.id;
  };
  
  const updateWorker = async (id, data) => {
    await updateDoc(doc(db, 'workers', id), data);
    try {
      const userRef = doc(db, 'users', id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          name: data.name,
          image: data.image || '',
          phone: data.phone || ''
        });
      }
    } catch (err) {
      console.error("Error synchronizing worker updates to users:", err);
    }
  };
  
  const deleteWorker = async (id) => {
    await deleteDoc(doc(db, 'workers', id));
  };

  // --- Service CRUD ---
  const addService = async (serviceData) => {
    const docRef = await addDoc(collection(db, 'services'), serviceData);
    return docRef.id;
  };
  
  const updateService = async (id, data) => {
    await updateDoc(doc(db, 'services', id), data);
  };
  
  const deleteService = async (id) => {
    await deleteDoc(doc(db, 'services', id));
  };

  // --- Product CRUD ---
  const addProduct = async (productData) => {
    const docRef = await addDoc(collection(db, 'products'), productData);
    return docRef.id;
  };

  const updateProduct = async (id, data) => {
    await updateDoc(doc(db, 'products', id), data);
  };

  const deleteProduct = async (id) => {
    await deleteDoc(doc(db, 'products', id));
  };

  // Productos, ventas y gastos ahora se suscriben en el useEffect principal
  // (ver arriba, listeners unsubProducts, unsubSales, unsubExpenses)

  // Vender producto: reduce stock y registra la venta en Firestore
  const sellProduct = async (productId, quantity = 1, branchId = 'branch-1') => {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      console.error('Product not found for sale');
      return;
    }
    const product = productSnap.data();
    const newStock = (product.stock || 0) - quantity;
    if (newStock < 0) {
      console.warn('Attempted to sell more than in stock');
      return;
    }
    await updateDoc(productRef, { stock: newStock });
    const localISO = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().slice(0, -1);
    await addDoc(collection(db, 'sales'), {
      productId,
      productName: product.name,
      price: product.price,
      quantity,
      total: (product.price || 0) * quantity,
      branchId,
      date: localISO
    });
  };

  // Revertir una venta de producto y devolver stock
  const revertSale = async (saleId) => {
    try {
      const saleRef = doc(db, 'sales', saleId);
      const saleSnap = await getDoc(saleRef);
      if (!saleSnap.exists()) return;
      const sale = saleSnap.data();

      // Devolver stock al producto
      const productRef = doc(db, 'products', sale.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const product = productSnap.data();
        await updateDoc(productRef, {
          stock: (product.stock || 0) + (sale.quantity || 0)
        });
      }

      // Eliminar registro de venta
      await deleteDoc(saleRef);
    } catch (error) {
      console.error("Error reverting sale:", error);
      throw error;
    }
  };

  // Ingresos totales por ventas de productos
  const productRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);

  // --- Gastos (Expenses) CRUD ---
  const addExpense = async (expenseData) => {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expenseData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  };

  const updateExpense = async (id, data) => {
    await updateDoc(doc(db, 'expenses', id), data);
  };

  const deleteExpense = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  // Total de gastos del negocio
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Ganancia neta: ingresos por citas + ventas de productos - gastos
  const netProfit = productRevenue - totalExpenses;

  // --- User Role & Active Status Management ---
  const updateUserRole = async (uid, role) => {
    await updateDoc(doc(db, 'users', uid), { role });
    
    const workerRoles = ['barber'];
    if (workerRoles.includes(role)) {
      const workerSnap = await getDoc(doc(db, 'workers', uid));
      if (!workerSnap.exists()) {
        const userSnap = await getDoc(doc(db, 'users', uid));
        const userData = userSnap.data();
        await setDoc(doc(db, 'workers', uid), {
          id: uid,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          role,
          specialty: 'Servicios Generales',
          percentage: 50,
          branchId: 'branch-1',
          image: userData.image || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face',
          category: 'men',
          active: userData.active !== undefined ? userData.active : true,
          schedule: {
            monday: { start: '09:30', end: '19:30' },
            tuesday: { start: '09:30', end: '19:30' },
            wednesday: { start: '09:30', end: '19:30' },
            thursday: { start: '09:30', end: '19:30' },
            friday: { start: '09:30', end: '19:30' },
            saturday: { start: '09:30', end: '19:30' },
            sunday: { start: '10:00', end: '15:30' }
          }
        });
      } else {
        await updateDoc(doc(db, 'workers', uid), {
          role,
          category: 'men'
        });
      }
    } else {
      const workerSnap = await getDoc(doc(db, 'workers', uid));
      if (workerSnap.exists()) {
        await deleteDoc(doc(db, 'workers', uid));
      }
    }
  };

  // --- Branch CRUD ---
  const addBranch = async (branchData) => {
    const docRef = await addDoc(collection(db, 'branches'), branchData);
    return docRef.id;
  };
  
  const updateBranch = async (id, data) => {
    await updateDoc(doc(db, 'branches', id), data);
  };
  
  const deleteBranch = async (id) => {
    await deleteDoc(doc(db, 'branches', id));
  };

  // --- Closures CRUD ---
  const addClosure = async (closureData) => {
    await addDoc(collection(db, 'closures'), {
      ...closureData,
      createdAt: new Date().toISOString()
    });
  };

  const deleteClosure = async (id) => {
    await deleteDoc(doc(db, 'closures', id));
  };

  // --- Restablecer Base de Datos (Limpiar Citas, Ventas y Gastos) ---
  const resetDashboardData = async () => {
    const { getDocs, collection, writeBatch } = await import('firebase/firestore');
    try {
      const qBookings = await getDocs(collection(db, 'bookings'));
      const qSales = await getDocs(collection(db, 'sales'));
      const qExpenses = await getDocs(collection(db, 'expenses'));
      
      const batch = writeBatch(db);
      qBookings.docs.forEach(doc => batch.delete(doc.ref));
      qSales.docs.forEach(doc => batch.delete(doc.ref));
      qExpenses.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Error clearing database transactions:", error);
      return { success: false, message: error.message };
    }
  };

  const updateUserStatus = async (uid, active) => {
    await updateDoc(doc(db, 'users', uid), { active });
    
    const workerSnap = await getDoc(doc(db, 'workers', uid));
    if (workerSnap.exists()) {
      await updateDoc(doc(db, 'workers', uid), { active });
    }
  };

  const deleteUserDoc = async (uid) => {
    await deleteDoc(doc(db, 'users', uid));
    const workerSnap = await getDoc(doc(db, 'workers', uid));
    if (workerSnap.exists()) {
      await deleteDoc(doc(db, 'workers', uid));
    }
  };

  // Computed groups
  const barbers = workers.filter(w => w.role === 'barber');
  const menServices = services.filter(s => s.category === 'men' || !s.category);

  return (
    <AppContext.Provider value={{
      workers, services, users, products, sales, appLoading, branches,
      barbers, menServices,
      addWorker, updateWorker, deleteWorker,
      addService, updateService, deleteService,
      addProduct, updateProduct, deleteProduct,
      productRevenue,
      sellProduct,
      expenses, addExpense, updateExpense, deleteExpense,
      totalExpenses, netProfit,
      updateUserRole, updateUserStatus, deleteUserDoc,
      addBranch, updateBranch, deleteBranch,
      closures, addClosure, deleteClosure,
      revertSale,
      resetDashboardData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

