import { useEffect, useState } from "react";
import { getFollows, unfollowEntity } from "../lib/firebase";
import { Bell, Trophy } from "lucide-react";

export default function Profile() {
   const [follows, setFollows] = useState<any[]>([]);

   useEffect(() => {
      document.title = "My Followed Teams | Football.World";
      getFollows(null).then(setFollows);
   }, []);

   const requestNotifications = async () => {
      if (!('Notification' in window)) return;
      await Notification.requestPermission();
      alert('Notification permissions granted. You will receive updates for your followed teams.');
   };

   const handleUnfollow = async (entityId: string, entityType: 'team' | 'league') => {
       await unfollowEntity(null, entityId, entityType);
       setFollows(fs => fs.filter(f => f.entityId !== entityId));
   }

   return (
      <div className="max-w-4xl mx-auto px-4 py-8">
         <div className="glass-panel p-6 flex flex-col items-center justify-center text-center mb-8 bg-gradient-to-br from-white/5 to-transparent">
            <Trophy className="w-12 h-12 text-accent-blue mb-4 drop-shadow-[0_0_15px_rgba(0,209,255,0.5)]" />
            <h2 className="text-2xl font-bold font-sans tracking-tight">Your Followed Teams</h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-sm">
               Matches for teams you follow will appear here. Turn on notifications to receive live match alerts without needing an account.
            </p>
         </div>

         <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Following</h3>
            <button 
               onClick={requestNotifications}
               className="flex items-center justify-center gap-2 px-3 py-1.5 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded-full border border-accent-blue/50 text-xs font-bold transition-colors"
            >
               <Bell className="w-3 h-3" /> Enable Match Alerts
            </button>
         </div>

         {follows.length === 0 ? (
            <div className="p-8 text-center glass-panel">
               <p className="text-zinc-500">You are not following any teams or leagues yet.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               {follows.map(f => (
                  <div key={f.entityId} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <img src={f.entityLogo} className="w-10 h-10 object-contain drop-shadow-md" />
                         <div>
                            <h4 className="font-semibold text-sm truncate max-w-[120px]">{f.entityName}</h4>
                            <p className="text-[10px] uppercase text-zinc-500 tracking-wider">{f.entityType}</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => handleUnfollow(f.entityId, f.entityType)}
                         className="text-[10px] text-zinc-500 hover:text-red-500 uppercase font-bold tracking-widest px-2 py-1 rounded bg-black/20 transition-colors"
                      >
                         Unfollow
                      </button>
                  </div>
               ))}
            </div>
         )}
      </div>
   )
}
