import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form.email, form.password);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400">StudyPlanner</h1>
          <p className="text-gray-400 mt-2 text-sm">Welcome back! Let's get studying.</p>
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 mt-1">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}