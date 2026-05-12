import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FundManagement from './pages/FundManagement';
import BallManagement from './pages/BallManagement';
import PlayerManagement from './pages/PlayerManagement';
import Login from './pages/Login';
import Matches from './pages/Matches';
import MatchSetup from './pages/MatchSetup';
import MatchDetail from './pages/MatchDetail';
import LiveScoring from './pages/LiveScoring';
import StumpsContribution from './pages/StumpsContribution';
import BallsContribution from './pages/BallsContribution';
import BatsContribution from './pages/BatsContribution';
import Rules from './pages/Rules';
import CustomDialog from './components/CustomDialog';

function App() {
  const { theme, initFirebaseSync } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    initFirebaseSync();
  }, [initFirebaseSync]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="funds" element={<FundManagement />} />
            <Route path="stumps-contribution" element={<StumpsContribution />} />
            <Route path="balls-contribution" element={<BallsContribution />} />
            <Route path="bats-contribution" element={<BatsContribution />} />
            <Route path="balls" element={<BallManagement />} />
            <Route path="players" element={<PlayerManagement />} />
            <Route path="matches" element={<Matches />} />
            <Route path="matches/new" element={<MatchSetup />} />
            <Route path="matches/:id" element={<MatchDetail />} />
            <Route path="matches/:id/score" element={<LiveScoring />} />
            <Route path="login" element={<Login />} />
            <Route path="rules" element={<Rules />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <CustomDialog />
    </>
  );
}

export default App;
