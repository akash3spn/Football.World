import { useState, useEffect } from "react";
import { SearchIcon, Trophy, Users } from "lucide-react";
import { apiClient } from "../lib/api";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{teams: any[], leagues: any[]}>({ teams: [], leagues: [] });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
       <div className="sticky top-16 z-10 pt-4 pb-8 bg-primary-dark transition-colors">
          <div className="relative">
             <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400" />
             <input 
               type="text" 
               placeholder="Search teams, leagues, players..." 
               value={query}
               onChange={e => setQuery(e.target.value)}
               className="w-full pl-14 pr-6 py-4 rounded-full glass-panel bg-white/5 outline-none focus:ring-2 focus:ring-accent-blue/50 text-sm md:text-base font-medium transition-all"
             />
             {loading && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
             )}
          </div>
       </div>

       {query.length >= 3 && results.teams.length === 0 && results.leagues.length === 0 && !loading && (
          <div className="text-center py-20">
             <p className="text-zinc-500 text-lg">Official football information is currently unavailable.</p>
          </div>
       )}

       <div className="space-y-12">
          {results.teams?.length > 0 && (
             <section>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">
                  <Users className="w-4 h-4" /> Teams
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {results.teams.map((t: any, i) => (
                      <div key={i} className="glass-panel p-4 flex items-center gap-4 hover:border-accent-blue/50 transition-colors cursor-pointer group">
                         <img src={t.team.logo} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                         <div>
                            <h4 className="font-bold">{t.team.name}</h4>
                            <p className="text-xs text-zinc-500">{t.team.country}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
          )}

          {results.leagues?.length > 0 && (
             <section>
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">
                  <Trophy className="w-4 h-4" /> Leagues
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {results.leagues.map((l: any, i) => (
                      <div key={i} className="glass-panel p-4 flex items-center gap-4 hover:border-accent-blue/50 transition-colors cursor-pointer group">
                         <img src={l.league.logo} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                         <div>
                            <h4 className="font-bold">{l.league.name}</h4>
                            <p className="text-xs text-zinc-500">{l.country.name}</p>
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
