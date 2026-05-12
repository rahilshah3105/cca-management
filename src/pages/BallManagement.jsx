import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, ArrowUpDown, Search, Edit2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import CustomSelect from '../components/CustomSelect';
import Modal from '../components/Modal';

const BallManagement = () => {
  const { balls, addBallRecord, updateBallRecord, removeBallRecord, players, isAdmin } = useStore();
  
  // Modals state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBall, setEditingBall] = useState(null);
  const [viewingBall, setViewingBall] = useState(null);
  
  const [formData, setFormData] = useState({
    quantity: '',
    type: 'LOST',
    playerId: '',
    reason: 'Lost in bushes',
    description: ''
  });

  // Filter and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterRecovery, setFilterRecovery] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const reasons = [
    { label: 'Lost in bushes', value: 'Lost in bushes' },
    { label: 'Hit in water', value: 'Hit in water' },
    { label: 'Torn / Damaged', value: 'Torn / Damaged' },
    { label: 'Taken by someone', value: 'Taken by someone' },
    { label: 'Other', value: 'Other' }
  ];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.quantity) return;
    if (formData.type === 'LOST' && !formData.playerId) return;
    
    addBallRecord({
      ...formData,
      quantity: Number(formData.quantity)
    });
    
    setFormData({ quantity: '', type: 'LOST', playerId: '', reason: 'Lost in bushes', description: '' });
    setShowAddForm(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingBall.quantity) return;
    if (editingBall.type === 'LOST' && !editingBall.playerId) return;

    const isRecovered = editingBall.type === 'LOST' ? !!editingBall.recovered : false;

    updateBallRecord(editingBall.id, {
      ...editingBall,
      quantity: Number(editingBall.quantity),
      recovered: isRecovered,
      recoveredAt: isRecovered ? (editingBall.recoveredAt || new Date().toISOString()) : null
    });
    
    setEditingBall(null);
  };

  const handleAcknowledgeRecovery = (ball) => {
    if (!ball) return;
    const updatedBall = {
      ...ball,
      recovered: true,
      recoveredAt: new Date().toISOString()
    };
    updateBallRecord(ball.id, updatedBall);
    if (viewingBall?.id === ball.id) {
      setViewingBall(updatedBall);
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
  const processedBalls = useMemo(() => {
    let result = [...balls];

    if (filterType !== 'ALL') {
      result = result.filter(b => b.type === filterType);
    }

    if (filterRecovery !== 'ALL') {
      result = result.filter((b) => {
        const isRecovered = !!b.recovered;
        return filterRecovery === 'RECOVERED' ? isRecovered : !isRecovered;
      });
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(b => {
        const player = players.find(p => p.id === b.playerId);
        const playerName = player ? player.name.toLowerCase() : '';
        const desc = (b.description || '').toLowerCase();
        const reason = (b.reason || '').toLowerCase();
        return playerName.includes(lowerQuery) || desc.includes(lowerQuery) || reason.includes(lowerQuery);
      });
    }

    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortConfig.key === 'quantity') {
        return sortConfig.direction === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
      }
      if (sortConfig.key === 'type') {
        return sortConfig.direction === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      }
      return 0;
    });

    return result;
  }, [balls, players, filterType, filterRecovery, searchQuery, sortConfig]);

  const playerOptions = players.map(p => ({ label: p.name, value: p.id }));

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Ball Inventory</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} /> Add Record
          </button>
        )}
      </div>

      {isAdmin && showAddForm && (
        <div className="glass-card mb-6" style={{ animation: 'fadeInDown 0.2s ease-out', position: 'relative', zIndex: 20 }}>
          <h2 className="mb-4">New Ball Record</h2>
          <form onSubmit={handleAddSubmit} className="flex" style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
              <label>Record Type</label>
              <CustomSelect 
                value={formData.type}
                onChange={(val) => setFormData({...formData, type: val})}
                options={[
                  { label: 'New Stock Added', value: 'ADDED' },
                  { label: 'Ball Lost/Damaged', value: 'LOST' }
                ]}
              />
            </div>

            <div className="form-group" style={{ flex: '1', minWidth: '100px', marginBottom: 0 }}>
              <label>Quantity</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                placeholder="1"
                min="1"
                required
              />
            </div>

            {formData.type === 'LOST' && (
              <>
                <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
                  <label>Who lost it?</label>
                  <CustomSelect 
                    value={formData.playerId}
                    onChange={(val) => setFormData({...formData, playerId: val})}
                    options={playerOptions}
                    placeholder="Select Player"
                  />
                </div>
                
                <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
                  <label>Reason</label>
                  <CustomSelect 
                    value={formData.reason}
                    onChange={(val) => setFormData({...formData, reason: val})}
                    options={reasons}
                  />
                </div>
              </>
            )}

            <div className="form-group" style={{ flex: '2', minWidth: '200px', marginBottom: 0 }}>
              <label>Notes / Description</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="e.g. Bought 1 box"
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ background: 'var(--success-color)', color: '#fff', border: 'none' }}>
              Save
            </button>
          </form>
        </div>
      )}

      {/* Filters Section */}
      <div className="glass-card mb-4 flex justify-between items-center" style={{ padding: '1rem 1.5rem', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 10 }}>
        <div className="flex items-center" style={{ gap: '1rem', flex: 1, minWidth: '250px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search player, reason, or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ width: '200px' }}>
            <CustomSelect 
              value={filterType}
              onChange={setFilterType}
              options={[
                { label: 'All Records', value: 'ALL' },
                { label: 'Added Stock', value: 'ADDED' },
                { label: 'Lost Balls', value: 'LOST' }
              ]}
            />
          </div>
          <div style={{ width: '220px' }}>
            <CustomSelect 
              value={filterRecovery}
              onChange={setFilterRecovery}
              options={[
                { label: 'All Recovery Status', value: 'ALL' },
                { label: 'Recovery Pending', value: 'PENDING' },
                { label: 'Recovered', value: 'RECOVERED' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                  Date <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'date' ? 1 : 0.3 }} />
                </th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                  Type <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'type' ? 1 : 0.3 }} />
                </th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                  Quantity <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'quantity' ? 1 : 0.3 }} />
                </th>
                <th>Player (If Lost)</th>
                <th>Reason</th>
                <th>Description</th>
                <th className="text-center">Recovery</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {processedBalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    No ball records found.
                  </td>
                </tr>
              ) : (
                processedBalls.map((ball) => {
                  const player = players.find(p => p.id === ball.playerId);
                  const isRecovered = !!ball.recovered;
                  return (
                    <tr key={ball.id} onClick={() => setViewingBall(ball)} style={{ cursor: 'pointer' }}>
                      <td>{format(new Date(ball.date), 'dd MMM yy, HH:mm')}</td>
                      <td>
                        <span className={`badge ${ball.type === 'ADDED' ? 'badge-success' : 'badge-danger'}`}>
                          {ball.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{ball.quantity}</td>
                      <td>{ball.type === 'LOST' ? (player ? player.name : 'Unknown') : '-'}</td>
                      <td>{ball.type === 'LOST' ? ball.reason : '-'}</td>
                      <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ball.description || '-'}
                      </td>
                      <td className="text-center">
                        {ball.type === 'LOST' ? (
                          <span className={`badge ${isRecovered ? 'badge-success' : 'badge-danger'}`}>
                            {isRecovered ? 'Recovered' : 'Recovery Pending'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                            {ball.type === 'LOST' && !isRecovered && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcknowledgeRecovery(ball);
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--success-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Acknowledge recovered"
                                aria-label="Acknowledge recovered"
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => setEditingBall(ball)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Edit"
                              aria-label="Edit"
                            >
                              <Edit2 size={18} className="hover:text-primary" />
                            </button>
                            <button 
                              onClick={() => removeBallRecord(ball.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 size={18} className="hover:text-danger" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isAdmin && (
        <Modal isOpen={!!editingBall} onClose={() => setEditingBall(null)} title="Edit Ball Record">
          {editingBall && (
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type</label>
                <CustomSelect 
                  value={editingBall.type}
                  onChange={(val) => setEditingBall({...editingBall, type: val})}
                  options={[
                    { label: 'New Stock Added', value: 'ADDED' },
                    { label: 'Ball Lost/Damaged', value: 'LOST' }
                  ]}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Quantity</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={editingBall.quantity}
                  onChange={(e) => setEditingBall({...editingBall, quantity: e.target.value})}
                  required
                />
              </div>

              {editingBall.type === 'LOST' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Player</label>
                    <CustomSelect 
                      value={editingBall.playerId}
                      onChange={(val) => setEditingBall({...editingBall, playerId: val})}
                      options={playerOptions}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Reason</label>
                    <CustomSelect 
                      value={editingBall.reason}
                      onChange={(val) => setEditingBall({...editingBall, reason: val})}
                      options={reasons}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Recovery Status</label>
                    <CustomSelect
                      value={editingBall.recovered ? 'RECOVERED' : 'PENDING'}
                      onChange={(val) => setEditingBall({
                        ...editingBall,
                        recovered: val === 'RECOVERED',
                        recoveredAt: val === 'RECOVERED' ? (editingBall.recoveredAt || new Date().toISOString()) : null
                      })}
                      options={[
                        { label: 'Recovery Pending', value: 'PENDING' },
                        { label: 'Recovered', value: 'RECOVERED' }
                      ]}
                    />
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  value={editingBall.description}
                  onChange={(e) => setEditingBall({...editingBall, description: e.target.value})}
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Save Changes
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* View Details Modal */}
      <Modal isOpen={!!viewingBall} onClose={() => setViewingBall(null)} title="Ball Record Details">
        {viewingBall && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Date</p>
                <p style={{ fontWeight: 500 }}>{format(new Date(viewingBall.date), 'dd MMMM yyyy, HH:mm')}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Type</p>
                <span className={`badge ${viewingBall.type === 'ADDED' ? 'badge-success' : 'badge-danger'}`}>
                  {viewingBall.type}
                </span>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Quantity</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{viewingBall.quantity}</p>
              </div>
              {viewingBall.type === 'LOST' && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Recovery Status</p>
                  <span className={`badge ${viewingBall.recovered ? 'badge-success' : 'badge-danger'}`}>
                    {viewingBall.recovered ? 'Recovered' : 'Recovery Pending'}
                  </span>
                </div>
              )}
              {viewingBall.type === 'LOST' && (
                <>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Player</p>
                    <p style={{ fontWeight: 500 }}>{players.find(p => p.id === viewingBall.playerId)?.name || 'Unknown'}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Reason</p>
                    <p style={{ fontWeight: 500 }}>{viewingBall.reason}</p>
                  </div>
                </>
              )}
            </div>
            
            <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Description / Notes</p>
              <p style={{ lineHeight: 1.5 }}>{viewingBall.description || 'No description provided.'}</p>
            </div>

            {viewingBall.type === 'LOST' && !viewingBall.recovered && (
              <button
                className="btn btn-success"
                onClick={() => handleAcknowledgeRecovery(viewingBall)}
                style={{ background: 'var(--success-color)', color: '#fff', border: 'none', alignSelf: 'flex-start' }}
              >
                Acknowledge Money Recovered
              </button>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default BallManagement;
