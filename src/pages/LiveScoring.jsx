import { useState } from 'react';
import { useStore, showAlert } from '../store/useStore';
import { useParams, useNavigate } from 'react-router-dom';
import { Undo2, CheckCircle } from 'lucide-react';
import { calculateInningsTotal } from '../utils/scoreCalculator';
import CustomSelect from '../components/CustomSelect';

const LiveScoring = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches, addBallToMatch, removeLastBall, updateMatch, isAdmin } = useStore();
  const match = matches.find(m => m.id === id);

  const [inningsIndex, setInningsIndex] = useState(match?.currentInnings || 0);
  const [striker, setStriker] = useState(match?.currentStrikerId || '');
  const [nonStriker, setNonStriker] = useState(match?.currentNonStrikerId || '');
  const [bowler, setBowler] = useState(match?.currentBowlerId || '');
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('bowled');
  const [fielderId, setFielderId] = useState('');
  const [extraType, setExtraType] = useState('');
  const [extraRuns, setExtraRuns] = useState(1);

  if (!match) return <div className="page-container"><h2>Match not found.</h2></div>;
  if (!isAdmin) return <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}><h2>Admin access required.</h2></div>;

  const innings = match.innings[inningsIndex];
  const battingTeamKey = innings.battingTeam;
  const bowlingTeamKey = battingTeamKey === 'team1' ? 'team2' : 'team1';
  const battingPlayers = match[`${battingTeamKey}Players`] || [];
  const bowlingPlayers = match[`${bowlingTeamKey}Players`] || [];
  const allPlayers = [...match.team1Players, ...match.team2Players];

  const totals = calculateInningsTotal(innings.balls);
  const balls = innings.balls;
  const lastBalls = [...balls].slice(-12).reverse();

  const currentOver = Math.floor(totals.legalBalls / 6);
  const currentBallInOver = totals.legalBalls % 6;

  const playerOptions = (list) => list.map(p => ({ label: p.name, value: p.id }));
  const allPlayerOptions = allPlayers.map(p => ({ label: p.name, value: p.id }));

  const addBall = async (runsScored) => {
    if (!striker || !nonStriker || !bowler) {
      await showAlert('Please set Striker, Non-Striker, and Bowler first.');
      return;
    }
    
    const isLegal = extraType !== 'wide' && extraType !== 'noball';
    const legalBefore = totals.legalBalls;
    const batsmanRuns = extraType === 'wide' ? 0 : runsScored;
    const deliveryRuns = (extraType === 'wide' || extraType === 'noball')
      ? Math.max(1, extraRuns) + batsmanRuns
      : runsScored;

    const ball = {
      id: crypto.randomUUID(),
      overNumber: currentOver,
      ballNumber: currentBallInOver + (isLegal ? 1 : 0),
      batsmanId: striker,
      nonStrikerId: nonStriker,
      bowlerId: bowler,
      runsScored: batsmanRuns,
      isExtra: !!extraType,
      extraType: extraType || null,
      extraRuns: extraType ? (extraType === 'wide' || extraType === 'noball' ? Math.max(1, extraRuns) : extraRuns) : 0,
      isWicket,
      wicketType: isWicket ? wicketType : null,
      fielderId: isWicket && (wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped') ? fielderId : null,
      timestamp: new Date().toISOString()
    };

    addBallToMatch(id, inningsIndex, ball);

    // Strike Rotation Logic
    let newStriker = striker;
    let newNonStriker = nonStriker;
    let newBowler = bowler;

    const ballTotalRuns = deliveryRuns;

    // Rotate strike on odd runs (if not Wide/No Ball, or if Wide/No Ball has odd extra runs)
    if (ballTotalRuns % 2 !== 0) {
      [newStriker, newNonStriker] = [newNonStriker, newStriker];
    }

    // Handle Wicket: Clear striker so admin must pick new one
    if (isWicket && wicketType !== 'runout') {
      newStriker = ''; // Clear striker specifically
    } else if (isWicket && wicketType === 'runout') {
       // Run out usually depends on who was at which end, for simplicity let's clear striker
       newStriker = '';
    }

    // End of Over logic (6 legal balls)
    if (isLegal && (legalBefore + 1) % 6 === 0) {
      // Rotate strike for end of over
      [newStriker, newNonStriker] = [newNonStriker, newStriker];
      newBowler = ''; // Clear bowler so next one must be picked
    }

    setStriker(newStriker);
    setNonStriker(newNonStriker);
    setBowler(newBowler);

    setIsWicket(false); setWicketType('bowled'); setFielderId(''); setExtraType(''); setExtraRuns(1);
    updateMatch(id, { 
      currentStrikerId: newStriker, 
      currentNonStrikerId: newNonStriker, 
      currentBowlerId: newBowler, 
      status: 'live' 
    });
  };

  const handleEndInnings = () => {
    if (inningsIndex === 0) {
      setInningsIndex(1);
      updateMatch(id, { currentInnings: 1, currentStrikerId: null, currentNonStrikerId: null, currentBowlerId: null, status: 'live' });
      setStriker(''); setNonStriker(''); setBowler('');
    } else {
      updateMatch(id, { status: 'completed' });
      navigate(`/matches/${id}`);
    }
  };

  const ballDot = (b) => {
    if (b.isWicket) return { label: 'W', color: '#ef4444' };
    const tot = (b.runsScored || 0) + (b.extraType ? (b.extraRuns || 1) : 0);
    if (b.extraType === 'wide') return { label: `Wd${tot > 1 ? `+${tot-1}` : ''}`, color: '#f59e0b' };
    if (b.extraType === 'noball') return { label: `Nb${tot > 1 ? `+${tot-1}` : ''}`, color: '#f59e0b' };
    if (tot === 4) return { label: '4', color: '#10b981' };
    if (tot === 6) return { label: '6', color: '#6366f1' };
    return { label: String(tot), color: tot === 0 ? 'var(--text-secondary)' : 'var(--text-primary)' };
  };

  return (
    <div className="page-container">
      {/* Match Header */}
      <div className="glass-card mb-4" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{match.team1Name} vs {match.team2Name}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{match.venue} • {match.dateTime}</p>
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{totals.runs}/{totals.wickets}</p>
          <p style={{ color: 'var(--text-secondary)' }}>{totals.overs} Overs — {inningsIndex === 0 ? 'Innings 1' : 'Innings 2'} — {battingTeamKey === 'team1' ? match.team1Name : match.team2Name} Batting</p>
        </div>
        {!striker && <p style={{ marginTop: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>Select the next batsman</p>}
        {!bowler && totals.legalBalls > 0 && totals.legalBalls % 6 === 0 && <p style={{ marginTop: '0.25rem', color: '#f59e0b', fontWeight: 600 }}>Over complete, select the next bowler</p>}
      </div>

      {/* Last Balls */}
      <div className="glass-card mb-4">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>This Over</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {lastBalls.slice(0, 12).reverse().map((b, i) => {
            const dot = ballDot(b);
            return (
              <div key={b.id} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: dot.color, border: `2px solid ${dot.color}` }}>
                {dot.label}
              </div>
            );
          })}
          {lastBalls.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No balls bowled yet</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Players Panel */}
        <div className="glass-card" style={{ position: 'relative', zIndex: 20 }}>
          <h2 style={{ marginBottom: '1rem' }}>Players</h2>
          <div className="form-group">
            <label>Striker (Batsman)</label>
            <CustomSelect value={striker} onChange={setStriker} options={playerOptions(battingPlayers)} placeholder="Select striker" />
          </div>
          <div className="form-group">
            <label>Non-Striker</label>
            <CustomSelect value={nonStriker} onChange={setNonStriker} options={playerOptions(battingPlayers)} placeholder="Select non-striker" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Bowler</label>
            <CustomSelect value={bowler} onChange={setBowler} options={playerOptions(bowlingPlayers)} placeholder="Select bowler" />
          </div>
        </div>

        {/* Scoring Panel */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1rem' }}>Ball Entry</h2>

          {/* Extras Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['', 'wide', 'noball', 'bye', 'legbye'].map(e => (
              <button key={e} type="button"
                onClick={() => setExtraType(extraType === e ? '' : e)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: `2px solid ${extraType === e ? 'var(--primary-color)' : 'var(--border-color)'}`, background: extraType === e ? 'rgba(99,102,241,0.15)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                {e === '' ? 'Normal' : e.charAt(0).toUpperCase() + e.slice(1).replace('noball', 'No Ball').replace('legbye', 'Leg Bye')}
              </button>
            ))}
          </div>

          {extraType && (
            <div className="form-group">
              <label>Extra Runs (e.g. 1 for wide, or 1+2 if they ran)</label>
              <input type="number" className="form-control" min="1" value={extraRuns} onChange={e => setExtraRuns(Number(e.target.value))} />
            </div>
          )}

          {/* Wicket Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <button type="button" onClick={() => setIsWicket(!isWicket)}
              style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: `2px solid ${isWicket ? '#ef4444' : 'var(--border-color)'}`, background: isWicket ? 'rgba(239,68,68,0.15)' : 'transparent', color: isWicket ? '#ef4444' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
              {isWicket ? '🔴 Wicket!' : 'Wicket?'}
            </button>
          </div>

          {isWicket && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', position: 'relative', zIndex: 30 }}>
              <CustomSelect value={wicketType} onChange={setWicketType} options={[
                { label: 'Bowled', value: 'bowled' }, { label: 'Caught', value: 'caught' },
                { label: 'LBW', value: 'lbw' }, { label: 'Run Out', value: 'runout' },
                { label: 'Stumped', value: 'stumped' }, { label: 'Hit Wicket', value: 'hitwicket' }
              ]} />
              {['caught','runout','stumped'].includes(wicketType) && (
                <CustomSelect value={fielderId} onChange={setFielderId} options={allPlayerOptions} placeholder="Select fielder..." />
              )}
            </div>
          )}

          {/* Run Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[0, 1, 2, 3, 4, 6].map(r => (
              <button key={r} onClick={() => addBall(r)}
                style={{ padding: '1rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem',
                  background: r === 4 ? 'rgba(16,185,129,0.2)' : r === 6 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)',
                  color: r === 4 ? '#10b981' : r === 6 ? '#6366f1' : 'var(--text-primary)',
                  border: `1px solid ${r === 4 ? 'rgba(16,185,129,0.3)' : r === 6 ? 'rgba(99,102,241,0.3)' : 'var(--border-color)'}` }}>
                {r}
              </button>
            ))}
            <button onClick={() => removeLastBall(id, inningsIndex)}
              style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Undo2 size={16} /> Undo
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => navigate(`/matches/${id}`)} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          View Scorecard
        </button>
        <button className="btn btn-primary" onClick={handleEndInnings} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {inningsIndex === 0 ? 'End Innings 1' : 'End Match'}
        </button>
      </div>
    </div>
  );
};

export default LiveScoring;
