import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMe } from './store/authSlice';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Topics from './pages/Topics';
import Flashcards from './pages/Flashcards';
import Schedule from './pages/Schedule';
import Progress from './pages/Progress';
import Pomodoro from './pages/Pomodoro';
import Quiz from './pages/Quiz';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedRoute({ children }) {
  const token = useSelector(state => state.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AuthRoute({ children }) {
  const token = useSelector(state => state.auth.token);
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
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [token, dispatch]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/schedule"   element={<ProtectedRoute><AppLayout><Schedule /></AppLayout></ProtectedRoute>} />
          <Route path="/topics"     element={<ProtectedRoute><AppLayout><Topics /></AppLayout></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><AppLayout><Flashcards /></AppLayout></ProtectedRoute>} />
          <Route path="/progress"   element={<ProtectedRoute><AppLayout><Progress /></AppLayout></ProtectedRoute>} />
          <Route path="/pomodoro"   element={<ProtectedRoute><AppLayout><Pomodoro /></AppLayout></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><AppLayout><Quiz /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}