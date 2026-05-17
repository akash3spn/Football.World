import { useEffect, useState } from "react";
import { getUpcomingFixtures } from "../lib/api";
import { format } from "date-fns";

export default function Fixtures() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingFixtures().then(res => {
      if (res?.response) setUpcoming(res.response);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
       <h1 className="text-4xl font-bold tracking-tighter mb-8">GLOBAL SCHEDULE</h1>

       <div className="space-y-4">
          {loading ? (
             [1,2,3,4,5].map(i => <div key={i} className="h-20 glass-panel animate-pulse"></div>)
          ) : upcoming.length === 0 ? (
             <div className="p-6 text-center glass-panel">
                 <p className="text-zinc-500 text-lg">Official football information is currently unavailable.</p>
                 <p className="text-sm mt-2 text-zinc-600">Please provide a valid API_FOOTBALL_KEY in .env</p>
             </div>
          ) : (
             <>
                {/* Organize by league ideally, here just simple list */}
                {upcoming.map((match, i) => {
                  const dateObj = new Date(match.fixture.date);
                  return (
                    <div key={i} className="glass-panel p-4 flex flex-col md:flex-row items-center gap-6 group hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-6 md:w-1/4">
                        <div className="flex flex-col text-center">
                           <span className="text-2xl font-bold font-mono">{format(dateObj, 'HH:mm')}</span>
                           <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{format(dateObj, 'MMM dd')}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full flex items-center justify-between">
                         <div className="flex items-center gap-3 justify-end flex-1">
                           <span className="font-semibold text-lg">{match.teams.home.name}</span>
                           <img src={match.teams.home.logo} className="w-8 h-8 object-contain" />
                         </div>
                         <div className="px-6 py-2 mx-4 rounded bg-black/20 text-xs font-mono uppercase tracking-widest text-zinc-500">VS</div>
                         <div className="flex items-center gap-3 justify-start flex-1">
                           <img src={match.teams.away.logo} className="w-8 h-8 object-contain" />
                           <span className="font-semibold text-lg">{match.teams.away.name}</span>
                         </div>
                      </div>

                      <div className="md:w-1/4 flex flex-col items-center md:items-end">
                         <img src={match.league.logo} className="w-6 h-6 object-contain opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all mb-1" />
                         <span className="text-xs text-zinc-500 uppercase tracking-wider">{match.league.name}</span>
                      </div>
                    </div>
                  )
                })}
             </>
          )}
       </div>
    </div>
  )
}
