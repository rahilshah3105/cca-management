import { useState, useMemo } from 'react';
import { useStore, showPrompt, showAlert } from '../store/useStore';
import { Search, ArrowUpDown, Plus } from 'lucide-react';
import { format } from 'date-fns';
import CustomSelect from '../components/CustomSelect';
import Modal from '../components/Modal';
import DatePicker from '../components/DatePicker';

const StumpsContribution = () => {
  const { funds, players, addFund, isAdmin, addPlayer } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'INCOME',
    playerId: '',
    description: ''
  });

  const handleAddNewPlayer = async () => {
    const name = await showPrompt("Enter new player name:");
    if (name && name.trim()) {
      const newId = addPlayer({ name: name.trim() });
      setFormData({ ...formData, playerId: newId });
    }
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.playerId || !formData.date) return;

    if (formData.type === 'INCOME') {
        const playerExpenses = funds.filter(f => f.playerId === formData.playerId && f.type === 'EXPENSE' && f.category === 'Stumps');
        if (playerExpenses.length > 0) {
            const latestExpenseDate = new Date(Math.max(...playerExpenses.map(f => new Date(f.date).getTime())));
            const incomeDate = new Date(formData.date);
            if (incomeDate < latestExpenseDate) {
                await showAlert(`Recovery money date cannot be earlier than when the stump was broken (${format(latestExpenseDate, 'dd MMM yyyy')}).`);
                return;
            }
        }
    }
    
    addFund({
      ...formData,
      category: 'Stumps',
      amount: Number(formData.amount)
    });
    
    setFormData({ amount: '', type: 'INCOME', playerId: '', description: '', date: '' });
    setShowForm(false);
  };

  const playerOptions = players.map(p => ({ label: p.name, value: p.id }));

  // Process data - Group by player and sum amounts for Stumps category
  const playerContributions = useMemo(() => {
    const stumpsData = funds.filter(f => f.category === 'Stumps' && f.type === 'INCOME');
    
    const byPlayer = {};
    stumpsData.forEach(fund => {
      if (!byPlayer[fund.playerId]) {
        byPlayer[fund.playerId] = {
          playerId: fund.playerId,
          playerName: players.find(p => p.id === fund.playerId)?.name || 'Unknown',
          total: 0,
          count: 0,
          latestDate: null,
          entries: []
        };
      }
      byPlayer[fund.playerId].total += Number(fund.amount) || 0;
      byPlayer[fund.playerId].count += 1;
      byPlayer[fund.playerId].latestDate = fund.date;
      byPlayer[fund.playerId].entries.push({
        date: fund.date,
        amount: fund.amount,
        description: fund.description
      });
    });

    let result = Object.values(byPlayer);

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => p.playerName.toLowerCase().includes(lowerQuery));
    }

    // Sort
    result.sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc'
          ? a.playerName.localeCompare(b.playerName)
          : b.playerName.localeCompare(a.playerName);
      }
      if (sortConfig.key === 'total') {
        return sortConfig.direction === 'desc' ? b.total - a.total : a.total - b.total;
      }
      return 0;
    });

    return result;
  }, [funds, players, searchQuery, sortConfig]);

  const [viewingPlayer, setViewingPlayer] = useState(null);

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Stumps Contributions</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Total collected: <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success-color)' }}>
            ₹{playerContributions.reduce((sum, p) => sum + p.total, 0)}
          </span>
        </p>
      </div>
      {isAdmin && (
        <button className="btn btn-primary mb-6" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Entry
        </button>
      )}
      

    {isAdmin && showForm && (
      <div className="glass-card mb-6" style={{ animation: 'fadeInDown 0.2s ease-out', position: 'relative', zIndex: 10 }}>
        <h2 className="mb-4">New Stumps Contribution</h2>
        <form onSubmit={handleAddSubmit} className="flex" style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
            <label>Amount (₹)</label>
            <input 
              type="number" 
              className="form-control" 
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
            <label>Player</label>
            <CustomSelect 
              value={formData.playerId}
              onChange={(val) => setFormData({...formData, playerId: val})}
              options={playerOptions}
              onAddNew={handleAddNewPlayer}
            />
          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '160px', marginBottom: 0 }}>
            <label>Date</label>
            <DatePicker
              value={formData.date}
              onChange={(iso) => setFormData({...formData, date: iso})}
            />
          </div>

          <div className="form-group" style={{ flex: '2', minWidth: '200px', marginBottom: 0 }}>
            <label>Description</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="e.g. Stumps maintenance"
            />
          </div>

          <button type="submit" className="btn btn-success" style={{ background: 'var(--success-color)', color: '#fff', border: 'none' }}>
            Save
          </button>
        </form>
      </div>
    )}

      {/* Search Section */}
      <div className="glass-card mb-4" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search players..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Player <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'name' ? 1 : 0.3 }} />
                </th>
                <th>Latest Date</th>
                <th className="text-right" onClick={() => handleSort('total')} style={{ cursor: 'pointer' }}>
                  Amount (₹) <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'total' ? 1 : 0.3 }} />
                </th>
                <th className="text-center">Entries</th>
              </tr>
            </thead>
            <tbody>
              {playerContributions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    No contributions found.
                  </td>
                </tr>
              ) : (
                playerContributions.map((player, index) => (
                  <tr key={player.playerId} style={{ cursor: 'pointer' }} onClick={() => setViewingPlayer(player)}>
                    <td style={{ color: 'var(--text-secondary)' }}>#{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>{player.playerName}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{player.latestDate ? format(new Date(player.latestDate), 'dd MMM yyyy') : '-'}</td>
                    <td className="text-right" style={{ fontWeight: 600, color: 'var(--success-color)', fontSize: '1.1rem' }}>
                      ₹{player.total}
                    </td>
                    <td className="text-center" style={{ color: 'var(--text-secondary)' }}>{player.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Player Entries Modal */}
      <Modal isOpen={!!viewingPlayer} onClose={() => setViewingPlayer(null)} title={viewingPlayer?.playerName}>
        {viewingPlayer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Player</p>
                <p style={{ fontWeight: 600 }}>{viewingPlayer.playerName}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total</p>
                <p style={{ fontWeight: 700, color: 'var(--success-color)' }}>₹{viewingPlayer.total}</p>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>Entries</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                {viewingPlayer.entries.sort((a,b) => new Date(b.date) - new Date(a.date)).map((e, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.08)', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{format(new Date(e.date), 'dd MMM yyyy, HH:mm')}</div>
                      <div style={{ fontWeight: 600 }}>{e.description || '—'}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--success-color)' }}>₹{e.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StumpsContribution;
