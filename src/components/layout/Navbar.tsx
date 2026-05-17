import { Globe2, MoonIcon, SunIcon } from 'lucide-react';
import React from 'react';
import { ThemeContext } from '../ThemeProvider';
import { cn } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { theme, setTheme } = React.useContext(ThemeContext);
  const location = useLocation();

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-accent-blue" />
          <Link to="/">
            <span className="font-bold text-xl tracking-tight">Football.World</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <NavLink to="/" current={location.pathname}>Discover</NavLink>
          <NavLink to="/live" current={location.pathname}>Live Matches</NavLink>
          <NavLink to="/fixtures" current={location.pathname}>Fixtures</NavLink>
          <NavLink to="/leagues" current={location.pathname}>Leagues</NavLink>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-secondary-dark/10 dark:bg-white/10 px-3 py-1.5 rounded-full text-sm font-medium">
            <span>🇧🇩</span> <span className="hidden sm:inline">Bangladesh</span>
          </button>
          
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, current, children }: { to: string, current: string, children: React.ReactNode }) {
  const isActive = current === to || (to !== '/' && current.startsWith(to));
  return (
    <Link 
      to={to} 
      className={cn(
        "text-sm font-medium transition-colors hover:text-accent-blue",
        isActive ? "text-accent-blue dark:text-accent-blue" : "text-zinc-600 dark:text-zinc-400"
      )}
    >
      {children}
    </Link>
  )
}
