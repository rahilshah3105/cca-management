import { useState } from 'react';
import { useStore, showAlert } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

// Defined OUTSIDE MatchSetup to prevent re-creation on each render
const PlayerList = ({ team, teamPlayers, setter, existingOptions, newName, onNameChange, onAddNew, onAddExisting }) => (
  <div style={{ marginTop: '0.75rem' }}>
    <div style={{ position: 'relative', zIndex: 20, marginBottom: '0.5rem' }}>
      <CustomSelect
        placeholder="Add existing player"
        options={existingOptions}
        value=""
        onChange={(val) => onAddExisting(val)}
      />
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <input
        className="form-control"
        type="text"
        placeholder="Or type new player name..."
        value={newName}
        onChange={e => onNameChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddNew(); } }}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className="btn btn-primary"
        onClick={onAddNew}
        style={{ padding: '0.5rem 1rem' }}
      >
        <Plus size={16} />
      </button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {teamPlayers.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#{i + 1}</span>
          <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
          <button
            type="button"
            onClick={() => setter(prev => prev.filter(pl => pl.id !== p.id))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <Minus size={16} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Validations
const validateTeamName = (name) => {
  // Should not contain numbers or special characters, only letters and spaces
  const re = /^[A-Za-z ]+$/;
  const trimmed = name.trim();
  return trimmed.length > 0 && re.test(trimmed);
};
const validateVenue = (venue) => {
  // Should not start with a number
  if (!venue) return true;
  return !/^\d/.test(venue.trim());
};
const validateDateTime = (dateTime) => {
  const re = /^[0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}$/;
  return re.test(dateTime);
};

const MatchSetup = () => {
  const { players, addMatch, isAdmin } = useStore();
  const navigate = useNavigate();

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const defaultDateTime = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [form, setForm] = useState({
    team1Name: '', team2Name: '',
    venue: '', dateTime: defaultDateTime,
    tossWinner: 'team1', tossDecision: 'bat',
  });

  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [newName1, setNewName1] = useState('');
  const [newName2, setNewName2] = useState('');

  const existingOptions = players.map(p => ({ label: p.name, value: p.id }));

  const addExistingToTeam = (setter, playerId) => {
    if (!playerId) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    setter(prev => prev.find(p => p.id === player.id) ? prev : [...prev, { id: player.id, name: player.name }]);
  };

  const addNewToTeam = async (setter, name, clearName) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!validateTeamName(trimmed)) {
      await showAlert('Player name cannot contain numbers or special characters.');
      return;
    }
    setter(prev => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
    clearName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const team1Name = form.team1Name.trim();
    const team2Name = form.team2Name.trim();
    const venue = form.venue.trim();
    
    // Validations
    if (!validateTeamName(team1Name)) { await showAlert('Team 1 Name cannot contain numbers or special characters.'); return; }
    if (!validateTeamName(team2Name)) { await showAlert('Team 2 Name cannot contain numbers or special characters.'); return; }
    if (!validateVenue(venue)) { await showAlert('Venue Name cannot start with a number.'); return; }
    if (!validateDateTime(form.dateTime)) { await showAlert('Please use DD-MM-YYYY HH:MM format for date.'); return; }

    if (team1Players.length < 2 || team2Players.length < 2) { await showAlert('Each team needs at least 2 players.'); return; }

    const battingTeam1 = form.tossDecision === 'bat' ? form.tossWinner : (form.tossWinner === 'team1' ? 'team2' : 'team1');

    const matchData = {
      ...form,
      team1Name,
      team2Name,
      venue,
      team1Players, team2Players,
      status: 'upcoming',
      currentInnings: 0,
      currentStrikerId: null, currentNonStrikerId: null, currentBowlerId: null,
      innings: [
        { battingTeam: battingTeam1, balls: [] },
        { battingTeam: battingTeam1 === 'team1' ? 'team2' : 'team1', balls: [] }
      ]
    };

    const id = addMatch(matchData);
    navigate(`/matches/${id}/score`);
  };

  if (!isAdmin) return (
    <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>
      <h2>Admin access required to create a match.</h2>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Create New Match</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Match Info */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1rem' }}>Match Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Team 1 Name</label>
              <input className="form-control" type="text" required value={form.team1Name}
                onChange={e => setForm({ ...form, team1Name: e.target.value })} placeholder="e.g. CCA Blues" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Team 2 Name</label>
              <input className="form-control" type="text" required value={form.team2Name}
                onChange={e => setForm({ ...form, team2Name: e.target.value })} placeholder="e.g. CCA Reds" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Venue</label>
              <input className="form-control" type="text" value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. CCA Ground" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Date & Time (DD-MM-YYYY HH:MM)</label>
              <input className="form-control" type="text" value={form.dateTime}
                onChange={e => setForm({ ...form, dateTime: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Toss Info */}
        <div className="glass-card" style={{ position: 'relative', zIndex: 10 }}>
          <h2 style={{ marginBottom: '1rem' }}>Toss</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Toss Winner</label>
              <CustomSelect value={form.tossWinner} onChange={val => setForm({ ...form, tossWinner: val })}
                options={[
                  { label: form.team1Name || 'Team 1', value: 'team1' },
                  { label: form.team2Name || 'Team 2', value: 'team2' }
                ]} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Elected to</label>
              <CustomSelect value={form.tossDecision} onChange={val => setForm({ ...form, tossDecision: val })}
                options={[{ label: 'Bat', value: 'bat' }, { label: 'Bowl', value: 'bowl' }]} />
            </div>
          </div>
        </div>

        {/* Players */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card">
            <h2>{form.team1Name || 'Team 1'} Squad ({team1Players.length})</h2>
            <PlayerList
              team="team1"
              teamPlayers={team1Players}
              setter={setTeam1Players}
              existingOptions={existingOptions}
              newName={newName1}
              onNameChange={setNewName1}
              onAddNew={() => addNewToTeam(setTeam1Players, newName1, setNewName1)}
              onAddExisting={(val) => addExistingToTeam(setTeam1Players, val)}
            />
          </div>
          <div className="glass-card">
            <h2>{form.team2Name || 'Team 2'} Squad ({team2Players.length})</h2>
            <PlayerList
              team="team2"
              teamPlayers={team2Players}
              setter={setTeam2Players}
              existingOptions={existingOptions}
              newName={newName2}
              onNameChange={setNewName2}
              onAddNew={() => addNewToTeam(setTeam2Players, newName2, setNewName2)}
              onAddExisting={(val) => addExistingToTeam(setTeam2Players, val)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary"
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          Create Match & Start Scoring <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
};

export default MatchSetup;
