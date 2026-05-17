import { useEffect, useState } from "react";
import { auth, loginWithGoogle, logout, getFollows, unfollowEntity } from "../lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { LogOut, UserIcon, Bell } from "lucide-react";

export default function Profile() {
   const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
   const [follows, setFollows] = useState<any[]>([]);

   useEffect(() => {
      const unsub = auth.onAuthStateChanged(u => {
          setUser(u);
          if (u) {
              getFollows(u.uid).then(setFollows);
          } else {
              setFollows([]);
          }
      });
      return () => unsub();
   }, []);

   const handleUnfollow = async (entityId: string, entityType: 'team' | 'league') => {
       if (!user) return;
       await unfollowEntity(user.uid, entityId, entityType);
       setFollows(fs => fs.filter(f => f.entityId !== entityId));
   }

   if (!user) {
       return (
           <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-accent-blue/10 flex items-center justify-center rounded-full mb-6">
                 <UserIcon className="w-10 h-10 text-accent-blue" />
              </div>
              <h1 className="text-3xl font-bold font-sans tracking-tight mb-4">Join Football.World</h1>
              <p className="text-zinc-500 mb-8">Follow your favorite teams, get real-time match notifications, and sync across your devices.</p>
              <button 
                 onClick={loginWithGoogle}
                 className="w-full bg-accent-blue text-black font-bold py-4 rounded-full hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
              >
                  Continue with Google
              </button>
           </div>
       )
   }

   return (
      <div className="max-w-4xl mx-auto px-4 py-8">
         <div className="glass-panel p-6 flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <img src={user.photoURL || ''} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-accent-blue" />
               <div>
                  <h2 className="text-xl font-bold">{user.displayName}</h2>
                  <p className="text-xs text-zinc-500">{user.email}</p>
               </div>
            </div>
            <button onClick={logout} className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors">
               <LogOut className="w-5 h-5" />
            </button>
         </div>

         <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Following</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
               <Bell className="w-4 h-4" /> Notifications Active
            </div>
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
                         <img src={f.entityLogo} className="w-10 h-10 object-contain" />
                         <div>
                            <h4 className="font-semibold text-sm truncate max-w-[120px]">{f.entityName}</h4>
                            <p className="text-[10px] uppercase text-zinc-500 tracking-wider">{f.entityType}</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => handleUnfollow(f.entityId, f.entityType)}
                         className="text-[10px] text-zinc-500 hover:text-red-500 uppercase font-bold tracking-widest px-2 py-1 rounded bg-black/20"
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
