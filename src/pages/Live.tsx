import { useEffect, useState } from 'react';
import { getLiveFixtures } from '../lib/api';
import { socket } from '../lib/socket';
import { Radio } from 'lucide-react';
import { motion } from 'motion/react';

export default function Live() {
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4444] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-[#FF4444] items-center justify-center text-white">
            <Radio className="w-4 h-4" />
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 font-sans">LIVE MATCHES</h1>
        <p className="text-zinc-500 max-w-lg">Official real-world match events. Updates automatically sync via WebSocket.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 glass-panel animate-pulse rounded-xl" />)}
        </div>
      ) : liveFixtures.length === 0 ? (
        <div className="flex items-center justify-center py-20 border border-white/10 rounded-xl glass-panel text-center">
            <div className="space-y-4">
              <Radio className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-xl font-bold">No Live Matches</h3>
              <p className="text-zinc-500">Official football information is currently unavailable.</p>
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
               className="glass-panel p-5 rounded-xl group hover:border-[#FF4444]/50 hover:bg-[#FF4444]/5 transition-all cursor-pointer"
             >
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate">{match.league.name}</span>
                  <span className="text-[#FF4444] text-xs font-mono font-bold animate-pulse">{match.fixture.status.elapsed}'</span>
                </div>
                
                <div className="flex items-center justify-between">
                   <div className="flex flex-col items-center w-1/3 gap-3">
                     <img src={match.teams.home.logo} className="w-16 h-16 object-contain drop-shadow-lg" />
                     <span className="text-sm font-semibold truncate w-full text-center">{match.teams.home.name}</span>
                   </div>
                   
                   <div className="w-1/3 flex flex-col items-center">
                     <span className="text-4xl font-black">{match.goals.home} - {match.goals.away}</span>
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
