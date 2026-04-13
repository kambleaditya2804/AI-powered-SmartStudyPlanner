import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/authSlice';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400">StudyPlanner</h1>
          <p className="text-gray-400 mt-2 text-sm">Create your account and start crushing it.</p>
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 block mb-1">Full name</label>
            <input
              type="text" required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Aditya Kamble"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input
              type="password" required minLength={8}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 mt-1">
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}