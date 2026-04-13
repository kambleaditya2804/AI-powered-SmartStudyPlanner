import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import NotificationBell from './NotificationBell';

const navLinks = [
  { to: '/',           label: 'Dashboard',  icon: '📊' },
  { to: '/schedule',   label: 'Schedule',   icon: '📅' },
  { to: '/topics',     label: 'Topics',     icon: '📚' },
  { to: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { to: '/progress',   label: 'Progress',   icon: '📈' },
  { to: '/pomodoro',   label: 'Pomodoro',   icon: '🍅' },
  { to: '/quiz', label: 'Quiz', icon: '🧠' },{ to: '/ai-flashcards', label: 'AI Cards', icon: '✨' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  return (
    <>
      <nav className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-500 tracking-tight shrink-0">
            StudyPlanner
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop user */}
          <div className="hidden md:flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.xp ?? 0} XP · {user?.streak ?? 0}🔥</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-gray-800"
            >
              Logout
            </button>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            <NotificationBell />
            <p className="text-xs text-gray-400">{user?.streak ?? 0}🔥 {user?.xp ?? 0}XP</p>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex flex-col gap-1.5 w-5">
                <span className={`block h-0.5 bg-gray-300 rounded transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block h-0.5 bg-gray-300 rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-gray-300 rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 top-[57px]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-gray-900 border-b border-gray-800 px-4 py-4 flex flex-col gap-1 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
              <div>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 px-3 py-1.5 rounded-lg bg-rose-500/10"
              >
                Logout
              </button>
            </div>
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}