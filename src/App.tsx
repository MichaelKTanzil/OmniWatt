import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import DevicesLayout from './layouts/DevicesLayout';
import DevicesList from './pages/DevicesList';
import AddDevice from './pages/AddDevice';
import Billing from './pages/Billing';
import Payment from './pages/Payment';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />
          
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="devices" element={<DevicesLayout />}>
              <Route index element={<DevicesList />} />
              <Route path="add" element={<AddDevice />} />
            </Route>
            <Route path="billing" element={<Billing />} />
            <Route path="payment" element={<Payment />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
