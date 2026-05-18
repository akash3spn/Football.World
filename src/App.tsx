import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Home from './pages/Home';
import Live from './pages/Live';
import Search from './pages/Search';
import Fixtures from './pages/Fixtures';
import Profile from './pages/Profile';
import Leagues from './pages/Leagues';
import TeamProfile from './pages/TeamProfile';
import LeagueProfile from './pages/LeagueProfile';
import International from './pages/International';
import MatchProfile from './pages/MatchProfile';
import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';


import { getStatus } from './lib/api';

export default function App() {
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(true);

  useEffect(() => {
    // Check API status
    const checkApiStatus = async () => {
      try {
        const res = await getStatus();
        const hasErrors = res.errors && (Array.isArray(res.errors) ? res.errors.length > 0 : Object.keys(res.errors).length > 0);
        const isActive = res.response?.subscription?.active !== false;

        if (hasErrors || !isActive) {
           setApiUnavailable(true);
        }
      } catch (e) {
        setApiUnavailable(true);
      } finally {
        setIsCheckingApi(false);
      }
    };
    checkApiStatus();

    // Check if we should ask for notifications
    const asked = localStorage.getItem('fw_notif_asked');
    if (!asked && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => setShowNotifPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowNotifications = async () => {
    try {
      const perm = await Notification.requestPermission();
      localStorage.setItem('fw_notif_asked', 'true');
      setShowNotifPrompt(false);
      if (perm === 'granted') {
        alert('Notifications enabled! You will receive live updates for followed matches.');
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleDismissPrompt = () => {
    localStorage.setItem('fw_notif_asked', 'true');
    setShowNotifPrompt(false);
  }

  if (isCheckingApi) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
         <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#00D1FF] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-400 font-mono text-sm animate-pulse">Initializing Football.World...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors relative">
      {apiUnavailable && (
        <div className="bg-red-500/10 text-red-500 text-center py-2 text-xs font-bold font-mono z-50 relative border-b border-red-500/20">
           Football API connection unavailable. Using fallback data providers.
        </div>
      )}
      <Navbar />
      
      <main className="pt-[116px] md:pt-16 pb-20 md:pb-0 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/live-football-score" element={<Live />} />
          <Route path="/search" element={<Search />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/today-football-match" element={<Fixtures />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/international" element={<International />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team/:id" element={<TeamProfile />} />
          <Route path="/league/:id" element={<LeagueProfile />} />
          <Route path="/match/:id" element={<MatchProfile />} />
        </Routes>
      </main>

      <BottomNav />

      {showNotifPrompt && (
         <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[350px] bg-primary-dark/95 backdrop-blur-xl border border-accent-blue/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,209,255,0.2)] z-50 animate-in slide-in-from-bottom-5">
            <button onClick={handleDismissPrompt} className="absolute top-3 right-3 text-zinc-400 hover:text-white">
               <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-accent-blue" />
               </div>
               <div>
                  <h4 className="font-bold mb-1 font-sans">Enable football match notifications?</h4>
                  <p className="text-xs text-zinc-400 mb-3">Get live goal alerts and kickoff reminders for your followed teams.</p>
                  <div className="flex items-center gap-2">
                     <button onClick={handleAllowNotifications} className="px-4 py-1.5 bg-accent-blue text-black font-bold text-xs rounded-full hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition-all">Allow</button>
                     <button onClick={handleDismissPrompt} className="px-4 py-1.5 bg-white/5 text-white font-medium text-xs rounded-full hover:bg-white/10 transition-colors">Not now</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
