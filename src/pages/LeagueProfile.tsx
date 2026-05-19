import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, PlusCircle, CheckCircle, Info, ChevronDown } from "lucide-react";
import { followEntity, unfollowEntity, getFollows } from "../lib/firebase";
import { getLeague, getStandings, getLeagueFixtures } from "../lib/api";
import { socket } from '../lib/socket';
import { format } from "date-fns";

export default function LeagueProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leagueData, setLeagueData] = useState<any>(null);
  const [availableSeasons, setAvailableSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeasonData, setLoadingSeasonData] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const lgRes = await getLeague(id as string);
        if (lgRes.response && lgRes.response.length > 0) {
          const lInfo = lgRes.response[0].league;
          const country = lgRes.response[0].country;
          const seasons = lgRes.response[0].seasons.sort((a: any, b: any) => b.year - a.year); // Sort descending
          setAvailableSeasons(seasons);
          
          let currentSeason = seasons.find((s: any) => s.current);
          if (!currentSeason && seasons.length > 0) {
              currentSeason = seasons[0];
          }
          setLeagueData({
            name: lInfo.name,
            country: lInfo.type === 'World' || lInfo.type === 'Cup' ? 'International' : country.name,
            logo: lInfo.logo,
          });
          
          if (currentSeason?.year) {
             setSelectedSeason(currentSeason.year);
          }
        }

        const follows = await getFollows(null);
        setFollowing(follows.some((f: any) => f.entityId === String(id) && f.entityType === 'league'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    const loadSeasonData = async () => {
       if (!id || !selectedSeason) return;
       
       try {
         setLoadingSeasonData(true);
         setStandings([]);
         setFixtures([]);
         
         const stRes = await getStandings(id as string, selectedSeason);
         if (stRes.response && stRes.response.length > 0) {
            const fetchedStandings = stRes.response[0].league?.standings;
            setStandings(Array.isArray(fetchedStandings) ? fetchedStandings : []);
         }
         
         const fixRes = await getLeagueFixtures(id as string, selectedSeason);
         if (fixRes && fixRes.response && Array.isArray(fixRes.response)) {
            setFixtures(fixRes.response);
         }
       } catch (err) {
         console.error(err);
       } finally {
         setLoadingSeasonData(false);
       }
    };
    
    loadSeasonData();
  }, [id, selectedSeason]);

  useEffect(() => {
    if (leagueData) {
      document.title = `${leagueData.name} Updates & Standings | Football.World`;
    }
  }, [leagueData]);

  useEffect(() => {
    socket.connect();
    
    const handleEvents = (data: any) => {
       if (data && data.response && Array.isArray(data.response)) {
          setFixtures(prevFixtures => {
             if (!Array.isArray(prevFixtures)) return prevFixtures;
             let updated = false;
             const nextFixtures = prevFixtures.map(f => {
                const liveMatch = data.response.find((live: any) => live.fixture?.id === f.fixture?.id);
                if (liveMatch) {
                   updated = true;
                   return liveMatch; 
                }
                return f;
             });
             return updated ? nextFixtures : prevFixtures;
          });
       }
    };

    socket.on('live_updates', handleEvents);

    return () => {
       socket.off('live_updates', handleEvents);
    };
  }, []);

  const toggleFollow = async () => {
     if (!leagueData) return;
     try {
       if (following) {
         await unfollowEntity(null, String(id), 'league');
         setFollowing(false);
       } else {
         await followEntity(null, String(id), 'league', leagueData.name, leagueData.logo);
         setFollowing(true);
       }
     } catch (e) {
       console.error(e);
     }
  }

  if (loading) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm glass-panel h-64 flex items-center justify-center">Loading official football data...</div>;
  if (!leagueData) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm glass-panel flex items-center justify-center h-64">No official information available currently.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
       <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between mb-8 overflow-hidden relative gap-4">
          <div className="absolute right-0 top-0 w-64 h-64 bg-accent-blue/10 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 flex items-center gap-6">
              <img src={leagueData.logo} className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" alt={leagueData.name} />
              <div>
                 <h1 className="text-3xl font-black">{leagueData.name}</h1>
                 <p className="text-zinc-600 dark:text-zinc-400 font-mono text-sm mb-2">{leagueData.country}</p>
                 {availableSeasons.length > 0 && (
                   <div className="relative inline-block w-32">
                     <select
                       value={selectedSeason || ''}
                       onChange={(e) => setSelectedSeason(Number(e.target.value))}
                       className="w-full appearance-none bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 text-zinc-900 dark:text-white text-sm font-bold py-1.5 pl-3 pr-8 rounded-lg outline-none focus:border-accent-blue/50 cursor-pointer"
                       disabled={loadingSeasonData}
                     >
                       {availableSeasons.map((season) => (
                         <option key={season.year} value={season.year} className="bg-[#111]">
                           {season.year} {season.current ? '(Current)' : ''}
                         </option>
                       ))}
                     </select>
                     <ChevronDown className="w-4 h-4 text-zinc-600 dark:text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                   </div>
                 )}
              </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-2">
            <button onClick={toggleFollow} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${following ? 'bg-accent-blue/10 text-accent-blue border-accent-blue' : 'bg-black/5 dark:bg-white/5 border-black/20 dark:border-white/20 hover:border-accent-blue/50'}`}>
               {following ? <><CheckCircle className="w-4 h-4" /> Following</> : <><PlusCircle className="w-4 h-4" /> Follow</>}
            </button>
            {following && (
               <button className="p-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 hover:text-accent-blue hover:border-accent-blue/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
               </button>
            )}
          </div>
       </div>

       <div className="space-y-6">
          <h3 className="text-lg font-bold">Standings & Groups</h3>
          
          {loadingSeasonData ? (
             <div className="p-12 text-center glass-panel border border-black/5 dark:border-white/5 rounded-2xl">
                 <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading season data...</p>
             </div>
          ) : standings.length === 0 ? (
            <div className="p-12 text-center glass-panel border border-black/5 dark:border-white/5 rounded-2xl">
               <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
               <p className="text-zinc-500 dark:text-zinc-400">Official standings information is currently unavailable.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
               {standings.map((groupMatches, idx) => (
                  <div key={idx} className="glass-panel p-4 md:p-6 rounded-2xl overflow-x-auto">
                     <h4 className="font-bold text-sm text-accent-blue mb-4 uppercase tracking-widest">{groupMatches[0]?.group || 'League Table'}</h4>
                     <table className="w-full text-xs text-left">
                        <thead className="text-zinc-500 dark:text-zinc-400 border-b border-black/10 dark:border-white/10 uppercase tracking-wider">
                           <tr>
                              <th className="font-medium pb-2 w-8 text-center">#</th>
                              <th className="font-medium pb-2 pl-2">Team</th>
                              <th className="font-medium pb-2 text-center">MP</th>
                              <th className="font-medium pb-2 text-center">W</th>
                              <th className="font-medium pb-2 text-center">D</th>
                              <th className="font-medium pb-2 text-center">L</th>
                              <th className="font-medium pb-2 text-center hidden sm:table-cell">GF</th>
                              <th className="font-medium pb-2 text-center hidden sm:table-cell">GA</th>
                              <th className="font-medium pb-2 text-center">GD</th>
                              <th className="font-medium pb-2 text-center px-2">Pts</th>
                           </tr>
                        </thead>
                        <tbody>
                           {Array.isArray(groupMatches) && groupMatches.map((teamData: any) => (
                              <tr key={teamData?.team?.id || Math.random()} className="border-b border-black/5 dark:border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="py-3 text-center">{teamData?.rank || '-'}</td>
                                 <td className="py-3 pl-2 flex items-center gap-2 max-w-[120px] md:max-w-none">
                                    <img src={teamData?.team?.logo || ''} className="w-5 h-5 object-contain drop-shadow-md bg-black/5 dark:bg-white/5 p-0.5 rounded" alt={teamData?.team?.name || 'Team'} />
                                    <span className="font-bold truncate">{teamData?.team?.name || 'Unknown Team'}</span>
                                 </td>
                                 <td className="py-3 text-center text-zinc-600 dark:text-zinc-400">{teamData?.all?.played ?? '-'}</td>
                                 <td className="py-3 text-center text-zinc-600 dark:text-zinc-400">{teamData?.all?.win ?? '-'}</td>
                                 <td className="py-3 text-center text-zinc-600 dark:text-zinc-400">{teamData?.all?.draw ?? '-'}</td>
                                 <td className="py-3 text-center text-zinc-600 dark:text-zinc-400">{teamData?.all?.lose ?? '-'}</td>
                                 <td className="py-3 text-center text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">{teamData?.all?.goals?.for ?? '-'}</td>
                                 <td className="py-3 text-center text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">{teamData?.all?.goals?.against ?? '-'}</td>
                                 <td className="py-3 text-center text-zinc-600 dark:text-zinc-400">{teamData?.goalsDiff ?? '-'}</td>
                                 <td className="py-3 text-center font-bold px-2">{teamData?.points ?? '-'}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               ))}
            </div>
          )}
       </div>

       <div className="mt-12 space-y-6">
          <h3 className="text-lg font-bold">Matches & Schedule</h3>
          {loadingSeasonData ? (
             <div className="p-12 text-center glass-panel border border-black/5 dark:border-white/5 rounded-2xl">
                 <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading season data...</p>
             </div>
          ) : fixtures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {fixtures.slice().reverse().slice(0, 20).map(match => (
                  <div 
                    key={match.fixture.id} 
                    onClick={() => navigate(`/match/${match.fixture.id}`)}
                    className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                  >
                     <div className="flex flex-col gap-1 w-[25%]">
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{format(new Date(match.fixture.date), 'MMM d, HH:mm')}</span>
                        <span className="text-xs font-bold text-accent-blue">{match.fixture.status.short}</span>
                     </div>
                     
                     <div className="flex items-center gap-4 flex-1 justify-center">
                        <div className="flex flex-col items-center gap-1 w-1/3">
                           <img src={match.teams.home.logo} className="w-8 h-8 object-contain" />
                           <span className="text-[10px] font-bold truncate w-full text-center">{match.teams.home.name}</span>
                        </div>
                        <div className="text-lg font-black italic tracking-tighter w-12 text-center text-black/90 dark:text-white/90">
                           {match.goals.home ?? '-'} <span className="opacity-50 font-sans mx-0.5">-</span> {match.goals.away ?? '-'}
                        </div>
                        <div className="flex flex-col items-center gap-1 w-1/3">
                           <img src={match.teams.away.logo} className="w-8 h-8 object-contain" />
                           <span className="text-[10px] font-bold truncate w-full text-center">{match.teams.away.name}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          ) : (
            <div className="p-8 text-center glass-panel border border-black/5 dark:border-white/5 rounded-2xl">
               <p className="text-zinc-500 dark:text-zinc-400 text-sm">No official fixtures available currently.</p>
            </div>
          )}
       </div>
    </div>
  )
}
