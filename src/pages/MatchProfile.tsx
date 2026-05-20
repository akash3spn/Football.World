import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMatch, getMatchEvents, getMatchStatistics, getMatchLineups, getMatchPlayers } from "../lib/api";
import { socket } from "../lib/socket";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Clock, MapPin, CheckCircle, Activity, 
  User, Flag, Shield, FileX, Tv, AlertCircle, Bell
} from "lucide-react";

type Tab = 'TIMELINE' | 'LINEUPS' | 'STATS' | 'PLAYERS';

export default function MatchProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('TIMELINE');
  const [goalNotification, setGoalNotification] = useState<{message: string, teamId: number} | null>(null);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScoreRef = useRef<{home: number, away: number} | null>(null);
  
  useEffect(() => {
    let intervalId: any;
    
    // Listen to real-time broadcasts
    socket.connect();
    
    const onLiveUpdates = async (data: any) => {
       if (data?.response) {
          const liveMatch = data.response.find((m: any) => String(m.fixture.id) === String(id));
          if (liveMatch) {
             setMatchData(liveMatch);
             
             // Fetch latest events and stats when significant changes happen
             try {
                const [uEv, uSt] = await Promise.all([
                  getMatchEvents(id as string).catch(() => null),
                  getMatchStatistics(id as string).catch(() => null)
                ]);
                if (uEv?.response) setEvents(uEv.response);
                if (uSt?.response) setStats(uSt.response);
             } catch (e) {}
          }
       }
    };
    
    socket.on('live_updates', onLiveUpdates);
    
    const fetchAll = async () => {
      try {
        const [res, evRes, stRes, liRes] = await Promise.all([
          getMatch(id as string),
          getMatchEvents(id as string).catch(() => null),
          getMatchStatistics(id as string).catch(() => null),
          getMatchLineups(id as string).catch(() => null)
        ]);
        
        if (res?.response?.[0]) {
           setMatchData(res.response[0]);
           if (evRes?.response) setEvents(evRes.response);
           if (stRes?.response) setStats(stRes.response);
           if (liRes?.response) setLineups(liRes.response);
           
           const status = res.response[0].fixture.status.short;
           const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'].includes(status);
           
           if (isLive && !intervalId) {
             intervalId = setInterval(async () => {
                try {
                  const [uRes, uEv, uSt] = await Promise.all([
                    getMatch(id as string),
                    getMatchEvents(id as string).catch(() => null),
                    getMatchStatistics(id as string).catch(() => null)
                  ]);
                  if (uRes?.response?.[0]) setMatchData(uRes.response[0]);
                  if (uEv?.response) setEvents(uEv.response);
                  if (uSt?.response) setStats(uSt.response);
                } catch(e) {}
             }, 15000); // 15 seconds for more aggressive polling if sockets fail
           }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAll();
    
    return () => {
       clearInterval(intervalId);
       socket.off('live_updates', onLiveUpdates);
    };
  }, [id]);

  // Handle Goal Notifications
  useEffect(() => {
     if (matchData && matchData.goals && prevScoreRef.current) {
        const prev = prevScoreRef.current;
        const cur = matchData.goals;
        
        if (cur.home > prev.home) {
           triggerGoal(matchData.teams.home);
        } else if (cur.away > prev.away) {
           triggerGoal(matchData.teams.away);
        }
     }
     
     if (matchData) {
        prevScoreRef.current = { home: matchData.goals.home ?? 0, away: matchData.goals.away ?? 0 };
     }
  }, [matchData]);
  
  const triggerGoal = (team: any) => {
     setScoreFlash(true);
     setGoalNotification({ message: `GOAL! ${team.name} scores!`, teamId: team.id });
     setTimeout(() => setScoreFlash(false), 3000);
     setTimeout(() => setGoalNotification(null), 7000); // Hide after 7 seconds
  };

  useEffect(() => {
    if (matchData) {
       document.title = `${matchData.teams.home.name} vs ${matchData.teams.away.name} | Football.World`;
    }
  }, [matchData]);
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-accent-green animate-pulse" />
          <span className="text-zinc-600 dark:text-zinc-400 font-mono text-sm uppercase tracking-widest">Loading Live Match...</span>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
         <div className="p-8 text-center glass-panel text-sm text-zinc-500 dark:text-zinc-400 rounded-2xl flex flex-col items-center gap-4 py-16">
            <AlertCircle className="w-10 h-10 text-zinc-600" />
            No official match information available currently.
         </div>
      </div>
    );
  }

  const { fixture, league, teams, goals, score } = matchData;
  const matchDate = new Date(fixture.date);
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'].includes(fixture.status.short);
  
  const getEventIcon = (type: string, detail: string) => {
    if (type === 'Goal') return <div className="w-2.5 h-2.5 rounded-full bg-accent-green border border-black max-w-full"></div>;
    if (type === 'Card' && detail.includes('Yellow')) return <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm"></div>;
    if (type === 'Card' && detail.includes('Red')) return <div className="w-2.5 h-3.5 bg-red-500 rounded-sm"></div>;
    if (type === 'subst') return <ArrowLeft className="w-3 h-3 text-accent-blue" />; // simplified
    if (type === 'Var') return <Tv className="w-3 h-3 text-zinc-900 dark:text-white" />;
    return <Flag className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
       
       {/* Goal Notification Popup */}
       <AnimatePresence>
          {goalNotification && (
             <motion.div 
               initial={{ opacity: 0, y: -50, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9, y: -20 }}
               className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-panel border border-accent-green bg-black/80 p-4 rounded-2xl flex items-center gap-4 shadow-[0_0_40px_rgba(0,255,135,0.3)] min-w-[300px]"
             >
                <div className="w-12 h-12 bg-accent-green/20 rounded-full flex items-center justify-center animate-pulse shrink-0">
                   <Bell className="w-6 h-6 text-accent-green" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                   <span className="text-xl font-black italic tracking-tighter text-zinc-900 dark:text-white uppercase">{goalNotification.message}</span>
                   <span className="text-xs text-accent-green font-mono uppercase tracking-widest mt-0.5 animate-pulse">Live Update System</span>
                </div>
                {goalNotification.teamId === teams.home.id && <img src={teams.home.logo} className="w-10 h-10 object-contain drop-shadow-lg" />}
                {goalNotification.teamId === teams.away.id && <img src={teams.away.logo} className="w-10 h-10 object-contain drop-shadow-lg" />}
             </motion.div>
          )}
       </AnimatePresence>
       
       <button 
         onClick={() => navigate(-1)}
         className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm font-medium -mt-2"
       >
         <ArrowLeft className="w-4 h-4" />
         Back
       </button>
       
       {/* 1. LIVE MATCH HEADER */}
       <div className="glass-panel p-6 md:p-8 rounded-[2rem] relative overflow-hidden flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-green/5 via-transparent to-accent-blue/5"></div>
          
          <div className="relative z-10 w-full flex flex-col items-center">
             
             {/* League Info & Date */}
             <div className="flex flex-col items-center mb-6">
               <div 
                 onClick={() => navigate(`/league/${league.id}`)}
                 className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
               >
                  <img src={league.logo} className="w-5 h-5 object-contain" alt={league.name} />
                  <span className="text-xs font-bold uppercase tracking-widest">{league.name}</span>
               </div>
             </div>

             <div className="flex w-full items-center justify-between md:justify-center md:gap-16 lg:gap-24">
                {/* Home Team */}
                <div onClick={() => navigate(`/team/${teams.home.id}`)} className="flex flex-col items-center gap-3 cursor-pointer group flex-1">
                   <img src={teams.home.logo} className="w-16 h-16 md:w-28 md:h-28 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" alt={teams.home.name} />
                   <h2 className="font-bold text-xs md:text-xl text-center leading-tight hidden sm:block">{teams.home.name}</h2>
                   <h2 className="font-bold text-xs text-center leading-tight sm:hidden max-w-[80px]">{teams.home.name}</h2>
                </div>

                {/* Score & Status */}
                <div className="flex flex-col items-center justify-center -mt-4 w-1/3">
                   <div className={`px-4 py-1 rounded-full border mb-3 text-[10px] md:text-xs uppercase font-extrabold tracking-widest shadow-lg ${isLive ? 'bg-accent-green/10 text-accent-green border-accent-green/50 animate-pulse' : 'bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-black/10 dark:border-white/10'}`}>
                      {isLive ? `LIVE ${fixture.status.elapsed}'` : fixture.status.long}
                   </div>
                   
                   <div className={`text-4xl md:text-7xl font-black font-mono tracking-tighter drop-shadow-lg flex items-center gap-3 md:gap-6 ${scoreFlash ? 'animate-pulse scale-110 text-accent-green' : 'transition-all duration-500'}`}>
                      <span className={scoreFlash ? 'text-accent-green' : (goals.home > goals.away ? 'text-zinc-900 dark:text-white' : (goals.home < goals.away ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-white'))}>{goals.home ?? '-'}</span>
                      <span className={scoreFlash ? 'text-accent-green' : 'text-black/20 dark:text-white/20 font-sans font-light -mt-2'}>-</span>
                      <span className={scoreFlash ? 'text-accent-green' : (goals.away > goals.home ? 'text-zinc-900 dark:text-white' : (goals.away < goals.home ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-white'))}>{goals.away ?? '-'}</span>
                   </div>
                   
                   {/* Match Progress Bar */}
                   {isLive && fixture.status.elapsed && (
                      <div className="w-full max-w-[120px] mt-4 flex flex-col items-center gap-1">
                         <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-green rounded-full" style={{ width: `${Math.min(100, (fixture.status.elapsed / 90) * 100)}%` }}></div>
                         </div>
                         <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{90 - fixture.status.elapsed > 0 ? `${90 - fixture.status.elapsed} mins left` : 'Added Time'}</span>
                      </div>
                   )}
                   
                   {/* ET or Pens if applicable */}
                   {score?.penalty?.home !== null && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 font-mono">
                         Pens: {score.penalty.home} - {score.penalty.away}
                      </div>
                   )}
                </div>

                {/* Away Team */}
                <div onClick={() => navigate(`/team/${teams.away.id}`)} className="flex flex-col items-center gap-3 cursor-pointer group flex-1">
                   <img src={teams.away.logo} className="w-16 h-16 md:w-28 md:h-28 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" alt={teams.away.name} />
                   <h2 className="font-bold text-xs md:text-xl text-center leading-tight hidden sm:block">{teams.away.name}</h2>
                   <h2 className="font-bold text-xs text-center leading-tight sm:hidden max-w-[80px]">{teams.away.name}</h2>
                </div>
             </div>
             
             {/* Match Meta (Stadium/Ref) */}
             <div className="flex items-center gap-4 mt-8 pt-6 border-t border-black/5 dark:border-white/5 w-full justify-center flex-wrap">
                {fixture.venue?.name && (
                   <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{fixture.venue.name}, {fixture.venue.city}</span>
                   </div>
                )}
                {fixture.referee && (
                   <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      <User className="w-3.5 h-3.5" />
                      <span>Ref: {fixture.referee.split(',')[0]}</span>
                   </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                   <Clock className="w-3.5 h-3.5" />
                   <span>{format(matchDate, 'PPP HH:mm')}</span>
                </div>
             </div>

          </div>
       </div>
       
       {/* GOAL SCORERS SUMMARY */}
       {events.filter(e => e.type === 'Goal').length > 0 && (
         <div className="grid grid-cols-2 gap-4 px-2">
            <div className="flex flex-col gap-1 items-end pr-4 border-r border-black/10 dark:border-white/10">
               {events.filter(e => e.type === 'Goal' && e.team.id === teams.home.id).map((e, i) => (
                  <div key={i} className="text-xs flex flex-col items-end">
                     <span className="font-bold flex items-center justify-end gap-1"><span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">{e.time.elapsed}'</span> {e.player.name} {getEventIcon(e.type, e.detail)}</span>
                     {e.assist?.name && <span className="text-[10px] text-zinc-500 dark:text-zinc-400">ast: {e.assist.name}</span>}
                  </div>
               ))}
            </div>
            <div className="flex flex-col gap-1 items-start pl-4">
               {events.filter(e => e.type === 'Goal' && e.team.id === teams.away.id).map((e, i) => (
                  <div key={i} className="text-xs flex flex-col items-start">
                     <span className="font-bold flex items-center justify-start gap-1">{getEventIcon(e.type, e.detail)} {e.player.name} <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">{e.time.elapsed}'</span></span>
                     {e.assist?.name && <span className="text-[10px] text-zinc-500 dark:text-zinc-400">ast: {e.assist.name}</span>}
                  </div>
               ))}
            </div>
         </div>
       )}

       {/* Horizontal Tabs */}
       <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {(['TIMELINE', 'LINEUPS', 'STATS'] as Tab[]).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-widest transition-colors shrink-0 ${activeTab === tab ? 'bg-white text-black' : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-white/10'}`}
             >
               {tab}
             </button>
          ))}
       </div>

       {/* TAB CONTENT */}
       <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
             
             {/* TIMELINE TAB */}
             {activeTab === 'TIMELINE' && (
                <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                   <div className="glass-panel p-6 rounded-3xl">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Match Events</h3>
                      
                      {!events || events.length === 0 ? (
                         <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-sm">No events recorded yet.</div>
                      ) : (
                         <div className="relative">
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/10 dark:bg-white/10 -translate-x-1/2"></div>
                            <div className="space-y-4">
                               {events.map((ev: any, idx: number) => {
                                  const isHome = ev.team.id === teams.home.id;
                                  return (
                                     <div key={idx} className={`flex w-full items-center ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
                                        <div className={`w-1/2 ${isHome ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                                           <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5 inline-block max-w-full">
                                              <p className="font-bold text-sm text-zinc-900 dark:text-white">{ev.player.name}</p>
                                              <p className="text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mt-1">{ev.type} • {ev.detail}</p>
                                              {ev.assist?.name && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Assist: {ev.assist.name}</p>}
                                           </div>
                                        </div>
                                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-black/20 dark:border-white/20 flex flex-col items-center justify-center shadow-lg z-10">
                                           <span className="text-[10px] font-bold font-mono leading-none">{ev.time.elapsed}'</span>
                                        </div>
                                        <div className={`w-1/2 ${isHome ? 'pl-8 text-left' : 'pr-8 text-right'}`}>
                                            <img src={ev.team.logo} className="w-5 h-5 object-contain opacity-50" alt="team" />
                                        </div>
                                     </div>
                                  )
                               })}
                            </div>
                         </div>
                      )}
                   </div>
                </motion.div>
             )}

             {/* STATS TAB */}
             {activeTab === 'STATS' && (
                <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                   <div className="glass-panel p-6 rounded-3xl">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Team Statistics</h3>
                      
                      {!stats || stats.length < 2 ? (
                         <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-sm">Statistics unavailable for this match.</div>
                      ) : (
                         <div className="space-y-6">
                            <div className="flex justify-between items-center px-2 mb-4">
                               <img src={stats[0].team.logo} className="w-8 h-8 object-contain" />
                               <span className="font-mono text-zinc-500 dark:text-zinc-400 text-xs lowercase">VS</span>
                               <img src={stats[1].team.logo} className="w-8 h-8 object-contain" />
                            </div>
                            
                            {stats[0].statistics.map((st: any, idx: number) => {
                               const homeVal = st.value ?? 0;
                               const awayVal = stats[1].statistics[idx]?.value ?? 0;
                               
                               const parsedHome = typeof homeVal === 'string' && homeVal.includes('%') ? parseInt(homeVal.replace('%','')) : (parseInt(homeVal as string) || 0);
                               const parsedAway = typeof awayVal === 'string' && awayVal.includes('%') ? parseInt(awayVal.replace('%','')) : (parseInt(awayVal as string) || 0);
                               
                               const total = parsedHome + parsedAway;
                               const homePct = total > 0 ? (parsedHome / total) * 100 : 50;
                               const awayPct = total > 0 ? (parsedAway / total) * 100 : 50;
                               
                               return (
                                  <div key={idx} className="flex flex-col gap-2">
                                     <div className="flex justify-between items-center text-xs font-mono px-1">
                                        <motion.span 
                                           key={`home-${homeVal}`}
                                           initial={{ scale: 1.2, color: '#00ff87' }}
                                           animate={{ scale: 1, color: 'inherit' }}
                                           transition={{ duration: 0.5 }}
                                           className="font-bold text-zinc-900 dark:text-white"
                                        >
                                           {homeVal}
                                        </motion.span>
                                        <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[10px]">{st.type}</span>
                                        <motion.span 
                                           key={`away-${awayVal}`}
                                           initial={{ scale: 1.2, color: '#00ff87' }}
                                           animate={{ scale: 1, color: 'inherit' }}
                                           transition={{ duration: 0.5 }}
                                           className="font-bold text-zinc-900 dark:text-white"
                                        >
                                           {awayVal}
                                        </motion.span>
                                     </div>
                                     <div className="flex items-center w-full justify-center">
                                       <div className="flex-1 flex justify-end">
                                          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-l-full overflow-hidden flex justify-end">
                                             <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${homePct}%` }} 
                                                transition={{ type: "spring", bounce: 0, duration: 0.8 }} 
                                                className="h-full bg-zinc-900 dark:bg-white rounded-l-full">
                                             </motion.div>
                                          </div>
                                       </div>
                                       <div className="w-[1px] h-3 bg-black/10 dark:bg-white/10 mx-1 rounded-full" />
                                       <div className="flex-1 flex justify-start">
                                          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-r-full overflow-hidden flex justify-start">
                                             <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${awayPct}%` }}
                                                transition={{ type: "spring", bounce: 0, duration: 0.8 }} 
                                                className="h-full bg-accent-green rounded-r-full">
                                             </motion.div>
                                          </div>
                                       </div>
                                     </div>
                                  </div>
                               )
                            })}
                         </div>
                      )}
                   </div>
                </motion.div>
             )}

             {/* LINEUPS TAB */}
             {activeTab === 'LINEUPS' && (
                <motion.div key="lineups" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {!lineups || lineups.length < 2 ? (
                         <div className="col-span-full glass-panel p-10 text-center text-zinc-500 dark:text-zinc-400 text-sm rounded-3xl">Lineups not available for this match.</div>
                      ) : (
                         <>
                         {[lineups[0], lineups[1]].map((lineup, i) => (
                           <div key={i} className="glass-panel p-6 rounded-3xl">
                              <div className="flex justify-between items-center mb-6">
                                 <div className="flex items-center gap-3">
                                    <img src={lineup.team.logo} className="w-8 h-8 object-contain" />
                                    <div>
                                       <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{lineup.team.name}</h4>
                                       <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{lineup.formation || 'Formation TBC'}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <h5 className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Coach</h5>
                                    <p className="text-sm text-zinc-900 dark:text-white">{lineup.coach?.name || 'Unknown'}</p>
                                 </div>
                              </div>
                              
                              <h5 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 border-b border-black/10 dark:border-white/10 pb-2">Starting XI</h5>
                              <div className="space-y-2 mb-6">
                                 {lineup.startXI.map((playerObj: any, pIdx: number) => {
                                    const p = playerObj.player;
                                    return (
                                       <div key={pIdx} className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5">
                                          <div className="w-6 h-6 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded font-mono text-[10px] font-bold text-zinc-900 dark:text-white">
                                             {p.number || '-'}
                                          </div>
                                          <div className="flex-1">
                                             <div className="text-sm font-bold text-zinc-900 dark:text-white">{p.name}</div>
                                          </div>
                                          <div className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                                             {p.pos}
                                          </div>
                                       </div>
                                    )
                                 })}
                              </div>

                              <h5 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 border-b border-black/10 dark:border-white/10 pb-2">Substitutes</h5>
                              <div className="space-y-2">
                                 {lineup.substitutes.map((playerObj: any, pIdx: number) => {
                                    const p = playerObj.player;
                                    return (
                                       <div key={pIdx} className="flex items-center gap-3 p-2 bg-transparent rounded-lg">
                                          <div className="w-6 h-6 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                                             {p.number || '-'}
                                          </div>
                                          <div className="flex-1">
                                             <div className="text-sm text-zinc-600 dark:text-zinc-400">{p.name}</div>
                                          </div>
                                          <div className="text-[10px] text-zinc-600 font-mono">
                                             {p.pos}
                                          </div>
                                       </div>
                                    )
                                 })}
                              </div>
                              
                           </div>
                         ))}
                         </>
                      )}
                      
                   </div>
                </motion.div>
             )}

          </AnimatePresence>
       </div>
    </div>
  )
}
