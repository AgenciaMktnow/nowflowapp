import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import TimeTracking from './pages/TimeTracking';

import NewTask from './pages/NewTask';
import TaskDetail from './pages/TaskDetail';
import Settings from './pages/Settings';
import Teams from './pages/Teams';

import Portfolio from './pages/Portfolio';
import TaskCalendar from './pages/TaskCalendar';
import { ToastProvider } from './components/ui/ToastProvider';
import { SettingsProvider } from './contexts/SettingsContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

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

            {/* Protected Routes with Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="kanban" element={<Projects />} />
              <Route path="calendar" element={<TaskCalendar />} />
              <Route path="projects/new" element={<CreateProject />} />
              <Route path="tasks/new" element={<NewTask />} />
              <Route path="tasks/:id" element={<TaskDetail />} />
              <Route path="tasks/:id/edit" element={<NewTask />} />
              <Route path="teams" element={<Teams />} />
              <Route path="time-tracking" element={<TimeTracking />} />
              <Route path="settings/*" element={<Settings />} />
            </Route>
          </Routes>
          <ToastProvider />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
