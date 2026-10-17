import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import * as React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthGuard, PublicGuard, OnboardingGuard, PlanGuard } from './components/common/AuthGuard';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { BusinessPage } from './pages/BusinessPage';
import { BookingWizard } from './pages/BookingWizard';
import { DashboardAgenda } from './pages/dashboard/DashboardAgenda';
import { DashboardServices } from './pages/dashboard/DashboardServices';
import { DashboardClients } from './pages/dashboard/DashboardClients';
import { DashboardHours } from './pages/dashboard/DashboardHours';
import { DashboardSettings } from './pages/dashboard/DashboardSettings';

// Component that redirects from ?_route= query param to the actual path
function RouteRedirector() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const route = params.get('_route');
    if (route) {
      // Defer navigation to next microtask to avoid React 310 error
      // (Cannot update a component while rendering a different component)
      setTimeout(() => {
        navigate(route, { replace: true });
      }, 10);
    }
  }, [navigate]);
  return null;
}

function App() {
  return (
    <BrowserRouter basename="/neudi">
      <ThemeProvider>
        <AuthProvider>
          <RouteRedirector />
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <PublicGuard>
              <LoginPage />
            </PublicGuard>
          } />
          <Route path="/register" element={
            <PublicGuard>
              <RegisterPage />
            </PublicGuard>
          } />
          <Route path="/onboarding" element={
            <OnboardingGuard>
              <OnboardingPage />
            </OnboardingGuard>
          } />
          <Route path="/:slug" element={<BusinessPage />} />
          <Route path="/book/:slug" element={<BookingWizard />} />

          {/* Dashboard routes */}
          <Route path="/dashboard" element={
            <AuthGuard>
              <PlanGuard>
                <Navigate to="agenda" replace />
              </PlanGuard>
            </AuthGuard>
          } />
          <Route path="/dashboard/agenda" element={
            <AuthGuard>
              <PlanGuard>
                <DashboardAgenda />
              </PlanGuard>
            </AuthGuard>
          } />
          <Route path="/dashboard/services" element={
            <AuthGuard>
              <PlanGuard>
                <DashboardServices />
              </PlanGuard>
            </AuthGuard>
          } />
          <Route path="/dashboard/clients" element={
            <AuthGuard>
              <PlanGuard>
                <DashboardClients />
              </PlanGuard>
            </AuthGuard>
          } />
          <Route path="/dashboard/hours" element={
            <AuthGuard>
              <PlanGuard>
                <DashboardHours />
              </PlanGuard>
            </AuthGuard>
          } />
          <Route path="/dashboard/settings" element={
            <AuthGuard>
              <PlanGuard>
                <DashboardSettings />
              </PlanGuard>
            </AuthGuard>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
