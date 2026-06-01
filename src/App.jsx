import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { AppProvider } from './context/AppContext';
import Home from './Page/Home';
import Login from './Page/Login';
import Register from './Page/Register';
import ForgotPassword from './Page/ForgotPassword';
import ResetPassword from './Page/ResetPassword';
import DashboardPage from './Page/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <BookingProvider>
            <Routes>
              <Route path="/"                element={<Home />} />
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />
              <Route path="/dashboard"       element={<DashboardPage />} />
            </Routes>
          </BookingProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
