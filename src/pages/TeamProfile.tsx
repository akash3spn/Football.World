import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, Info, Shield, PlusCircle, CheckCircle } from "lucide-react";
import { followEntity, unfollowEntity, getFollows } from "../lib/firebase";
import { getTeam, getTeamCoach, getTeamSquad, getTeamFixtures } from "../lib/api";
import { format } from "date-fns";

export default function TeamProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teamObj, setTeamObj] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const [squad, setSquad] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<{last: any[], next: any[]}>({last: [], next: []});
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await getTeam(id as string);
        if (res.response?.[0]) {
           setTeamObj(res.response[0]);
        }
        
        try {
           const coachRes = await getTeamCoach(id as string);
           if (coachRes.response?.[0]) setCoach(coachRes.response[0]);
        } catch(e) {}
        
        try {
           const squadRes = await getTeamSquad(id as string);
           if (squadRes.response?.[0]?.players) setSquad(squadRes.response[0].players);
        } catch(e) {}
        
        try {
           const fixRes = await getTeamFixtures(id as string);
           setFixtures(fixRes);
        } catch(e) {}

        const follows = await getFollows(null);
        setFollowing(follows.some((f: any) => f.entityId === String(id) && f.entityType === 'team'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (teamObj) {
      document.title = `${teamObj.team.name} Profile | Football.World`;
    }
  }, [teamObj]);

  const toggleFollow = async () => {
     if (!teamObj) return;
     try {
       if (following) {
         await unfollowEntity(null, String(id), 'team');
         setFollowing(false);
       } else {
         await followEntity(null, String(id), 'team', teamObj.team.name, teamObj.team.logo);
         setFollowing(true);
       }
     } catch (e) {
       console.error(e);
     }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4"><div className="h-64 flex items-center justify-center text-zinc-500 text-sm glass-panel rounded-2xl">Loading official football data...</div></div>;
  }

  if (!teamObj) {
     return <div className="p-8 text-center glass-panel text-sm text-zinc-500 flex items-center justify-center h-64">No official information available currently.</div>;
  }

  const { team, venue } = teamObj;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
       <div className="relative glass-panel rounded-3xl overflow-hidden mb-8">
           <img src={venue.image} className="w-full h-48 object-cover opacity-30" alt={venue.name} />
           <div className="absolute inset-0 bg-gradient-to-t from-primary-dark to-transparent"></div>
           
           <div className="absolute bottom-6 left-6 flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-2 shadow-2xl">
                 <img src={team.logo} className="w-full h-full object-contain" alt={team.name} />
              </div>
              <div>
                 <h1 className="text-3xl font-black">{team.name}</h1>
                 <p className="font-mono text-zinc-400 text-sm">{team.country} • Est. {team.founded}</p>
                 <div className="mt-3 flex items-center gap-2">
                   <button onClick={toggleFollow} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${following ? 'bg-accent-blue/10 text-accent-blue border-accent-blue' : 'bg-white/5 border-white/20 hover:border-accent-blue/50'}`}>
                      {following ? <><CheckCircle className="w-4 h-4" /> Following</> : <><PlusCircle className="w-4 h-4" /> Follow</>}
                   </button>
                   {following && (
                      <button className="p-1.5 rounded-full bg-white/5 border border-white/20 hover:text-accent-blue hover:border-accent-blue/50 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                      </button>
                   )}
                 </div>
              </div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <section className="glass-panel p-6 rounded-2xl space-y-4">
             <h3 className="flex items-center gap-2 font-bold uppercase tracking-widest text-zinc-500 text-sm"><Info className="w-5 h-5"/> Venue & Info</h3>
             <div className="flex flex-col gap-2 font-mono text-sm">
                <p><span className="text-zinc-500">Stadium:</span> {venue.name}</p>
                <p><span className="text-zinc-500">City:</span> {venue.city}</p>
                <p><span className="text-zinc-500">Capacity:</span> {venue.capacity}</p>
             </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl space-y-4">
             <h3 className="flex items-center gap-2 font-bold uppercase tracking-widest text-zinc-500 text-sm"><Users className="w-5 h-5"/> Coach & Squad</h3>
             {coach || squad.length > 0 ? (
                <div className="space-y-4">
                   {coach && (
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 pb-3">
                         <img src={coach.photo} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={coach.name} />
                         <div>
                            <h4 className="font-bold text-sm w-full truncate">{coach.name}</h4>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Manager</p>
                         </div>
                      </div>
                   )}
                   {squad.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 hide-scrollbar">
                         {squad.slice(0, 20).map(player => (
                            <div key={player.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                               <img src={player.photo} className="w-8 h-8 rounded-full object-cover" alt={player.name} />
                               <div className="overflow-hidden">
                                  <h4 className="font-bold text-[11px] truncate w-full">{player.name}</h4>
                                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{player.position}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             ) : (
                <div className="flex items-center justify-center h-20 border border-white/5 rounded-xl bg-white/5">
                   <span className="text-zinc-500 text-xs">Squad information temporarily unavailable.</span>
                </div>
             )}
          </section>

          <section className="glass-panel p-6 rounded-2xl space-y-4">
             <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-sm border-b border-white/10 pb-2">Upcoming Fixtures</h3>
             {fixtures.next?.length > 0 ? (
                <div className="space-y-2">
                   {fixtures.next.map((match: any) => (
                      <div 
                        key={match.fixture.id} 
                        onClick={() => navigate(`/match/${match.fixture.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                      >
                         <div className="flex flex-col gap-1 w-12 text-center shrink-0">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{format(new Date(match.fixture.date), 'MMM d')}</span>
                            <span className="text-[11px] text-zinc-400">{format(new Date(match.fixture.date), 'HH:mm')}</span>
                         </div>
                         <div className="flex items-center gap-3 flex-1 justify-center max-w-[200px]">
                            <img src={match.teams.home.logo} className="w-6 h-6 object-contain" alt={match.teams.home.name} />
                            <span className="text-[10px] text-zinc-500 font-black">vs</span>
                            <img src={match.teams.away.logo} className="w-6 h-6 object-contain" alt={match.teams.away.name} />
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="flex items-center justify-center py-4 text-center">
                   <span className="text-zinc-500 text-xs">Loading schedule...</span>
                </div>
             )}
          </section>

          <section className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-1 border-t-0">
             <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-sm border-b border-white/10 pb-2">Recent Form</h3>
             {fixtures.last?.length > 0 ? (
                <div className="space-y-2">
                   {fixtures.last.map((match: any) => {
                      const isHome = match.teams.home.id === teamObj.team.id;
                      const myScore = isHome ? match.goals.home : match.goals.away;
                      const oppScore = isHome ? match.goals.away : match.goals.home;
                      const result = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D';
                      const color = result === 'W' ? 'text-accent-green bg-accent-green/10' : result === 'L' ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 bg-white/10';
                      return (
                         <div 
                           key={match.fixture.id} 
                           onClick={() => navigate(`/match/${match.fixture.id}`)}
                           className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                         >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${color}`}>
                               {result}
                            </div>
                            <div className="flex items-center gap-3 flex-1 px-4 justify-between">
                               <img src={match.teams.home.logo} className="w-5 h-5 object-contain" />
                               <span className="text-sm font-black text-white/90">{match.goals.home} - {match.goals.away}</span>
                               <img src={match.teams.away.logo} className="w-5 h-5 object-contain" />
                            </div>
                         </div>
                      );
                   })}
                </div>
             ) : (
                <div className="flex items-center justify-center py-4 text-center">
                   <span className="text-zinc-500 text-xs">Recent match data unavailable.</span>
                </div>
             )}
          </section>
       </div>
    </div>
  )
}
