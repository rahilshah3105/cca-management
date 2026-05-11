import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useParams, useNavigate } from 'react-router-dom';
import { calculateBattingStats, calculateBowlingStats, calculateInningsTotal, getDismissalText, getFallOfWickets, getBattingOrder, getBowlingOrder, getPlayerName } from '../utils/scoreCalculator';
import { Zap, Edit } from 'lucide-react';

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches, isAdmin } = useStore();
  const match = matches.find(m => m.id === id);
  const [activeInnings, setActiveInnings] = useState(0);
  const [activeTab, setActiveTab] = useState('scorecard');

  if (!match) return <div className="page-container"><h2>Match not found.</h2></div>;

  const innings = match.innings[activeInnings];
  const balls = innings?.balls || [];
  const battingTeamKey = innings?.battingTeam;
  const bowlingTeamKey = battingTeamKey === 'team1' ? 'team2' : 'team1';
  const battingTeamName = battingTeamKey === 'team1' ? match.team1Name : match.team2Name;
  const t1 = match.team1Players || [];
  const t2 = match.team2Players || [];
  const totals = calculateInningsTotal(balls);
  const battingOrder = getBattingOrder(balls);
  const bowlingOrder = getBowlingOrder(balls);
  const fow = getFallOfWickets(balls);
  const tossWinnerName = match.tossWinner === 'team1' ? match.team1Name : match.team2Name;

  // Team scores summary
  const inn0 = match.innings[0];
  const inn1 = match.innings[1];
  const t0 = calculateInningsTotal(inn0?.balls || []);
  const t1s = calculateInningsTotal(inn1?.balls || []);

  useEffect(() => {
    const inningsWithData = match.innings.findIndex(inn => (inn?.balls || []).length > 0);
    if (inningsWithData !== -1 && inningsWithData !== activeInnings) {
      setActiveInnings(inningsWithData);
    }
  }, [match, activeInnings]);

  const statusColor = { live: '#10b981', completed: '#6366f1', upcoming: '#f59e0b' };

  return (
    <div className="page-container">
      {/* Match Header */}
      <div className="glass-card mb-4" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            {match.status === 'live' && <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Zap size={12} />LIVE</span>}
            {match.status === 'completed' && <span style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>COMPLETED</span>}
            {match.status === 'upcoming' && <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>UPCOMING</span>}
          </div>
          {isAdmin && (
            <button className="btn" onClick={() => navigate(`/matches/${id}/score`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-color)', color: '#fff', border: 'none' }}>
              <Edit size={16} /> Score
            </button>
          )}
        </div>

        {/* Team Scores */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{match.team1Name}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)' }}>{t0.runs}/{t0.wickets}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t0.overs} Ov</p>
          </div>
          <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>vs</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{match.team2Name}</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)' }}>{t1s.runs}/{t1s.wickets}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t1s.overs} Ov</p>
          </div>
        </div>

        <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
          {match.venue && <span>📍 {match.venue}</span>}
          <span>📅 {match.dateTime}</span>
          <span>🪙 {tossWinnerName} won toss, elected to {match.tossDecision}</span>
        </div>
      </div>

      {/* Innings Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {match.innings.map((inn, i) => {
          const team = inn.battingTeam === 'team1' ? match.team1Name : match.team2Name;
          const tot = calculateInningsTotal(inn.balls || []);
          return (
            <button key={i} onClick={() => setActiveInnings(i)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: `2px solid ${activeInnings === i ? 'var(--primary-color)' : 'var(--border-color)'}`, background: activeInnings === i ? 'rgba(99,102,241,0.12)' : 'transparent', color: activeInnings === i ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
              {team} — {tot.runs}/{tot.wickets}
            </button>
          );
        })}
      </div>

      {/* Batting Table */}
      <div className="glass-card mb-4">
        <h2 style={{ marginBottom: '1rem' }}>🏏 Batting — {battingTeamName}</h2>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Batsman</th><th>Dismissal</th>
                <th className="text-right">R</th><th className="text-right">B</th>
                <th className="text-right">4s</th><th className="text-right">6s</th>
                <th className="text-right">SR</th>
              </tr>
            </thead>
            <tbody>
              {battingOrder.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No balls bowled yet</td></tr>
              ) : battingOrder.map(pid => {
                const s = calculateBattingStats(balls, pid);
                const name = getPlayerName(t1, t2, pid);
                return (
                  <tr key={pid}>
                    <td style={{ fontWeight: 600 }}>
                      {name}
                      {!s.isOut && <span style={{ marginLeft: '0.5rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>not out</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.isOut ? getDismissalText(s.dismissal, t1, t2) : '—'}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>{s.runs}</td>
                    <td className="text-right">{s.ballsFaced}</td>
                    <td className="text-right">{s.fours}</td>
                    <td className="text-right">{s.sixes}</td>
                    <td className="text-right">{s.sr}</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                <td colSpan={2} style={{ fontWeight: 600 }}>Extras</td>
                <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {totals.extras.total} (Wd {totals.extras.wide}, Nb {totals.extras.noBall}, B {totals.extras.bye}, Lb {totals.extras.legBye})
                </td>
              </tr>
              <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                <td colSpan={2} style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</td>
                <td className="text-right" colSpan={5} style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  {totals.runs}/{totals.wickets} ({totals.overs} Ov)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bowling Table */}
      <div className="glass-card mb-4">
        <h2 style={{ marginBottom: '1rem' }}>⚡ Bowling — {bowlingTeamKey === 'team1' ? match.team1Name : match.team2Name}</h2>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th className="text-right">O</th><th className="text-right">M</th>
                <th className="text-right">R</th><th className="text-right">W</th>
                <th className="text-right">Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlingOrder.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No balls bowled yet</td></tr>
              ) : bowlingOrder.map(pid => {
                const s = calculateBowlingStats(balls, pid);
                const name = getPlayerName(t1, t2, pid);
                return (
                  <tr key={pid}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td className="text-right">{s.overs}</td>
                    <td className="text-right">{s.maidens}</td>
                    <td className="text-right">{s.runs}</td>
                    <td className="text-right" style={{ fontWeight: 700, color: s.wickets > 0 ? '#6366f1' : 'inherit' }}>{s.wickets}</td>
                    <td className="text-right">{s.econ}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {fow.length > 0 && (
        <div className="glass-card">
          <h2 style={{ marginBottom: '0.75rem' }}>Fall of Wickets</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {fow.map(f => (
              <span key={f.wicket} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
                {f.wicket}-{f.runs} ({getPlayerName(t1, t2, f.batsmanId)}, {f.over})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetail;
