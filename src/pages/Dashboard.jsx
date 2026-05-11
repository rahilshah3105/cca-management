import { useStore } from '../store/useStore';
import { IndianRupee, CircleDashed, ArrowUpRight, ArrowDownRight, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { calculateInningsTotal } from '../utils/scoreCalculator';
import './Dashboard.css';

const BatIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6.5 16.5L16.2 6.8C16.8 6.2 17.8 6.2 18.4 6.8C19 7.4 19 8.4 18.4 9L8.7 18.7C8.1 19.3 7.1 19.3 6.5 18.7C5.9 18.1 5.9 17.1 6.5 16.5Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 19.5L7.2 22.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.6 5.4L18.6 2.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="19.2" cy="4.8" r="1.1" fill={color} />
  </svg>
);

const Dashboard = () => {
  const { funds, balls, matches } = useStore();
  const navigate = useNavigate();

  // Calculate totals
  const totalIncome = funds.filter(f => f.type === 'INCOME').reduce((sum, f) => sum + Number(f.amount), 0);
  const totalExpense = funds.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + Number(f.amount), 0);
  const totalBalance = totalIncome - totalExpense;

  const totalBallsAdded = balls.filter(b => b.type === 'ADDED').reduce((sum, b) => sum + Number(b.quantity), 0);
  const totalBallsLost = balls.filter(b => b.type === 'LOST').reduce((sum, b) => sum + Number(b.quantity), 0);
  const ballsRemaining = totalBallsAdded - totalBallsLost;
  const batsRemaining = 1;

  // Chart Data: Funds over time
  const fundsChartData = funds.slice().reverse().map(f => {
    return {
      date: format(new Date(f.date), 'MMM dd'),
      amount: f.type === 'INCOME' ? Number(f.amount) : -Number(f.amount),
      balance: 0 // We could calculate running balance if needed
    };
  });

  // Chart Data: Lost Balls by Reason
  const lostBallsByReason = balls
    .filter(b => b.type === 'LOST')
    .reduce((acc, curr) => {
      acc[curr.reason] = (acc[curr.reason] || 0) + Number(curr.quantity);
      return acc;
    }, {});
    
  const ballsChartData = Object.keys(lostBallsByReason).map(key => ({
    name: key,
    value: lostBallsByReason[key]
  }));

  return (
    <div className="dashboard-page">
      <h1>Dashboard Overview</h1>
      
      <div className="stats-grid">
        <div className="glass-card stat-card primary-gradient">
          <div className="stat-icon">
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Balance</p>
            <h3 className="stat-value">₹{totalBalance}</h3>
          </div>
        </div>

        <div className="glass-card stat-card success">
          <div className="stat-icon">
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Collected</p>
            <h3 className="stat-value">₹{totalIncome}</h3>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{color: 'var(--primary-color)'}}>
            <CircleDashed size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Balls Available</p>
            <h3 className="stat-value">{ballsRemaining}</h3>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{color: 'var(--primary-color)'}}>
            <BatIcon size={24} color="var(--primary-color)" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Bats Available</p>
            <h3 className="stat-value">{batsRemaining}</h3>
          </div>
        </div>

        <div className="glass-card stat-card danger">
          <div className="stat-icon">
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Balls Lost</p>
            <h3 className="stat-value">{totalBallsLost}</h3>
          </div>
        </div>

        <div className="glass-card stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/matches')}>
          <div className="stat-icon" style={{ color: '#f59e0b' }}>
            <Trophy size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Matches Played</p>
            <h3 className="stat-value">{matches.filter(m => m.status !== 'upcoming').length}</h3>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Recent Matches</h2>
            <button onClick={() => navigate('/matches')}
              style={{ padding: '0.4rem 1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-color)', color: 'var(--primary-color)', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem' }}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[...matches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3).map(match => {
              const inn0 = calculateInningsTotal(match.innings?.[0]?.balls || []);
              const inn1 = calculateInningsTotal(match.innings?.[1]?.balls || []);
              return (
                <div key={match.id} onClick={() => navigate(`/matches/${match.id}`)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{match.team1Name} vs {match.team2Name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{match.dateTime}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                    {inn0.legalBalls > 0 && <span>{match.team1Name}: {inn0.runs}/{inn0.wickets}</span>}
                    {inn1.legalBalls > 0 && <span>{match.team2Name}: {inn1.runs}/{inn1.wickets}</span>}
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                      background: match.status === 'live' ? 'rgba(16,185,129,0.15)' : match.status === 'completed' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                      color: match.status === 'live' ? '#10b981' : match.status === 'completed' ? '#6366f1' : '#f59e0b' }}>
                      {match.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="glass-card chart-container">
          <h2>Fund Flow</h2>
          <div className="chart-wrapper">
            {fundsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fundsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary-color)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No transaction data available yet.</div>
            )}
          </div>
        </div>

        <div className="glass-card chart-container">
          <h2>Lost Balls by Reason</h2>
          <div className="chart-wrapper">
            {ballsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ballsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: '8px' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  />
                  <Bar dataKey="value" fill="var(--danger-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No lost balls recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
