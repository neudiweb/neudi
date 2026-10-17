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

// Custom history that resolves ?_route= from GitHub Pages 404 redirect
function createSpaHistory() {
  const base = createBrowserHistory({ basename: '/neudi' });
  const params = new URLSearchParams(window.location.search);
  const route = params.get('_route');
  if (route) {
    // Replace the URL to remove ?_route= and set the correct initial path
    base.replace(route);
  }
  return base;
}

const spaHistory = createSpaHistory();

function App() {
  return (
    <Router history={spaHistory}>
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
    </Router>
  );
}

export default App;
