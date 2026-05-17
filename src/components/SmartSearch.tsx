import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchEntities } from '../lib/api';

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ teams: any[]; leagues: any[] }>({ teams: [], leagues: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ teams: [], leagues: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const data = await searchEntities(query);
        // api returns { teams: [...], leagues: [...] }
        setResults({ 
          teams: data.teams?.slice(0, 5) || [], 
          leagues: data.leagues?.slice(0, 3) || [] 
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectTeam = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/team/${id}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectLeague = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/league/${id}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full md:w-64 lg:w-80 transition-all duration-300 z-50" ref={wrapperRef}>
      <div className={`relative flex items-center bg-white/5 border border-white/10 rounded-full transition-all focus-within:border-accent-blue focus-within:ring-1 focus-within:ring-accent-blue focus-within:bg-black/50 ${isOpen ? 'rounded-b-none border-b-transparent' : ''}`}>
        <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder="Search teams, leagues..." 
          className="w-full bg-transparent pl-9 pr-8 py-1.5 text-sm outline-none placeholder:text-zinc-500 font-medium text-white h-[36px]"
        />
        {query && !loading && (
          <button onClick={handleClear} className="absolute right-3 p-0.5 text-zinc-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {loading && (
          <Loader2 className="w-3.5 h-3.5 absolute right-3 text-accent-blue animate-spin" />
        )}
      </div>

      {isOpen && (query.trim().length > 0) && (
        <div className="absolute top-full left-0 right-0 bg-primary-dark/95 backdrop-blur-xl border border-white/10 border-t-0 rounded-b-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 z-50">
          <div className="max-h-[70vh] md:max-h-96 overflow-y-auto hide-scrollbar">
            {loading && results.teams.length === 0 && results.leagues.length === 0 && (
              <div className="p-4 flex items-center gap-3 text-zinc-500 justify-center text-sm font-medium">
                 Searching...
              </div>
            )}
            
            {!loading && results.teams.length === 0 && results.leagues.length === 0 && (
              <div className="p-6 text-center text-zinc-500 text-sm">
                 No results found for "{query}"
              </div>
            )}

            {results.teams.length > 0 && (
              <div className="py-2">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                   <span>Teams</span>
                   <div className="h-px bg-white/10 flex-1"></div>
                </div>
                {results.teams.map((t: any, i) => (
                  <button 
                     key={`team-${i}`}
                     onClick={(e) => handleSelectTeam(t.team.id, e)}
                     className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors group"
                  >
                     <img src={t.team.logo} alt={t.team.name} className="w-6 h-6 object-contain drop-shadow-md group-hover:scale-110 transition-transform bg-white/5 p-0.5 rounded" />
                     <div className="flex-1 overflow-hidden">
                       <h5 className="text-sm font-bold truncate group-hover:text-accent-blue transition-colors text-white">{t.team.name}</h5>
                       <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase truncate">{t.team.country}</p>
                     </div>
                  </button>
                ))}
              </div>
            )}

            {results.leagues.length > 0 && (
              <div className="py-2 border-t border-white/5">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                   <span>Competitions</span>
                   <div className="h-px bg-white/10 flex-1"></div>
                </div>
                {results.leagues.map((l: any, i) => (
                  <button 
                     key={`league-${i}`}
                     onClick={(e) => handleSelectLeague(l.league.id, e)}
                     className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors group"
                  >
                     <img src={l.league.logo} alt={l.league.name} className="w-6 h-6 object-contain drop-shadow-md group-hover:scale-110 transition-transform bg-white/5 p-0.5 rounded" />
                     <div className="flex-1 overflow-hidden">
                       <h5 className="text-sm font-bold truncate group-hover:text-amber-400 transition-colors text-white">{l.league.name}</h5>
                       <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase truncate">{l.country?.name || 'World'}</p>
                     </div>
                  </button>
                ))}
              </div>
            )}
            
            {((results.teams.length > 0 || results.leagues.length > 0) && !loading) && (
               <div className="p-2 border-t border-white/5">
                  <button onClick={() => navigate(`/search?q=${query}`)} className="w-full text-center text-[10px] uppercase tracking-widest font-bold text-accent-blue py-2 hover:bg-accent-blue/10 rounded-lg transition-colors">
                     View all results
                  </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
