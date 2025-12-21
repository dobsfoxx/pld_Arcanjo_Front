import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PLDBuilderPageV2 from './pages/PLDBuilderPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminAssignmentsPage from './pages/AdminAssignmentsPage';
import UserSubmissionsPage from './pages/UserSubmissionsPage';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './contexts/useAuth';
import { PldCatalogProvider } from './contexts/PldCatalogProvider';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Verificando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <PldCatalogProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <PLDBuilderPageV2 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pld-builder"
                element={
                  <ProtectedRoute>
                    <PLDBuilderPageV2 />
                  </ProtectedRoute>
                }
              />
              <Route path="/form" element={<Navigate to="/pld-builder" replace />} />
              <Route
                path="/admin/assignments"
                element={
                  <ProtectedRoute>
                    <AdminAssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/envios"
                element={
                  <ProtectedRoute>
                    <UserSubmissionsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </PldCatalogProvider>
    </AuthProvider>
  );
}

export default App;