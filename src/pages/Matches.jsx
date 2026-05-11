import { useStore, showConfirm } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Zap } from 'lucide-react';
import { calculateInningsTotal } from '../utils/scoreCalculator';

const Matches = () => {
  const { matches, deleteMatch, isAdmin } = useStore();
  const navigate = useNavigate();

  const sorted = [...matches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Matches</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate('/matches/new')}>
            <Plus size={18} /> New Match
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏏</p>
          <h2 style={{ marginBottom: '0.5rem' }}>No matches yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Click "New Match" to create your first scorecard.' : 'No matches have been recorded yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sorted.map(match => {
            const inn0 = match.innings?.[0];
            const inn1 = match.innings?.[1];
            const t0 = calculateInningsTotal(inn0?.balls || []);
            const t1 = calculateInningsTotal(inn1?.balls || []);
            const hasScores = t0.legalBalls > 0 || t1.legalBalls > 0;

            return (
              <div key={match.id} className="glass-card" style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => navigate(`/matches/${match.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {match.status === 'live' && (
                        <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Zap size={11} /> LIVE
                        </span>
                      )}
                      {match.status === 'completed' && <span style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>COMPLETED</span>}
                      {match.status === 'upcoming' && <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>UPCOMING</span>}
                    </div>

                    <h2 style={{ marginBottom: '0.25rem', fontSize: '1.15rem' }}>{match.team1Name} vs {match.team2Name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {match.venue && `📍 ${match.venue} • `}📅 {match.dateTime}
                    </p>
                  </div>

                  {hasScores && (
                    <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
                      {t0.legalBalls > 0 && (
                        <div>
                          <p style={{ fontWeight: 800, fontSize: '1.3rem' }}>{t0.runs}/{t0.wickets}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{match.team1Name} ({t0.overs})</p>
                        </div>
                      )}
                      {t1.legalBalls > 0 && (
                        <div>
                          <p style={{ fontWeight: 800, fontSize: '1.3rem' }}>{t1.runs}/{t1.wickets}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{match.team2Name} ({t1.overs})</p>
                        </div>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <button onClick={async (e) => { 
                      e.stopPropagation(); 
                      const confirmed = await showConfirm('Delete this match?');
                      if (confirmed) deleteMatch(match.id); 
                    }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Matches;
