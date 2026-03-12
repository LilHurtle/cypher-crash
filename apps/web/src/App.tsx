import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { DailyPlay } from './pages/DailyPlay';
import { Leaderboards } from './pages/Leaderboards';
import { Profile } from './pages/Profile';
import { BattlePass } from './pages/BattlePass';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/play"        element={<DailyPlay />} />
            <Route path="/leaderboard" element={<Leaderboards />} />
            <Route path="/battlepass"  element={<BattlePass />} />
            <Route path="/profile"     element={<Profile />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
