import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../Components/AdminDashboard';
import WorkerDashboard from '../Components/WorkerDashboard';
import ClientDashboard from '../Components/ClientDashboard';
import BookingModal from '../Components/BookingModal';
import Header from './Header';
import Footer from '../Components/Footer';

function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = (e) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const workerRoles = ['barber'];

  return (
    <div className="min-h-screen bg-neutral-950 overflow-x-hidden selection:bg-red-600 selection:text-white pt-[76px]">
      <Header onBookingClick={() => setIsBookingOpen(true)} />
      {user.role === 'admin' ? (
        <AdminDashboard />
      ) : workerRoles.includes(user.role) ? (
        <WorkerDashboard />
      ) : (
        <ClientDashboard />
      )}
      <Footer />

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

export default DashboardPage;
