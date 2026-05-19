import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Hardcoded core leagues since API-Football /leagues takes specific queries
const TOP_LEAGUES = [
   { id: 39, name: "Premier League", country: "England", logo: "https://media.api-sports.io/football/leagues/39.png" },
   { id: 140, name: "La Liga", country: "Spain", logo: "https://media.api-sports.io/football/leagues/140.png" },
   { id: 135, name: "Serie A", country: "Italy", logo: "https://media.api-sports.io/football/leagues/135.png" },
   { id: 78, name: "Bundesliga", country: "Germany", logo: "https://media.api-sports.io/football/leagues/78.png" },
   { id: 61, name: "Ligue 1", country: "France", logo: "https://media.api-sports.io/football/leagues/61.png" },
   { id: 2, name: "Champions League", country: "World", logo: "https://media.api-sports.io/football/leagues/2.png" },
   { id: 253, name: "MLS", country: "USA", logo: "https://media.api-sports.io/football/leagues/253.png" },
   { id: 307, name: "Saudi Pro League", country: "Saudi Arabia", logo: "https://media.api-sports.io/football/leagues/307.png" }
];

export default function Leagues() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Top Football Leagues & World Competitions | Football.World";
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
         <Trophy className="w-8 h-8 text-accent-blue" />
         <h1 className="text-3xl font-bold font-sans tracking-tight">Top Competitions</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {TOP_LEAGUES.map((league, i) => (
             <motion.div 
                key={league.id}
                onClick={() => navigate(`/league/${league.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-colors group"
             >
                <img src={league.logo} className="w-16 h-16 object-contain mb-4 group-hover:scale-110 transition-transform" alt={league.name} />
                <h3 className="font-bold text-sm">{league.name}</h3>
                <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 tracking-wider mt-1">{league.country}</span>
             </motion.div>
         ))}
      </div>
    </div>
  )
}
