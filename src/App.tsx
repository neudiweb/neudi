import { Routes, Route, Navigate, createBrowserHistory, Router } from 'react-router-dom';
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

function App() {
  // Cuando GitHub Pages sirve el 404.html, redirige con ?_route=/register
  // Leemos ese param y lo aplicamos como estado inicial del history
  const initRoute = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const route = params.get('_route');
    if (route) {
      window.history.replaceState(null, '', route);
    }
    return route;
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
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
                <Navigate to="/dashboard/agenda" replace />
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
