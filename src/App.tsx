import React, { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';

import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import { getStatus } from './lib/api';

const Home = React.lazy(() => import('./pages/Home'));
const Live = React.lazy(() => import('./pages/Live'));
const Search = React.lazy(() => import('./pages/Search'));
const Fixtures = React.lazy(() => import('./pages/Fixtures'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Leagues = React.lazy(() => import('./pages/Leagues'));
const TeamProfile = React.lazy(() => import('./pages/TeamProfile'));
const LeagueProfile = React.lazy(() => import('./pages/LeagueProfile'));
const International = React.lazy(() => import('./pages/International'));
const InternationalProfile = React.lazy(() => import('./pages/InternationalProfile'));
const MatchProfile = React.lazy(() => import('./pages/MatchProfile'));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [isCheckingApi, setIsCheckingApi] = useState(true);

  useEffect(() => {
    // Check API status
    const checkApiStatus = async () => {
      try {
        const res = await getStatus().catch(() => ({ errors: { network: true } }));
        const hasErrors = res?.errors && (Array.isArray(res.errors) ? res.errors.length > 0 : Object.keys(res.errors).length > 0);
        const isActive = res?.response?.subscription?.active !== false;

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

  // Do not block rendering, let the UI shell load instantly
  // we will just not show the layout until ready, but wait, the instructions say 
  // "open instantly", "never stay stuck loading". 

  return (
    <div className="min-h-screen transition-colors relative">
      {apiUnavailable && (

        <div className="bg-red-500/10 text-red-500 text-center py-2 text-xs font-bold font-mono z-50 relative border-b border-red-500/20">
           Football API connection unavailable. Using fallback data providers.
        </div>
      )}
      <Navbar />
      
      <main className="pt-[116px] md:pt-16 pb-20 md:pb-0 min-h-screen">
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/international/:id" element={<InternationalProfile />} />
            <Route path="/match/:id" element={<MatchProfile />} />
          </Routes>
        </Suspense>
      </main>

      <BottomNav />

      {showNotifPrompt && (
         <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[350px] bg-white/95 dark:bg-primary-dark/95 backdrop-blur-xl border border-accent-blue/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,209,255,0.2)] z-50 animate-in slide-in-from-bottom-5">
            <button onClick={handleDismissPrompt} className="absolute top-3 right-3 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white">
               <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-accent-blue" />
               </div>
               <div>
                  <h4 className="font-bold mb-1 font-sans">Enable football match notifications?</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">Get live goal alerts and kickoff reminders for your followed teams.</p>
                  <div className="flex items-center gap-2">
                     <button onClick={handleAllowNotifications} className="px-4 py-1.5 bg-accent-blue text-black font-bold text-xs rounded-full hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition-all">Allow</button>
                     <button onClick={handleDismissPrompt} className="px-4 py-1.5 bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-white font-medium text-xs rounded-full hover:bg-white/10 transition-colors">Not now</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
