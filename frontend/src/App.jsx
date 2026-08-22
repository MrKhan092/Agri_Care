import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import Unauthorized from './pages/Unauthorized';
import MandiPrice from './pages/MandiPrice';
import Weather from './pages/Weather';
import LandRecords from './pages/LandRecords';
import FarmNews from './pages/FarmNews';

// Smart redirect based on role
function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'farmer':
      return <Navigate to="/farmer/dashboard" replace />;
    case 'supplier':
      return <Navigate to="/supplier/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Farmer */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/mandi-price"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <MandiPrice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/weather"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <Weather />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/land-records"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <LandRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/news"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmNews />
              </ProtectedRoute>
            }
          />

          {/* Supplier */}
          <Route
            path="/supplier/dashboard"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: redirect based on role or to login */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
