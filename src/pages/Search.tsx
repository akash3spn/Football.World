import { useState, useEffect } from "react";
import { SearchIcon, Trophy, Users } from "lucide-react";
import { apiClient } from "../lib/api";
import { useNavigate, useLocation } from "react-router-dom";

export default function Search() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{teams: any[], leagues: any[]}>({ teams: [], leagues: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 3) {
      setResults({ teams: [], leagues: [] });
      return;
    }
    const timer = setTimeout(async () => {
       setLoading(true);
       try {
           const res = await apiClient.get('/search?q=' + encodeURIComponent(query));
           if (res.data) setResults(res.data);
       } catch (e) {
           console.error(e);
       } finally {
           setLoading(false);
       }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle setting document title for SEO
  useEffect(() => {
    document.title = "Search Teams & Leagues | Football.World";
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
       <div className="sticky top-16 z-10 pt-4 pb-8 bg-[#f7f7f9] dark:bg-primary-dark transition-colors">
         <div className="relative">
             <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-blue" />
             <input 
               type="text" 
               placeholder="Search teams, leagues, players..." 
               value={query}
               onChange={e => setQuery(e.target.value)}
               className="w-full pl-12 pr-12 py-4 rounded-xl glass-panel bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue text-sm md:text-base font-medium transition-all shadow-inner"
             />
             {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
             )}
          </div>
       </div>

       {query.length >= 3 && results.teams.length === 0 && results.leagues.length === 0 && !loading && (
          <div className="text-center py-20">
             <p className="text-zinc-500 dark:text-zinc-400 text-lg">Official football information is currently unavailable.</p>
          </div>
       )}

       <div className="space-y-12">
          {results.teams?.length > 0 && (
             <section>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6">
                  <Users className="w-4 h-4" /> Teams
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {results.teams.map((t: any, i) => (
                      <div 
                         key={i} 
                         onClick={() => navigate(`/team/${t.team.id}`)}
                         className="glass-panel p-4 flex items-center gap-4 hover:bg-white/10 hover:border-accent-blue/50 transition-colors cursor-pointer group border border-black/5 dark:border-white/5 rounded-xl"
                      >
                         <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 shadow-inner">
                           <img src={t.team.logo} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                         </div>
                         <div>
                            <h4 className="font-bold text-sm tracking-tight">{t.team.name}</h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest uppercase mt-0.5">{t.team.country}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
          )}

          {results.leagues?.length > 0 && (
             <section>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-6">
                  <Trophy className="w-4 h-4" /> Leagues
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {results.leagues.map((l: any, i) => (
                      <div 
                         key={i} 
                         onClick={() => navigate(`/league/${l.league.id}`)}
                         className="glass-panel p-4 flex items-center gap-4 hover:bg-white/10 hover:border-accent-blue/50 transition-colors cursor-pointer group border border-black/5 dark:border-white/5 rounded-xl"
                      >
                         <img src={l.league.logo} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform filter drop-shadow-md bg-black/5 dark:bg-white/5 p-1 rounded-lg" />
                         <div>
                            <h4 className="font-bold text-sm tracking-tight">{l.league.name}</h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest uppercase mt-0.5">{l.country.name}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
          )}
       </div>
    </div>
  )
}
