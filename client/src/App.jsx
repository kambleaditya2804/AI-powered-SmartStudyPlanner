import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Pomodoro from './pages/Pomodoro';
import Topics from './pages/Topics';
import Progress from './pages/Progress';
import Flashcards from './pages/Flashcards';
import Schedule from './pages/Schedule';


const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/topics" element={
            <ProtectedRoute>
              <AppLayout><Topics /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute>
              <AppLayout><Progress /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/flashcards" element={
            <ProtectedRoute>
              <AppLayout><Flashcards /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute>
              <AppLayout><Schedule /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/pomodoro" element={
            <ProtectedRoute>
              <AppLayout><Pomodoro /></AppLayout>
            </ProtectedRoute>
          } />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}