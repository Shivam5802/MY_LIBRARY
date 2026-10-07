import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { OwnerLayout } from './layouts/OwnerLayout';
import { LoginPage } from './pages/LoginPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { SeatsPage } from './pages/SeatsPage';
import { StudentsListPage } from './pages/StudentsListPage';
import { AddStudentPage } from './pages/AddStudentPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { OwnerProfilePage } from './pages/OwnerProfilePage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPlaceholderPage } from './pages/ReportsPlaceholderPage';
import { DeveloperLayout } from './layouts/DeveloperLayout';
import { DeveloperDashboardPage } from './pages/DeveloperDashboardPage';
import { DeveloperIncomePage } from './pages/DeveloperIncomePage';
import { DeveloperReportsPage } from './pages/DeveloperReportsPage';
import { DeveloperActivityPage } from './pages/DeveloperActivityPage';
import { DeveloperSystemPage } from './pages/DeveloperSystemPage';
import { DeveloperProfilePage } from './pages/DeveloperProfilePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { Role } from './types/auth';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === Role.OWNER) {
    return <Navigate to="/owner" replace />;
  }

  if (user.role === Role.DEVELOPER) {
    return <Navigate to="/developer" replace />;
  }

  return <Navigate to="/unauthorized" replace />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect based on Auth State */}
          <Route path="/" element={<RootRedirect />} />

          {/* OWNER OPERATIONAL APPLICATION ROUTES */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <OwnerDashboardPage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/seats"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <SeatsPage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/students"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <StudentsListPage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/students/new"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <AddStudentPage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/students/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <StudentProfilePage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/profile"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <OwnerProfilePage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/payments"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <PaymentsPage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/reports"
            element={
              <ProtectedRoute allowedRoles={[Role.OWNER]}>
                <OwnerLayout>
                  <ReportsPlaceholderPage />
                </OwnerLayout>
              </ProtectedRoute>
            }
          />

          {/* DEVELOPER SECTION (Protected strictly with Role.DEVELOPER) */}
          <Route
            path="/developer"
            element={
              <ProtectedRoute allowedRoles={[Role.DEVELOPER]}>
                <DeveloperLayout>
                  <DeveloperDashboardPage />
                </DeveloperLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/developer/income"
            element={
              <ProtectedRoute allowedRoles={[Role.DEVELOPER]}>
                <DeveloperLayout>
                  <DeveloperIncomePage />
                </DeveloperLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/developer/reports"
            element={
              <ProtectedRoute allowedRoles={[Role.DEVELOPER]}>
                <DeveloperLayout>
                  <DeveloperReportsPage />
                </DeveloperLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/developer/activity"
            element={
              <ProtectedRoute allowedRoles={[Role.DEVELOPER]}>
                <DeveloperLayout>
                  <DeveloperActivityPage />
                </DeveloperLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/developer/system"
            element={
              <ProtectedRoute allowedRoles={[Role.DEVELOPER]}>
                <DeveloperLayout>
                  <DeveloperSystemPage />
                </DeveloperLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/developer/profile"
            element={
              <ProtectedRoute allowedRoles={[Role.DEVELOPER]}>
                <DeveloperLayout>
                  <DeveloperProfilePage />
                </DeveloperLayout>
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Access Denied Route */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
</ErrorBoundary>
);
};

export default App;
