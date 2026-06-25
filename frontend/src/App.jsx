import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { useAuth } from './lib/AuthContext';

import CRM from './pages/CRM';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import InquiriesQuotations from './pages/InquiriesQuotations';
import InquirySources from './pages/InquirySources';
import Login from './pages/Login';
import ProductGroups from './pages/ProductGroups';
import Products from './pages/Products';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';


// 🔐 Protected Route
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// 🔓 Public Route (login page guard)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}


export default function App() {
  return (
    <Routes>

      {/* ✅ LOGIN (only when not logged in) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* 🔐 PROTECTED APP */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inquiries" element={<InquiriesQuotations />} />
        <Route path="inquiry-sources" element={<InquirySources />} />
        <Route path="crm" element={<CRM />} />
        <Route path="customers" element={<Customers />} />
        <Route path="products" element={<Products />} />
        <Route path="product-groups" element={<ProductGroups />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* ❌ Unknown route */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}