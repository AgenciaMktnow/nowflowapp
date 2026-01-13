import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import SetupPassword from './pages/SetupPassword';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import SaasDashboard from './pages/admin/SaasDashboard';
import TimeTracking from './pages/TimeTracking';
import Roadmap from './pages/Roadmap';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import About from './pages/About';
import Security from './pages/Security';

import NewTask from './pages/NewTask';
import TaskDetail from './pages/TaskDetail';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

import MyQueue from './pages/MyQueue';
import TaskCalendar from './pages/TaskCalendar';
import { ToastProvider } from './components/ui/ToastProvider';
import { SettingsProvider } from './contexts/SettingsContext';

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

  // Production: Redirect to Login (Landing Page is WIP)
  if (!import.meta.env.DEV) {
    return <Navigate to="/login" replace />;
  }

  return <LandingPage />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
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
              <Route path="projects/new" element={<CreateProject />} />
              <Route path="tasks/new" element={<NewTask />} />
              <Route path="tasks/:id" element={<TaskDetail />} />
              <Route path="tasks/:id/edit" element={<NewTask />} />
              <Route path="time-tracking" element={<TimeTracking />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin/saas" element={<SaasDashboard />} />
              <Route path="settings/*" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastProvider />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
