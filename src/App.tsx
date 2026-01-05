import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
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

  if (loading || isRecovery) return <div className="flex min-h-screen items-center justify-center bg-background-dark text-white">Carregando...</div>;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Routes with Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
