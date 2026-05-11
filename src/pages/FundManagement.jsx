import { useState, useMemo } from 'react';
import { useStore, showPrompt, showAlert } from '../store/useStore';
import { Plus, Trash2, ArrowUpDown, Search, Edit2, Info } from 'lucide-react';
import { format } from 'date-fns';
import CustomSelect from '../components/CustomSelect';
import Modal from '../components/Modal';
import DatePicker from '../components/DatePicker';
import { Link } from 'react-router-dom';

const FundManagement = () => {
  const { funds, addFund, updateFund, removeFund, players, isAdmin, addPlayer } = useStore();
  
  // Modals state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [viewingFund, setViewingFund] = useState(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'INCOME',
    playerId: '',
    category: 'Other',
    description: '',
    date: ''
  });

  const handleAddNewPlayer = async () => {
    const name = await showPrompt("Enter new player name:");
    if (name && name.trim()) {
      const newId = addPlayer({ name: name.trim() });
      setFormData({ ...formData, playerId: newId });
    }
  };

  // Filter and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Get available years from funds
  const availableYears = useMemo(() => {
    const years = funds.map(f => new Date(f.date).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [funds]);

  const categoryOptions = [
    { label: 'Stumps', value: 'Stumps' },
    { label: 'Bat', value: 'Bat' },
    { label: 'Balls', value: 'Balls' },
    { label: 'Other', value: 'Other' }
  ];

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.date || (!formData.playerId && formData.category !== 'Other')) return;

    if (formData.type === 'INCOME' && formData.playerId && formData.category) {
        const playerExpenses = funds.filter(f => f.playerId === formData.playerId && f.type === 'EXPENSE' && f.category === formData.category);
        if (playerExpenses.length > 0) {
            const latestExpenseDate = new Date(Math.max(...playerExpenses.map(f => new Date(f.date).getTime())));
            const incomeDate = new Date(formData.date);
            if (incomeDate < latestExpenseDate) {
                await showAlert(`Recovery money date cannot be earlier than the latest ${formData.category} expense (${format(latestExpenseDate, 'dd MMM yyyy')}).`);
                return;
            }
        }
    }
    
    addFund({
      ...formData,
      amount: Number(formData.amount)
    });
    
    setFormData({ amount: '', type: 'INCOME', playerId: '', category: 'Other', description: '', date: '' });
    setShowAddForm(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingFund.amount || !editingFund.playerId) return;

    if (editingFund.type === 'INCOME' && editingFund.playerId && editingFund.category) {
        const playerExpenses = funds.filter(f => f.playerId === editingFund.playerId && f.type === 'EXPENSE' && f.category === editingFund.category && f.id !== editingFund.id);
        if (playerExpenses.length > 0) {
            const latestExpenseDate = new Date(Math.max(...playerExpenses.map(f => new Date(f.date).getTime())));
            const incomeDate = new Date(editingFund.date);
            if (incomeDate < latestExpenseDate) {
                await showAlert(`Recovery money date cannot be earlier than the latest ${editingFund.category} expense (${format(latestExpenseDate, 'dd MMM yyyy')}).`);
                return;
            }
        }
    }

    updateFund(editingFund.id, {
      ...editingFund,
      amount: Number(editingFund.amount)
    });
    
    setEditingFund(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Processed Data
  const processedFunds = useMemo(() => {
    let result = [...funds];

    if (filterType !== 'ALL') {
      result = result.filter(f => f.type === filterType);
    }

    if (filterYear !== 'ALL') {
      result = result.filter(f => new Date(f.date).getFullYear() === parseInt(filterYear));
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(f => {
        const player = players.find(p => p.id === f.playerId);
        const playerName = player ? player.name.toLowerCase() : '';
        const desc = (f.description || '').toLowerCase();
        return playerName.includes(lowerQuery) || desc.includes(lowerQuery);
      });
    }

    result.sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortConfig.key === 'player') {
        const nameA = players.find(p => p.id === a.playerId)?.name || '';
        const nameB = players.find(p => p.id === b.playerId)?.name || '';
        return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortConfig.key === 'type') {
        return sortConfig.direction === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      }
      return 0;
    });

    return result;
  }, [funds, players, filterType, filterYear, searchQuery, sortConfig]);

  const playerOptions = players.map(p => ({ label: p.name, value: p.id }));

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Fund Management</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} /> Add Transaction
          </button>
        )}
      </div>

      {/* Category Pages Navigation */}
      <div className="glass-card mb-6" style={{ padding: '1rem 1.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 500 }}>View contributions by category:</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/stumps-contribution" className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: 'rgba(74, 144, 226, 0.2)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', textDecoration: 'none', borderRadius: 'var(--radius-md)' }}>
            Stumps Contributions
          </Link>
          <Link to="/balls-contribution" className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: 'rgba(74, 144, 226, 0.2)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', textDecoration: 'none', borderRadius: 'var(--radius-md)' }}>
            Balls Contributions
          </Link>
          <Link to="/bats-contribution" className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: 'rgba(74, 144, 226, 0.2)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', textDecoration: 'none', borderRadius: 'var(--radius-md)' }}>
            Bats Contributions
          </Link>
        </div>
      </div>

      {isAdmin && showAddForm && (
        <div className="glass-card mb-6" style={{ animation: 'fadeInDown 0.2s ease-out', position: 'relative', zIndex: 20 }}>
          <h2 className="mb-4">New Transaction</h2>
          <form onSubmit={handleAddSubmit} className="flex" style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
              <label>Type</label>
              <CustomSelect 
                value={formData.type}
                onChange={(val) => setFormData({...formData, type: val})}
                options={[
                  { label: 'Income (Collected)', value: 'INCOME' },
                  { label: 'Expense (Spent)', value: 'EXPENSE' }
                ]}
              />
            </div>

            <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
              <label>Amount (₹)</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0"
                required
              />
            </div>

            <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
              <label>Player</label>
              <CustomSelect 
                value={formData.playerId}
                onChange={(val) => setFormData({...formData, playerId: val})}
                options={playerOptions}
                placeholder="Select Player"
                onAddNew={handleAddNewPlayer}
              />
            </div>

            <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
              <label>Category</label>
              <CustomSelect 
                value={formData.category}
                onChange={(val) => setFormData({...formData, category: val})}
                options={categoryOptions}
              />
            </div>

            <div className="form-group" style={{ flex: '1', minWidth: '160px', marginBottom: 0 }}>
              <label>Date</label>
              <DatePicker
                value={formData.date}
                onChange={(iso) => setFormData({...formData, date: iso})}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="form-group" style={{ flex: '2', minWidth: '200px', marginBottom: 0 }}>
              <label>Description</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="e.g. Monthly fee"
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
              placeholder="Search player or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
        <div style={{ width: '180px' }}>
          <CustomSelect 
            value={filterType}
            onChange={setFilterType}
            options={[
              { label: 'All Transactions', value: 'ALL' },
              { label: 'Income Only', value: 'INCOME' },
              { label: 'Expenses Only', value: 'EXPENSE' }
            ]}
          />
        </div>
        <div style={{ width: '150px' }}>
          <CustomSelect 
            value={filterYear}
            onChange={setFilterYear}
            options={[
              { label: 'All Years', value: 'ALL' },
              ...availableYears.map(year => ({ label: String(year), value: String(year) }))
            ]}
          />
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
                <th>Category</th>
                <th onClick={() => handleSort('player')} style={{ cursor: 'pointer' }}>
                  Player <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'player' ? 1 : 0.3 }} />
                </th>
                <th>Description</th>
                <th className="text-right" onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                  Amount (₹) <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'amount' ? 1 : 0.3 }} />
                </th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {processedFunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                processedFunds.map((fund) => {
                  const player = players.find(p => p.id === fund.playerId);
                  return (
                    <tr 
                      key={fund.id}
                      onClick={() => setViewingFund(fund)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td>{format(new Date(fund.date), 'dd MMM yy, HH:mm')}</td>
                      <td>
                        <span className={`badge ${fund.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                          {fund.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.9rem', fontWeight: 500 }}>{fund.category || 'Other'}</td>
                      <td>{player ? player.name : 'Unknown'}</td>
                      <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fund.description || '-'}
                      </td>
                      <td className={`text-right ${fund.type === 'INCOME' ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 600 }}>
                        {fund.type === 'INCOME' ? '+' : '-'} {fund.amount}
                      </td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => setEditingFund(fund)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                title="Edit"
                              >
                                <Edit2 size={18} className="hover:text-primary" />
                              </button>
                              <button 
                                onClick={() => removeFund(fund.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                title="Delete"
                              >
                                <Trash2 size={18} className="hover:text-danger" />
                              </button>
                            </>
                          )}
                        </div>
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
        <Modal isOpen={!!editingFund} onClose={() => setEditingFund(null)} title="Edit Transaction">
          {editingFund && (
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type</label>
                <CustomSelect 
                  value={editingFund.type}
                  onChange={(val) => setEditingFund({...editingFund, type: val})}
                  options={[
                    { label: 'Income (Collected)', value: 'INCOME' },
                    { label: 'Expense (Spent)', value: 'EXPENSE' }
                  ]}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={editingFund.amount}
                  onChange={(e) => setEditingFund({...editingFund, amount: e.target.value})}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Player</label>
                <CustomSelect 
                  value={editingFund.playerId}
                  onChange={(val) => setEditingFund({...editingFund, playerId: val})}
                  options={playerOptions}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Category</label>
                <CustomSelect 
                  value={editingFund.category || 'Other'}
                  onChange={(val) => setEditingFund({...editingFund, category: val})}
                  options={categoryOptions}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Date</label>
                <DatePicker
                  value={editingFund.date}
                  onChange={(iso) => setEditingFund({...editingFund, date: iso})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  value={editingFund.description}
                  onChange={(e) => setEditingFund({...editingFund, description: e.target.value})}
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
      <Modal isOpen={!!viewingFund} onClose={() => setViewingFund(null)} title="Transaction Details">
        {viewingFund && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Date</p>
                <p style={{ fontWeight: 500 }}>{format(new Date(viewingFund.date), 'dd MMMM yyyy, HH:mm')}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Type</p>
                <span className={`badge ${viewingFund.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                  {viewingFund.type}
                </span>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Category</p>
                <p style={{ fontWeight: 500 }}>{viewingFund.category || 'Other'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Player</p>
                <p style={{ fontWeight: 500 }}>{players.find(p => p.id === viewingFund.playerId)?.name || 'Unknown'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Amount</p>
                <p className={viewingFund.type === 'INCOME' ? 'text-success' : 'text-danger'} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                  {viewingFund.type === 'INCOME' ? '+' : '-'} ₹{viewingFund.amount}
                </p>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Description / Notes</p>
              <p style={{ lineHeight: 1.5 }}>{viewingFund.description || 'No description provided.'}</p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default FundManagement;
