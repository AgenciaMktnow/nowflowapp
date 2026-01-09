import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import SetupPassword from './pages/SetupPassword';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import TimeTracking from './pages/TimeTracking';

import NewTask from './pages/NewTask';
import TaskDetail from './pages/TaskDetail';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';


import MyQueue from './pages/MyQueue'; // Correct import
import TaskCalendar from './pages/TaskCalendar';
import { ToastProvider } from './components/ui/ToastProvider';
import { SettingsProvider } from './contexts/SettingsContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Check if we are in a recovery flow (hash contains type=recovery)
  const isRecovery = window.location.hash.includes('type=recovery');

  const location = useLocation();
  const { userProfile } = useAuth(); // Need profile to check flag

  if (loading || isRecovery) return <div className="flex min-h-screen items-center justify-center bg-background-dark text-white">Carregando...</div>;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // FORCE Setup Password Flow
  if (userProfile?.needs_password_change && location.pathname !== '/setup-password') {
    return <Navigate to="/setup-password" replace />;
  }

  // Prevent accessing Setup Password if already done
  if (!userProfile?.needs_password_change && location.pathname === '/setup-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirect handler for Root path to catch Supabase fallbacks
function RootHandler() {
  const { session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("RootHandler: Visiting root with hash:", location.hash);
    if (location.hash.includes('type=recovery') || location.hash.includes('access_token') || location.hash.includes('error=')) {
      console.log("RootHandler: Auth hash detected at root! Forwarding to AuthCallback.");
      // We use window.location.replace to preserve the hash which navigate might mess up or if we want to be explicit
      // But internal navigate is better for SPA.
      // Force navigate to AuthCallback WITH the hash
      // Using replace to not break history
      // We need to re-append the hash because navigate might strip it if not explicit
      // Actually navigate({ hash: location.hash }) works
    }
  }, [location]);

  if (location.hash.includes('type=recovery') || location.hash.includes('access_token') || location.hash.includes('error=')) {
    return <Navigate to={`/auth/callback${location.hash}`} replace state={{ from: location }} />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/" element={<RootHandler />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
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
