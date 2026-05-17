import { useEffect, useState } from 'react';
import { getLiveFixtures, getUpcomingFixtures, getNews } from '../lib/api';
import { socket } from '../lib/socket';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Radio } from 'lucide-react';

export default function Home() {
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
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
        const [live, up, n] = await Promise.all([
          getLiveFixtures(),
          getUpcomingFixtures(),
          getNews()
        ]);
        if (live?.response) setLiveFixtures(live.response);
        if (up?.response) setUpcoming(up.response);
        if (n?.articles) setNews(n.articles);
      } catch (err) {
        console.error("Failed to fetch initial data");
      } finally {
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Hero Section / Trending Live */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-blue"></span>
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight">Trending Live</h2>
          <span className="bg-white/10 text-xs px-2 py-1 rounded-md font-mono">{liveFixtures.length} Matches</span>
        </div>

        {loading ? (
          <div className="h-48 glass-panel rounded-2xl animate-pulse"></div>
        ) : liveFixtures.length === 0 ? (
          <div className="h-32 flex items-center justify-center border border-white/10 rounded-2xl bg-white/5">
             <p className="text-zinc-500">Official football information is currently unavailable.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {liveFixtures.slice(0, 5).map((match, i) => (
              <LiveCard key={i} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* News and Upcoming Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Next 24 Hours */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold font-sans tracking-tight">Upcoming 24h</h2>
          <div className="space-y-3">
            {loading ? (
               [1,2,3].map(i => <div key={i} className="h-20 glass-panel rounded-xl animate-pulse"></div>)
            ) : upcoming.length === 0 ? (
               <div className="p-6 text-center border border-white/10 rounded-xl bg-white/5">
                 <p className="text-zinc-500">No official fixtures available right now.</p>
               </div>
            ) : upcoming.slice(0, 10).map((match, i) => (
               <FixtureRow key={i} match={match} />
            ))}
          </div>
        </div>

        {/* Live News */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-sans tracking-tight">Live News Feed</h2>
          <div className="space-y-4">
            {news.map((article, i) => (
              <motion.a 
                href={article.url}
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="block group cursor-pointer"
              >
                <div className="glass-panel p-4 rounded-xl overflow-hidden hover:bg-white/5 transition-colors border-l-4 border-l-accent-blue">
                   <p className="text-xs font-mono text-zinc-500 mb-2">{article.source}</p>
                   <h3 className="font-medium group-hover:text-accent-blue transition-colors line-clamp-2">{article.headline}</h3>
                   <p className="text-[10px] text-zinc-600 mt-3">{format(new Date(article.publishedAt), 'MMM dd, HH:mm')}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function LiveCard({ match }: { match: any }) {
  return (
    <div className="min-w-[280px] sm:min-w-[320px] snap-center glass-panel p-4 rounded-xl relative overflow-hidden group hover:border-accent-blue/50 transition-colors cursor-pointer">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent-blue/20 rounded-full blur-3xl group-hover:bg-accent-blue/30 transition-colors"></div>
      
      <div className="flex justify-between items-center mb-4 relative">
        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 truncate max-w-[150px]">
          {match.league?.name || 'Friendly'}
        </span>
        <span className="text-xs font-mono text-accent-blue animate-pulse">
          {match.fixture?.status?.elapsed}'
        </span>
      </div>

      <div className="flex items-center justify-between relative relative z-10">
        <div className="flex flex-col items-center gap-2 w-1/3">
          <img src={match.teams?.home?.logo} alt="Home" className="w-12 h-12 object-contain" />
          <span className="text-xs font-semibold text-center truncate w-full">{match.teams?.home?.name}</span>
        </div>
        
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="text-3xl font-display font-bold tracking-tighter">
            {match.goals?.home ?? 0} - {match.goals?.away ?? 0}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <img src={match.teams?.away?.logo} alt="Away" className="w-12 h-12 object-contain" />
           <span className="text-xs font-semibold text-center truncate w-full">{match.teams?.away?.name}</span>
        </div>
      </div>
    </div>
  );
}

function FixtureRow({ match }: { match: any }) {
  const dateObj = new Date(match.fixture.date);
  
  return (
    <div className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors group">
      <div className="flex items-center gap-4 w-1/4">
        <div className="flex flex-col">
          <span className="text-sm font-bold font-mono">{format(dateObj, 'HH:mm')}</span>
          <span className="text-[10px] text-zinc-500 uppercase">{format(dateObj, 'MMM dd')}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 w-1/2">
        <div className="flex items-center gap-2 justify-end w-1/2">
          <span className="text-sm font-medium truncate hidden sm:block">{match.teams.home.name}</span>
          <span className="text-sm font-medium truncate sm:hidden">{match.teams.home.name.substring(0,3).toUpperCase()}</span>
          <img src={match.teams.home.logo} className="w-6 h-6 object-contain" alt="" />
        </div>
        <span className="text-xs font-mono text-zinc-600 bg-black/20 px-2 py-1 rounded">VS</span>
        <div className="flex items-center gap-2 justify-start w-1/2">
          <img src={match.teams.away.logo} className="w-6 h-6 object-contain" alt="" />
          <span className="text-sm font-medium truncate hidden sm:block">{match.teams.away.name}</span>
          <span className="text-sm font-medium truncate sm:hidden">{match.teams.away.name.substring(0,3).toUpperCase()}</span>
        </div>
      </div>

      <div className="w-1/4 flex justify-end">
         <span className="text-xs text-zinc-500 truncate max-w-[80px] sm:max-w-[120px]">{match.league.name}</span>
      </div>
    </div>
  )
}
