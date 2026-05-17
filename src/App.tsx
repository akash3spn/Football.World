import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Home from './pages/Home';
import Live from './pages/Live';
import Search from './pages/Search';
import Fixtures from './pages/Fixtures';
import Profile from './pages/Profile';
import Leagues from './pages/Leagues';

export default function App() {
  return (
    <div className="min-h-screen transition-colors">
      <Navbar />
      
      <main className="pt-16 pb-20 md:pb-0 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Live />} />
          <Route path="/search" element={<Search />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}
