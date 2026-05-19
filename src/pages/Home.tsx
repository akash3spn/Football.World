import React, { useEffect, useState } from 'react';
import { getLiveFixtures, getUpcomingFixtures, getNews } from '../lib/api';
import { socket } from '../lib/socket';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Radio, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Football.World | Premium Real-Time Ecosystem";

    socket.connect();
    socket.on('live_updates', (data) => {
      if (data?.errors && Object.keys(data.errors).length > 0) {
        setApiError(Object.values(data.errors).join(', '));
      } else if (data?.response) {
        setLiveFixtures(data.response);
        setApiError(null);
      }
    });

    socket.on('upcoming_updates', (data) => {
      if (data?.errors && Object.keys(data.errors).length > 0) {
        setApiError(Object.values(data.errors).join(', '));
      } else if (data?.response) {
        setUpcoming(data.response);
      }
    });

    const initNews = async () => {
      try {
        const n = await getNews();
        if (n?.articles) setNews(n.articles);
      } catch (e) {
        console.error("Failed to fetch news update");
      }
    };

    const init = async () => {
      try {
        const [live, up, n] = await Promise.all([
          getLiveFixtures(),
          getUpcomingFixtures(),
          getNews()
        ]);
        if (live?.errors && Object.keys(live.errors).length > 0) {
          setApiError(Object.values(live.errors).join(', '));
        } else if (live?.response) {
          setLiveFixtures(live.response);
        }
        if (up?.response) setUpcoming(up.response);
        if (n?.articles) setNews(n.articles);
      } catch (err) {
        console.error("Failed to fetch initial data");
      } finally {
        setLoading(false);
      }
    };
    init();

    const newsInterval = setInterval(initNews, 3600000); // 1 hour

    return () => {
      clearInterval(newsInterval);
      socket.off('live_updates');
      socket.off('upcoming_updates');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 lg:flex lg:gap-6 lg:space-y-0">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Trending Live */}
        <section className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/10 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-green"></span>
              </div>
              <h2 className="text-xl font-bold font-sans tracking-tight">Trending Live</h2>
            </div>
            <Link to="/live" className="text-xs font-bold text-accent-blue hover:underline flex items-center">
               View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="h-48 glass-panel rounded-2xl flex items-center justify-center animate-pulse">
               <span className="text-zinc-500 dark:text-zinc-400 text-sm">Loading official football data...</span>
            </div>
          ) : apiError ? (
            <div className="h-32 flex items-center justify-center border border-red-500/20 rounded-2xl bg-red-500/5">
               <p className="text-red-400 text-sm font-bold">{apiError}</p>
            </div>
          ) : liveFixtures.length === 0 ? (
            <div className="h-32 flex items-center justify-center border border-black/5 dark:border-white/5 rounded-2xl bg-black/5 dark:bg-white/5">
               <p className="text-zinc-500 dark:text-zinc-400 text-sm">No live matches currently.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar relative z-10">
              {liveFixtures.slice(0, 5).map((match, i) => (
                <LiveCard key={i} match={match} />
              ))}
            </div>
          )}
        </section>

        {/* Next 24 Hours */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold font-sans tracking-tight">Upcoming 24h</h2>
             <Link to="/fixtures" className="text-xs font-bold text-accent-blue hover:underline flex items-center">
               Full Schedule <ChevronRight className="w-4 h-4" />
             </Link>
          </div>
          
          <div className="space-y-3 overflow-y-auto hide-scrollbar flex-1">
            {loading ? (
               <div className="flex flex-col gap-3 py-4">
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm text-center">Loading official football data...</span>
                  {[1,2,3,4].map(i => <div key={i} className="h-20 glass-panel rounded-xl animate-pulse"></div>)}
               </div>
            ) : apiError ? (
               <div className="p-6 text-center border border-red-500/20 rounded-xl bg-red-500/5">
                 <p className="text-red-400 text-sm font-bold">{apiError}</p>
               </div>
            ) : upcoming.length === 0 ? (
               <div className="p-6 text-center border border-black/5 dark:border-white/5 rounded-xl bg-black/5 dark:bg-white/5">
                 <p className="text-zinc-500 dark:text-zinc-400 text-sm">Official football information currently unavailable.</p>
               </div>
            ) : upcoming.slice(0, 15).map((match, i) => (
               <FixtureRow key={i} match={match} onClick={() => navigate(`/match/${match.fixture.id}`)} />
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar Area */}
      <aside className="w-full lg:w-80 flex flex-col gap-6">
        {/* Live News */}
        <section className="glass-panel p-5 rounded-2xl flex-1 max-h-[600px] overflow-y-auto hide-scrollbar">
          <h2 className="text-sm font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-5">Global News Feed</h2>
          <div className="space-y-5">
            {news.map((article, i) => (
              <motion.a 
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-1 group block"
              >
                <span className="text-[9px] text-accent-blue font-bold tracking-widest uppercase">{article.source}</span>
                <h4 className="text-xs font-bold leading-relaxed mb-1 group-hover:text-accent-blue transition-colors line-clamp-2">{article.headline}</h4>
                <span className="text-[10px] opacity-40">{format(new Date(article.publishedAt), 'MMM dd, HH:mm')}</span>
              </motion.a>
            ))}
            
            {!loading && news.length === 0 && (
               <p className="text-zinc-500 dark:text-zinc-400 text-xs">News feed unavailable.</p>
            )}
          </div>
        </section>
        
        {/* Quick Links & Competitions */}
        <section className="glass-panel p-5 rounded-2xl space-y-6">
           <div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">Top Leagues</h3>
             <div className="grid grid-cols-2 gap-2 text-xs font-medium">
               <Link to="/league/39" className="p-2 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 hover:text-accent-blue transition-colors flex items-center gap-2"><img src="https://media.api-sports.io/football/leagues/39.png" className="w-4 h-4 object-contain" /> Premier League</Link>
               <Link to="/league/140" className="p-2 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 hover:text-accent-blue transition-colors flex items-center gap-2"><img src="https://media.api-sports.io/football/leagues/140.png" className="w-4 h-4 object-contain" /> La Liga</Link>
               <Link to="/league/135" className="p-2 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 hover:text-accent-blue transition-colors flex items-center gap-2"><img src="https://media.api-sports.io/football/leagues/135.png" className="w-4 h-4 object-contain" /> Serie A</Link>
               <Link to="/league/2" className="p-2 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 hover:text-accent-blue transition-colors flex items-center gap-2"><img src="https://media.api-sports.io/football/leagues/2.png" className="w-4 h-4 object-contain grayscale" /> UCL</Link>
             </div>
           </div>

           <div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">International</h3>
             <div className="flex flex-col gap-2 text-sm font-medium">
               <Link to="/league/1" className="p-3 rounded bg-black/5 dark:bg-white/5 border-l-2 border-l-accent-green hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer">
                  <span>FIFA World Cup</span>
                  <span className="text-[10px] text-accent-green bg-accent-green/10 px-2 py-0.5 rounded">Verified</span>
               </Link>
               <Link to="/league/4" className="p-3 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer">
                  <span>UEFA Euro</span>
               </Link>
               <Link to="/league/9" className="p-3 rounded bg-black/5 dark:bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between cursor-pointer">
                  <span>Copa America</span>
               </Link>
             </div>
           </div>
           
           <div className="pt-4 border-t border-black/10 dark:border-white/10 flex flex-col gap-2 text-sm font-medium">
             <Link to="/search" className="hover:text-accent-blue transition-colors">Search Teams & Players</Link>
             <Link to="/profile" className="hover:text-accent-blue transition-colors">My Followed Teams</Link>
           </div>
        </section>
      </aside>

    </div>
  )
}

function LiveCard({ match }: { match: any, key?: React.Key }) {
  return (
    <div className="min-w-[280px] sm:min-w-[300px] snap-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-accent-blue/50 transition-colors cursor-pointer">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">
          {match.league?.name || 'Friendly'}
        </span>
        <div className="flex items-center gap-2">
           <span className="px-2 py-0.5 bg-accent-green/10 text-accent-green rounded text-[9px] font-bold live-pulse">LIVE</span>
           <span className="text-xs font-mono font-bold">{match.fixture?.status?.elapsed}'</span>
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col items-center gap-2 w-1/3">
          <img src={match.teams?.home?.logo} alt="Home" className="w-10 h-10 object-contain drop-shadow-lg" />
          <span className="text-xs font-semibold text-center truncate w-full">{match.teams?.home?.name}</span>
        </div>
        
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="text-2xl font-black italic tracking-tighter">
            {match.goals?.home ?? 0} <span className="opacity-50 font-sans mx-1">-</span> {match.goals?.away ?? 0}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <img src={match.teams?.away?.logo} alt="Away" className="w-10 h-10 object-contain drop-shadow-lg" />
           <span className="text-xs font-semibold text-center truncate w-full">{match.teams?.away?.name}</span>
        </div>
      </div>
    </div>
  );
}

function FixtureRow({ match, onClick }: { match: any, onClick: () => void, key?: React.Key }) {
  const dateObj = new Date(match.fixture.date);
  
  return (
    <div onClick={onClick} className="glass-panel p-3 rounded-lg flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-accent-blue group">
      <div className="w-16 flex flex-col items-start gap-0.5">
         <span className="text-xs font-bold opacity-60 uppercase">{format(dateObj, 'MMM dd')}</span>
         <span className="text-[10px] font-bold opacity-40 uppercase">{format(dateObj, 'HH:mm')}</span>
      </div>

      <div className="flex items-center justify-center gap-3 flex-1 px-2">
        <div className="flex items-center gap-2 justify-end flex-1">
          <span className="text-sm font-semibold truncate max-w-[80px] sm:max-w-none">{match.teams.home.name}</span>
          <img src={match.teams.home.logo} className="w-5 h-5 object-contain drop-shadow-sm" alt="" />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">VS</span>
        <div className="flex items-center gap-2 justify-start flex-1">
          <img src={match.teams.away.logo} className="w-5 h-5 object-contain drop-shadow-sm" alt="" />
          <span className="text-sm font-semibold truncate max-w-[80px] sm:max-w-none">{match.teams.away.name}</span>
        </div>
      </div>

      <div className="w-20 text-right">
         <span className="text-[10px] text-accent-blue font-bold opacity-60 group-hover:opacity-100 transition-opacity truncate block">
           {match.league.name}
         </span>
      </div>
    </div>
  )
}
