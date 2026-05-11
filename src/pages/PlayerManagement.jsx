import { useState, useMemo } from 'react';
import { useStore, showConfirm } from '../store/useStore';
import { Plus, Trash2, ArrowUpDown, Search, X, Edit2, Save } from 'lucide-react';
import Modal from '../components/Modal';
import { format } from 'date-fns';

const PlayerManagement = () => {
  const { players, addPlayer, updatePlayer, removePlayer, isAdmin, funds } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [viewingPlayer, setViewingPlayer] = useState(null);
  
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Filter and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    addPlayer({ name });
    setName('');
    setShowForm(false);
  };

  const handleUpdate = (e, id) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    updatePlayer(id, { name: editingName.trim() });
    setEditingPlayerId(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const confirmed = await showConfirm('Are you sure you want to delete this player?');
    if (confirmed) {
      removePlayer(id);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Processed Data
  const processedPlayers = useMemo(() => {
    let result = [...players].map(player => {
      // Calculate total contributions (all INCOME transactions)
      const playerFunds = funds.filter(f => f.playerId === player.id);
      const totalContribution = playerFunds
        .filter(f => f.type === 'INCOME')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      
      return {
        ...player,
        totalContribution,
        contributions: playerFunds
      };
    });

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerQuery));
    }

    // Sort
    result.sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'total') {
        return sortConfig.direction === 'desc' ? b.totalContribution - a.totalContribution : a.totalContribution - b.totalContribution;
      }
      return 0;
    });

    return result;
  }, [players, searchQuery, sortConfig, funds]);

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Players</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> Add Player
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="glass-card mb-6" style={{ animation: 'fadeInDown 0.2s ease-out' }}>
          <h2 className="mb-4">New Player</h2>
          <form onSubmit={handleSubmit} className="flex" style={{ gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', marginBottom: 0 }}>
              <label>Player Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <button type="submit" className="btn btn-success" style={{ background: 'var(--success-color)', color: '#fff', border: 'none' }}>
              Save
            </button>
          </form>
        </div>
      )}

      {/* Filters Section */}
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
                  Name <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'name' ? 1 : 0.3 }} />
                </th>
                <th className="text-right" onClick={() => handleSort('total')} style={{ cursor: 'pointer' }}>
                  Total Contributed (₹) <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'total' ? 1 : 0.3 }} />
                </th>
                {isAdmin && <th className="text-center" style={{ width: '120px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {processedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    No players found.
                  </td>
                </tr>
              ) : (
                processedPlayers.map((player, index) => (
                  <tr 
                    key={player.id}
                    onClick={() => { if (editingPlayerId !== player.id) setViewingPlayer(player); }}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ color: 'var(--text-secondary)' }}>#{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>
                      {editingPlayerId === player.id ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', maxWidth: '200px' }}
                          autoFocus
                        />
                      ) : (
                        player.name
                      )}
                    </td>
                    <td className="text-right" style={{ fontWeight: 600, color: 'var(--success-color)', fontSize: '1.05rem' }}>
                      ₹{player.totalContribution}
                    </td>
                    {isAdmin && (
                      <td className="text-center" onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {editingPlayerId === player.id ? (
                            <>
                              <button onClick={(e) => handleUpdate(e, player.id)} style={{ background: 'transparent', border: 'none', color: 'var(--success-color)', cursor: 'pointer' }} title="Save">
                                <Save size={18} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setEditingPlayerId(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Cancel">
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setEditingPlayerId(player.id); setEditingName(player.name); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Edit">
                                <Edit2 size={18} className="hover:text-primary" />
                              </button>
                              <button onClick={(e) => handleDelete(e, player.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Delete">
                                <Trash2 size={18} className="hover:text-danger" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Contributions Modal */}
      <Modal isOpen={!!viewingPlayer} onClose={() => setViewingPlayer(null)} title={viewingPlayer?.name}>
        {viewingPlayer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Player ID</p>
                <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>#{viewingPlayer.id}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Contributed</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success-color)' }}>₹{viewingPlayer.totalContribution}</p>
              </div>
            </div>

            {/* Contributions by Category */}
            {viewingPlayer.contributions && viewingPlayer.contributions.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>Contribution History</h3>
                <div style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {[...viewingPlayer.contributions]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((contrib, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          borderLeft: `3px solid ${contrib.type === 'INCOME' ? 'var(--success-color)' : 'var(--danger-color)'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                              {format(new Date(contrib.date), 'dd MMM yyyy, HH:mm')}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                              <p style={{ fontWeight: 500, margin: 0 }}>
                                {contrib.category || 'Other'}
                              </p>
                              <span className={`badge ${contrib.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                {contrib.type}
                              </span>
                            </div>
                            {contrib.description && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {contrib.description}
                              </p>
                            )}
                          </div>
                          <p style={{ fontWeight: 700, color: contrib.type === 'INCOME' ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                            {contrib.type === 'INCOME' ? '+' : '-'}₹{contrib.amount}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No contributions yet.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlayerManagement;
