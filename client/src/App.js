import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { io } from 'socket.io-client';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ConfettiBurst from './components/ConfettiBurst';
import RewardToast from './components/RewardToast';

import { useAuth } from './context/AuthContext';
import { useReward } from './context/RewardContext';

import Home from './pages/Home';
import ChallengeList from './pages/ChallengeList';
import ChallengeDetail from './pages/ChallengeDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CertificateCheckout from './pages/CertificateCheckout';

/**
 * App shell: global navigation layout, realtime progress syncing over
 * WebSockets, the confetti celebration layer, and the viral success reward
 * alert (toast + "Share Progress to Win" card).
 */
function AppShell() {
  const { confettiNonce } = useReward();
  const { user, refreshUser } = useAuth();

  // Realtime progress syncing: join the user's private room and refresh
  // stats whenever the server pushes a progress/leaderboard update.
  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socket.on('connect', () => {
      if (user?.id) socket.emit('join', `user:${user.id}`);
      socket.emit('join-leaderboard');
    });
    socket.on('progress:updated', () => {
      refreshUser();
    });
    return () => {
      socket.disconnect();
    };
  }, [user?.id, refreshUser]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <ConfettiBurst nonce={confettiNonce} />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/course" element={<Navigate to="/courses" replace />} />
          <Route path="/challenges" element={<ChallengeList />} />
          <Route path="/challenges/:slug" element={<ChallengeDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/certificate" element={<CertificateCheckout />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <RewardToast />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
