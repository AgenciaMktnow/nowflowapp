import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ToastProvider } from './components/ui/ToastProvider';
import { SettingsProvider } from './contexts/SettingsContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/SignUp'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const SaasDashboard = lazy(() => import('./pages/admin/SaasDashboard'));
const TimeTracking = lazy(() => import('./pages/TimeTracking'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Contact = lazy(() => import('./pages/Contact'));
const Legal = lazy(() => import('./pages/Legal'));
const About = lazy(() => import('./pages/About'));
const Security = lazy(() => import('./pages/Security'));
const Help = lazy(() => import('./pages/Help'));
const NewTask = lazy(() => import('./pages/NewTask'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MyQueue = lazy(() => import('./pages/MyQueue'));
const TaskCalendar = lazy(() => import('./pages/TaskCalendar'));
const ClientPortfolios = lazy(() => import('./pages/ClientPortfolios'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const isRecovery = window.location.hash.includes('type=recovery');
  const location = useLocation();
  const { userProfile } = useAuth();

  if (loading || isRecovery) return <div className="flex min-h-screen items-center justify-center bg-background-dark text-white">Carregando...</div>;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile?.needs_password_change && location.pathname !== '/setup-password') {
    return <Navigate to="/setup-password" replace />;
  }

  if (!userProfile?.needs_password_change && location.pathname === '/setup-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function RootHandler() {
  const { session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("RootHandler: Visiting root with hash:", location.hash);
    if (location.hash.includes('type=recovery') || location.hash.includes('access_token') || location.hash.includes('error=')) {
      console.log("RootHandler: Auth hash detected at root! Forwarding to AuthCallback.");
    }
  }, [location]);

  if (location.hash.includes('type=recovery') || location.hash.includes('access_token') || location.hash.includes('error=')) {
    return <Navigate to={`/auth/callback${location.hash}`} replace state={{ from: location }} />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }


  return <LandingPage />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ErrorBoundary>
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background-dark text-white">Carregando...</div>}>
              <Routes>
              <Route path="/" element={<RootHandler />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/about" element={<About />} />
              <Route path="/security" element={<Security />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup-password" element={
                <ProtectedRoute>
                  <SetupPassword />
                </ProtectedRoute>
              } />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Routes with Layout */}
              <Route element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* <Route path="/" element={<Navigate to="/dashboard" replace />} />  <-- Removed */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="queue" element={<MyQueue />} /> {/* Corrected Component Name */}
                <Route path="kanban" element={<Projects />} />
                <Route path="calendar" element={<TaskCalendar />} />
                <Route path="clients" element={<ClientPortfolios />} />
                <Route path="projects/new" element={<CreateProject />} />
                <Route path="tasks/new" element={<NewTask />} />
                <Route path="tasks/:id" element={<TaskDetail />} />
                <Route path="tasks/:id/edit" element={<NewTask />} />
                <Route path="time-tracking" element={<TimeTracking />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin/saas" element={<SaasDashboard />} />
                <Route path="settings/*" element={<Settings />} />
                <Route path="help" element={<Help />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <ToastProvider />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
