import { useEffect, useState } from "react";
import { getFixturesByDate } from "../lib/api";
import { format, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Fixtures() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Today's Football Match Schedule & Upcoming Fixtures | Football.World";
  }, []);

  useEffect(() => {
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    getFixturesByDate(dateStr).then(res => {
      if (res?.response) setFixtures(res.response);
      else setFixtures([]);
    }).finally(() => setLoading(false));
  }, [selectedDate]);

  // Generate an array of next 365 days
  const upcomingDays = Array.from({ length: 365 }).map((_, i) => addDays(new Date(), i));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
       <div className="md:w-64 shrink-0">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold font-sans tracking-tight">Calendar</h2>
             <input 
                type="date" 
                className="bg-transparent border border-black/20 dark:border-white/20 text-xs rounded-xl px-2 py-1 outline-none text-zinc-700 dark:text-zinc-300"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                   if (e.target.value) {
                      setSelectedDate(new Date(e.target.value));
                   }
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                max={format(addDays(new Date(), 365), 'yyyy-MM-dd')}
             />
          </div>
          <div className="flex overflow-x-auto md:flex-col gap-2 pb-4 hide-scrollbar max-h-[70vh] md:pr-2">
             {upcomingDays.map((date, i) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                   <button 
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`whitespace-nowrap md:whitespace-normal text-left px-4 py-3 rounded-xl font-medium transition-all ${isSelected ? 'bg-accent-blue text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]' : 'bg-black/5 dark:bg-white/5 hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'}`}
                   >
                      <div className="text-sm font-bold uppercase">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEEE')}</div>
                      <div className="text-xs opacity-70 font-mono mt-1">{format(date, 'MMM dd, yyyy')}</div>
                   </button>
                )
             })}
          </div>
       </div>

       <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h1 className="text-2xl font-bold tracking-tighter uppercase">Scheduled Matches</h1>
             <span className="text-xs font-mono bg-black/10 dark:bg-white/10 px-3 py-1 rounded text-zinc-600 dark:text-zinc-400">{format(selectedDate, 'MMM dd, yyyy')}</span>
          </div>

          {loading ? (
             <div className="flex flex-col gap-4">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm text-center">Loading official football data...</span>
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 glass-panel animate-pulse rounded-xl border border-black/5 dark:border-white/5"></div>)}
             </div>
          ) : fixtures.length === 0 ? (
             <div className="p-12 text-center glass-panel border border-black/5 dark:border-white/5 rounded-xl bg-black/5 dark:bg-white/5">
                 <p className="text-zinc-500 dark:text-zinc-400 text-sm">Official football information currently unavailable.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 gap-3">
                {fixtures.map((match, i) => {
                  const dateObj = new Date(match.fixture.date);
                  return (
                    <div 
                       key={i} 
                       onClick={() => navigate(`/match/${match.fixture.id}`)}
                       className="glass-panel p-4 flex flex-col md:flex-row md:items-center gap-4 group hover:bg-white/5 transition-colors border border-black/5 dark:border-white/5 cursor-pointer rounded-xl hover:border-accent-blue/50"
                    >
                      <div className="flex items-center justify-between md:justify-start gap-4 md:w-1/4 pb-3 md:pb-0 border-b border-black/5 dark:border-white/5 md:border-b-0">
                        <div className="flex flex-col text-left">
                           <span className="text-xl font-bold font-mono text-zinc-900 dark:text-white">{format(dateObj, 'HH:mm')}</span>
                           <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest">{format(dateObj, 'MMM dd')} - {match.fixture.status.short}</span>
                        </div>
                        <div className="md:hidden flex items-center gap-2">
                           <img src={match.league.logo} className="w-4 h-4 object-contain opacity-50 grayscale" />
                           <span className="text-[10px] text-accent-blue tracking-wider uppercase">{match.league.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full flex items-center justify-between px-2">
                         <div className="flex items-center gap-3 justify-end flex-1">
                           <span className="font-semibold text-sm sm:text-base md:text-lg truncate max-w-[100px] sm:max-w-[150px]">{match.teams.home.name}</span>
                           <img src={match.teams.home.logo} className="w-8 h-8 object-contain drop-shadow-lg" />
                         </div>
                         <div className="px-4 py-1.5 mx-4 rounded-lg bg-black/5 dark:bg-primary-dark/50 border border-black/10 dark:border-white/10 text-xs font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 min-w-[50px] text-center">
                            {match.fixture.status.short === 'FT' || match.fixture.status.short === 'HT' ? (
                               <span className="font-bold text-zinc-900 dark:text-white">{match.goals.home} - {match.goals.away}</span>
                            ) : 'VS'}
                         </div>
                         <div className="flex items-center gap-3 justify-start flex-1">
                           <img src={match.teams.away.logo} className="w-8 h-8 object-contain drop-shadow-lg" />
                           <span className="font-semibold text-sm sm:text-base md:text-lg truncate max-w-[100px] sm:max-w-[150px]">{match.teams.away.name}</span>
                         </div>
                      </div>

                      <div className="hidden md:flex md:w-1/4 flex-col items-end justify-center">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-accent-blue font-bold uppercase tracking-wider text-right">{match.league.name}</span>
                            <img src={match.league.logo} className="w-5 h-5 object-contain opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all bg-black/10 dark:bg-white/10 p-0.5 rounded-sm" />
                         </div>
                         <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest uppercase">{match.league.country}</span>
                      </div>
                    </div>
                  )
                })}
             </div>
          )}
       </div>
    </div>
  )
}
