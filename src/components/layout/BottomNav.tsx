import { Home, Radio, CalendarDays, Globe2, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 w-full glass-panel pb-safe border-t border-black/10 dark:border-white/10 z-50">
      <div className="flex justify-around items-center h-16">
        <NavButton to="/" icon={Home} label="Home" current={location.pathname} />
        <NavButton to="/live" icon={Radio} label="Live" current={location.pathname} />
        <NavButton to="/international" icon={Globe2} label="Global" current={location.pathname} />
        <NavButton to="/fixtures" icon={CalendarDays} label="Fixtures" current={location.pathname} />
        <NavButton to="/profile" icon={User} label="Profile" current={location.pathname} />
      </div>
    </div>
  );
}

function NavButton({ to, icon: Icon, label, current }: { to: string, icon: any, label: string, current: string }) {
  const isActive = current === to || (to !== '/' && current.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
        isActive ? "text-accent-blue" : "text-zinc-500 dark:text-zinc-400 dark:text-zinc-400"
      )}
    >
      <Icon className={cn("w-6 h-6", isActive && "animate-pulse")} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      {isActive && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-blue" />
      )}
    </Link>
  );
}
