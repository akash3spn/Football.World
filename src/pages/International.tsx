import { Globe2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const INTERNATIONAL_TOURNAMENTS = [
   { id: 1, name: "FIFA World Cup", country: "World", logo: "https://media.api-sports.io/football/leagues/1.png" },
   { id: 4, name: "UEFA Euro", country: "World", logo: "https://media.api-sports.io/football/leagues/4.png" },
   { id: 9, name: "Copa America", country: "World", logo: "https://media.api-sports.io/football/leagues/9.png" },
   { id: 6, name: "AFC Asian Cup", country: "World", logo: "https://media.api-sports.io/football/leagues/6.png" },
   { id: 5, name: "UEFA Nations League", country: "World", logo: "https://media.api-sports.io/football/leagues/5.png" },
   { id: 22, name: "Olympic Football", country: "World", logo: "https://media.api-sports.io/football/leagues/22.png" },
];

export default function International() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "International Football | Football.World";
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
         <Globe2 className="w-8 h-8 text-accent-green" />
         <h1 className="text-3xl font-bold font-sans tracking-tight">International Football</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
         {INTERNATIONAL_TOURNAMENTS.map((league, i) => (
             <motion.div 
                key={league.id}
                onClick={() => navigate(`/international/${league.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-green/50 hover:bg-accent-green/5 transition-colors group"
             >
                <img src={league.logo} className="w-20 h-20 object-contain mb-4 group-hover:scale-110 transition-transform drop-shadow-md" alt={league.name} />
                <h3 className="font-bold text-sm">{league.name}</h3>
                <span className="text-[10px] uppercase text-zinc-500 tracking-wider mt-1">{league.country}</span>
             </motion.div>
         ))}
      </div>
    </div>
  )
}
