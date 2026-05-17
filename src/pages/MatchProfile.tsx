import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMatch } from "../lib/api";
import { format } from "date-fns";

export default function MatchProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await getMatch(id as string);
        if (res.response && res.response.length > 0) {
           setMatchData(res.response[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (matchData) {
       document.title = `${matchData.teams.home.name} vs ${matchData.teams.away.name} | Football.World`;
    }
  }, [matchData]);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4"><div className="h-64 flex items-center justify-center text-zinc-500 text-sm glass-panel rounded-2xl">Loading official football data...</div></div>;
  }

  if (!matchData) {
     return <div className="p-8 text-center glass-panel text-sm text-zinc-500 flex items-center justify-center h-64">No official information available currently.</div>;
  }

  const { fixture, league, teams, goals, score } = matchData;
  const matchDate = new Date(fixture.date);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
       <div className="glass-panel p-8 rounded-3xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center">
             <div 
               onClick={() => navigate(`/league/${league.id}`)}
               className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
             >
                <img src={league.logo} className="w-5 h-5 object-contain" alt={league.name} />
                <span className="text-xs font-bold uppercase tracking-widest">{league.name}</span>
             </div>

             <div className="flex w-full items-center justify-between md:justify-center md:gap-16">
                <div 
                  onClick={() => navigate(`/team/${teams.home.id}`)}
                  className="flex flex-col items-center gap-4 cursor-pointer group"
                >
                   <img src={teams.home.logo} className="w-20 h-20 md:w-32 md:h-32 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" alt={teams.home.name} />
                   <h2 className="font-bold text-sm md:text-xl text-center max-w-[120px] md:max-w-[200px]">{teams.home.name}</h2>
                </div>

                <div className="flex flex-col items-center gap-2">
                   <div className="px-4 py-1 rounded bg-accent-blue/10 border border-accent-blue/20 text-accent-blue font-bold text-xs uppercase tracking-widest">
                     {fixture.status.short}
                   </div>
                   <div className="text-4xl md:text-6xl font-black font-mono tracking-tighter drop-shadow-lg">
                      {goals.home ?? '-'}<span className="text-white/30 mx-2">-</span>{goals.away ?? '-'}
                   </div>
                   <div className="text-[10px] md:text-xs text-zinc-400 font-mono uppercase tracking-widest text-center mt-2">
                      {format(matchDate, 'MMM dd, yyyy')}<br/>
                      {format(matchDate, 'HH:mm')}
                   </div>
                </div>

                <div 
                  onClick={() => navigate(`/team/${teams.away.id}`)}
                  className="flex flex-col items-center gap-4 cursor-pointer group"
                >
                   <img src={teams.away.logo} className="w-20 h-20 md:w-32 md:h-32 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" alt={teams.away.name} />
                   <h2 className="font-bold text-sm md:text-xl text-center max-w-[120px] md:max-w-[200px]">{teams.away.name}</h2>
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl">
             <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-sm mb-4 border-b border-white/10 pb-2">Match Information</h3>
             <div className="space-y-3 font-mono text-sm text-zinc-300">
                <p><span className="text-zinc-500">Referee:</span> {fixture.referee || 'TBA'}</p>
                <p><span className="text-zinc-500">Venue:</span> {fixture.venue?.name || 'TBA'}</p>
                <p><span className="text-zinc-500">City:</span> {fixture.venue?.city || 'TBA'}</p>
                <p><span className="text-zinc-500">Country:</span> {league.country}</p>
             </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
             <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-sm mb-4 border-b border-white/10 pb-2">Status</h3>
             <div className="space-y-3 font-mono text-sm text-zinc-300">
                <p><span className="text-zinc-500">Time Elapsed:</span> {fixture.status.elapsed ? `${fixture.status.elapsed}'` : 'N/A'}</p>
                <p><span className="text-zinc-500">Half Time Score:</span> {score?.halftime?.home ?? '-'} - {score?.halftime?.away ?? '-'}</p>
                <p><span className="text-zinc-500">Full Time Score:</span> {score?.fulltime?.home ?? '-'} - {score?.fulltime?.away ?? '-'}</p>
             </div>
          </div>
       </div>
    </div>
  )
}
