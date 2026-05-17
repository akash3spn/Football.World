import { useEffect, useState } from 'react';
import { getLiveFixtures } from '../lib/api';
import { socket } from '../lib/socket';
import { Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Live() {
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Live Football Scores & Match Updates | Football.World";

    socket.connect();
    socket.on('live_updates', (data) => {
      if (data?.response) {
        setLiveFixtures(data.response);
      }
    });

    const init = async () => {
      try {
        const live = await getLiveFixtures();
        if (live?.response) setLiveFixtures(live.response);
      } catch (err) { }
      finally {
        setLoading(false);
      }
    };
    init();

    return () => {
      socket.off('live_updates');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center text-center mb-12">
        <div className="relative flex h-8 w-8 mb-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF87] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-[#00FF87] items-center justify-center text-black">
            <Radio className="w-4 h-4" />
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 font-sans">LIVE MATCHES</h1>
        <p className="text-zinc-500 max-w-lg">Official real-world match events. Updates automatically sync via WebSocket.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
           <span className="text-zinc-500 text-sm text-center">Loading official football data...</span>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 glass-panel animate-pulse rounded-xl" />)}
           </div>
        </div>
      ) : liveFixtures.length === 0 ? (
        <div className="flex items-center justify-center py-20 border border-white/10 rounded-xl glass-panel text-center">
            <div className="space-y-4">
              <Radio className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-xl font-bold">No Live Matches</h3>
              <p className="text-zinc-500">No live matches currently.</p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveFixtures.map((match, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05 }}
               onClick={() => navigate(`/match/${match.fixture.id}`)}
               className="glass-panel p-5 rounded-xl group hover:border-[#00D1FF]/50 hover:bg-[#00D1FF]/5 transition-all cursor-pointer border border-white/5"
             >
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate">{match.league.name}</span>
                  <span className="text-[#00FF87] text-xs font-mono font-bold live-pulse">{match.fixture.status.elapsed}'</span>
                </div>
                
                <div className="flex items-center justify-between">
                   <div className="flex flex-col items-center w-1/3 gap-3">
                     <img src={match.teams.home.logo} className="w-16 h-16 object-contain drop-shadow-lg" />
                     <span className="text-sm font-semibold truncate w-full text-center">{match.teams.home.name}</span>
                   </div>
                   
                   <div className="w-1/3 flex flex-col items-center">
                     <span className="text-4xl font-black italic tracking-tighter shadow-black drop-shadow-xl">{match.goals.home} <span className="opacity-50 text-zinc-500 text-3xl font-sans font-light mx-1">-</span> {match.goals.away}</span>
                     <div className="mt-4 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded border border-white/10">
                        <span className="text-[10px] font-mono text-zinc-400">Possession: </span>
                        <span className="text-[10px] font-bold text-white">{match.statistics?.[0]?.statistics?.find((s:any) => s.type === 'Ball Possession')?.value || '50%'}</span>
                        <span className="text-[10px] text-zinc-600">-</span>
                        <span className="text-[10px] font-bold text-white">{match.statistics?.[1]?.statistics?.find((s:any) => s.type === 'Ball Possession')?.value || '50%'}</span>
                     </div>
                   </div>

                   <div className="flex flex-col items-center w-1/3 gap-3">
                     <img src={match.teams.away.logo} className="w-16 h-16 object-contain drop-shadow-lg" />
                     <span className="text-sm font-semibold truncate w-full text-center">{match.teams.away.name}</span>
                   </div>
                </div>
             </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
