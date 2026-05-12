import { useState, useMemo } from 'react';
import { useStore, showConfirm, showPrompt } from '../store/useStore';
import { Plus, Trash2, ArrowUpDown, Search, PencilLine, RotateCcw } from 'lucide-react';
import Modal from '../components/Modal';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';

const OWNER_NAME = import.meta.env.VITE_OWNER_NAME || 'Rahil';

const PlayerManagement = () => {
  const { players, addPlayer, updatePlayer, removePlayer, isAdmin, funds, balls, admins, addAdmin, removeAdmin, isOwner } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [viewingPlayer, setViewingPlayer] = useState(null);

  const [showSetRoleModal, setShowSetRoleModal] = useState(false);
  const [setRoleData, setSetRoleData] = useState({
    player: null,
    password: '',
    validFrom: '',
    validTo: ''
  });

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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const confirmed = await showConfirm('Are you sure you want to delete this player?');
    if (confirmed) {
      removePlayer(id);
    }
  };

  const handleSetRole = (e, player) => {
    e.stopPropagation();
    if (!isOwner()) {
      alert('Only owner can manage admin roles');
      return;
    }
    const adminEntry = admins.find(a => a.id === player.id);
    setSetRoleData({
      player,
      password: adminEntry?.name ? '' : '',
      validFrom: adminEntry?.validFrom || '',
      validTo: adminEntry?.validTo || ''
    });
    setShowSetRoleModal(true);
  };

  const handleSetRoleSubmit = async () => {
    if (!setRoleData.password && !setSetRoleData.player) {
      alert('Please enter a password');
      return;
    }
    const ok = await addAdmin(setRoleData.player.id, setRoleData.password, setRoleData.validFrom || null, setRoleData.validTo || null);
    if (ok) {
      alert('Admin role assigned');
      setShowSetRoleModal(false);
      setSetRoleData({ player: null, password: '', validFrom: '', validTo: '' });
    } else {
      alert('Not authorized to add admin (only owner can add)');
    }
  };

  const handleRevoke = async (e, player) => {
    e.stopPropagation();
    if (!isOwner()) {
      alert('Only owner can manage admin roles');
      return;
    }
    const confirmed = await showConfirm(`Revoke admin role for ${player.name}?`);
    if (!confirmed) return;
    const ok = await removeAdmin(player.id);
    if (ok) alert('Admin revoked'); else alert('Not authorized');
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
      const playerFunds = funds.filter(f => f.playerId === player.id);
      const actualContribution = playerFunds
        .filter(f => f.type === 'INCOME' && f.category === 'Other')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const ballsLostQuantity = balls
        .filter(b => b.playerId === player.id && b.type === 'LOST')
        .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
      const recoveredMoneyAmount = playerFunds
        .filter(f => f.category === 'Balls' && f.type === 'INCOME')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

      return {
        ...player,
        totalContribution: actualContribution,
        actualContribution,
        ballsLostQuantity,
        recoveredMoneyAmount,
        contributions: playerFunds,
        ballRecords: balls.filter(b => b.playerId === player.id)
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
          <table className="modern-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'left' }}>ID</th>
                <th style={{ flex: 1, textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Name <ArrowUpDown size={14} style={{ opacity: sortConfig.key === 'name' ? 1 : 0.3 }} />
                  </div>
                </th>
                <th style={{ width: '100px', textAlign: 'center' }}>Role</th>
                <th style={{ width: '150px', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('total')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    Total (₹) <ArrowUpDown size={14} style={{ opacity: sortConfig.key === 'total' ? 1 : 0.3 }} />
                  </div>
                </th>
                {isOwner && isOwner() && <th style={{ width: '200px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {processedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={isOwner && isOwner() ? 5 : 4} className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    No players found.
                  </td>
                </tr>
              ) : (
                processedPlayers.map((player, index) => (
                  <tr
                    key={player.id}
                    onClick={() => setViewingPlayer(player)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>#{index + 1}</td>
                    <td style={{ fontWeight: 500, textAlign: 'left' }}>{player.name}</td>
                    <td style={{ textAlign: 'center' }}>
                      {(() => {
                        const adminEntry = admins.find(a => a.id === player.id);
                        const now = new Date();
                        const isActiveAdmin = adminEntry && (!adminEntry.validFrom || new Date(adminEntry.validFrom) <= now) && (!adminEntry.validTo || new Date(adminEntry.validTo) >= now);
                        return (
                          <span style={{ fontWeight: 600, color: isActiveAdmin ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                            {isActiveAdmin ? 'Admin' : 'Player'}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success-color)', textAlign: 'right' }}>
                      ₹{player.totalContribution}
                    </td>
                    {isOwner && isOwner() && (
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button onClick={(e) => handleSetRole(e, player)} className="btn" style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Role" aria-label="Edit Role">
                            <PencilLine size={18} />
                          </button>
                          {admins.find(a => a.id === player.id) && (
                            <button onClick={(e) => handleRevoke(e, player)} className="btn" style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Revoke Admin" aria-label="Revoke Admin">
                              <RotateCcw size={18} />
                            </button>
                          )}
                          <button onClick={(e) => handleDelete(e, player.id)} className="btn" style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Delete" aria-label="Delete">
                            <Trash2 size={18} />
                          </button>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Total Contributed</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success-color)' }}>₹{viewingPlayer.actualContribution}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Balls Lost</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--danger-color)' }}>{viewingPlayer.ballsLostQuantity}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Recovered Money</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success-color)' }}>₹{viewingPlayer.recoveredMoneyAmount}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Player ID</p>
                <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>#{viewingPlayer.id}</p>
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

      {/* Set Role Modal */}
      <Modal isOpen={showSetRoleModal} onClose={() => setShowSetRoleModal(false)} title={setRoleData.player ? `Make ${setRoleData.player.name} an Admin` : 'Make Admin'}>
        {setRoleData.player && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Admin Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Set password for admin"
                value={setRoleData.password}
                onChange={(e) => setSetRoleData({ ...setRoleData, password: e.target.value })}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Only you ({OWNER_NAME}) can set/manage admin access with this password.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Valid From (Optional)</label>
                <DatePicker
                  value={setRoleData.validFrom}
                  onChange={(iso) => setSetRoleData({ ...setRoleData, validFrom: iso })}
                />
                {setRoleData.validFrom && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {format(new Date(setRoleData.validFrom), 'dd MMM yyyy')}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Valid To (Optional)</label>
                <DatePicker
                  value={setRoleData.validTo}
                  onChange={(iso) => setSetRoleData({ ...setRoleData, validTo: iso })}
                />
                {setRoleData.validTo && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {format(new Date(setRoleData.validTo), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-success" onClick={handleSetRoleSubmit} style={{ background: 'var(--success-color)', color: '#fff', border: 'none', flex: 1 }}>
                Make Admin
              </button>
              <button className="btn" onClick={() => setShowSetRoleModal(false)} style={{ flex: 1, background: 'transparent', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlayerManagement;
