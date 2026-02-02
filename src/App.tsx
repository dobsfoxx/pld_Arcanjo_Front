import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PLDBuilderPageV2 from './pages/PLDBuilderPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import AdminAssignmentsPage from './pages/AdminAssignmentsPage';
import AdminFormsPage from './pages/AdminFormsPage';
import AdminFormDetailPage from './pages/AdminFormDetailPage';
import UserSubmissionsPage from './pages/UserSubmissionsPage';
import UserFormsPage from './pages/UserFormsPage';
import NotFoundPage from './pages/NotFoundPage';
import HelpAdminPage from './pages/HelpAdminPage';
import HelpUserPage from './pages/HelpUserPage';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './contexts/useAuth';
import { PldCatalogProvider } from './contexts/PldCatalogProvider';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
        <p className="text-sm text-slate-500">Verificando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
        <p className="text-sm text-slate-500">Verificando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const BuilderRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
        <p className="text-sm text-slate-500">Verificando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const subscriptionActive = (user.subscriptionStatus || '').toUpperCase() === 'ACTIVE';
  const hasBuilderAccess = user.role === 'ADMIN' || user.role === 'TRIAL_ADMIN' || subscriptionActive;

  if (!hasBuilderAccess) {
    return <Navigate to="/payment" replace />;
  }

  return children;
};

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
        <p className="text-sm text-slate-500">Verificando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const subscriptionActive = (user.subscriptionStatus || '').toUpperCase() === 'ACTIVE';

  // Redirecionar baseado no papel/entitlement
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/forms" replace />;
  }

  if (user.role === 'TRIAL_ADMIN' || subscriptionActive) {
    return <Navigate to="/pld-builder" replace />;
  }
  
  return <Navigate to="/my-forms" replace />;
};

function App() {
  return (
    <AuthProvider>
      <PldCatalogProvider>
        <Router>
          <div className="min-h-screen bg-slate-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<HomeRedirect />} />
              <Route
                path="/pld-builder"
                element={
                  <BuilderRoute>
                    <PLDBuilderPageV2 />
                  </BuilderRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help/admin"
                element={
                  <ProtectedRoute>
                    <HelpAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help/user"
                element={
                  <ProtectedRoute>
                    <HelpUserPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/form" element={<Navigate to="/pld-builder" replace />} />
              <Route
                path="/admin/assignments"
                element={
                  <AdminRoute>
                    <AdminAssignmentsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/forms"
                element={
                  <BuilderRoute>
                    <AdminFormsPage />
                  </BuilderRoute>
                }
              />
              <Route
                path="/admin/forms/:id"
                element={
                  <BuilderRoute>
                    <AdminFormDetailPage />
                  </BuilderRoute>
                }
              />
              <Route
                path="/user/form/:id"
                element={
                  <ProtectedRoute>
                    <UserSubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forms/:id"
                element={
                  <ProtectedRoute>
                    <UserSubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-forms"
                element={
                  <ProtectedRoute>
                    <UserFormsPage />
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
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  borderRadius: '10px',
                  background: 'fff',
                  color: '#1e293b',
                  fontSize: '14px',
                  
                  
                  
                },
              }}
            />
          </div>
        </Router>
      </PldCatalogProvider>
    </AuthProvider>
  );
}

export default App;