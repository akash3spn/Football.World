import { Globe2, MoonIcon, SunIcon } from 'lucide-react';
import React from 'react';
import { ThemeContext } from '../ThemeProvider';
import { cn } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import SmartSearch from '../SmartSearch';

export default function Navbar() {
  const { theme, setTheme } = React.useContext(ThemeContext);
  const location = useLocation();
  const [showCountries, setShowCountries] = React.useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-accent-blue" />
          <Link to="/">
            <span className="font-bold text-xl tracking-tight">Football<span className="text-accent-blue">.World</span></span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center space-x-6">
          <NavLink to="/" current={location.pathname}>Discover</NavLink>
          <NavLink to="/live" current={location.pathname}>Live</NavLink>
          <NavLink to="/international" current={location.pathname}>International</NavLink>
          <NavLink to="/fixtures" current={location.pathname}>Fixtures</NavLink>
          <NavLink to="/leagues" current={location.pathname}>Leagues</NavLink>
        </div>
        
        <div className="hidden md:block">
           <SmartSearch />
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowCountries(!showCountries)}
            className="flex items-center gap-1.5 bg-secondary-dark/50 dark:bg-white/10 px-2 py-1.5 md:px-3 rounded-full text-xs md:text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <span className="text-sm">🇧🇩</span> <span className="hidden sm:inline">Bangladesh</span>
          </button>
          
          {showCountries && (
             <div className="absolute top-12 right-12 w-48 bg-white/95 dark:bg-primary-dark/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 px-2 pt-2">Select Region</div>
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto hide-scrollbar">
                   <button onClick={() => setShowCountries(false)} className="text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex gap-2 items-center text-sm"><span className="text-lg">🇧🇩</span> Bangladesh</button>
                   <button onClick={() => setShowCountries(false)} className="text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex gap-2 items-center text-sm"><span className="text-lg">🇬🇧</span> UK</button>
                   <button onClick={() => setShowCountries(false)} className="text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex gap-2 items-center text-sm"><span className="text-lg">🇺🇸</span> USA</button>
                   <button onClick={() => setShowCountries(false)} className="text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex gap-2 items-center text-sm"><span className="text-lg">🇪🇸</span> Spain</button>
                   <button onClick={() => setShowCountries(false)} className="text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex gap-2 items-center text-sm"><span className="text-lg">🇧🇷</span> Brazil</button>
                </div>
             </div>
          )}
          
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 md:p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div className="md:hidden px-4 pb-3">
         <SmartSearch />
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
