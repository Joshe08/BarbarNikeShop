import AdminDashboard from './AdminDashboard';
import WorkerDashboard from './WorkerDashboard';

function Dashboard({ role }) {
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'barber' || role === 'stylist' || role === 'manicurist') return <WorkerDashboard />;
  return null;
}

export default Dashboard;
