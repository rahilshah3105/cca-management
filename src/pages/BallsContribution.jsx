import { useState, useMemo } from 'react';
import { useStore, showPrompt, showAlert } from '../store/useStore';
import { Search, ArrowUpDown, Plus } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import DatePicker from '../components/DatePicker';
import { format } from 'date-fns';
import { parseImportedFile, validateImportedRecords } from '../utils/importRecords';

const BallsContribution = () => {
    const { funds, players, addFund, isAdmin, addPlayer } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [showForm, setShowForm] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const [formData, setFormData] = useState({
        amount: '',
        type: 'INCOME',
        playerId: '',
        description: '',
        date: ''
    });

    const handleAddNewPlayer = async (name) => {
        let playerName = name;
        if (!playerName) playerName = await showPrompt("Enter new player name:");
        if (playerName && playerName.trim()) {
            const newId = addPlayer({ name: playerName.trim() });
            setFormData({ ...formData, playerId: newId });
        }
    };

    const handleImportRecords = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedExtensions = ['.json', '.txt', '.xlsx', '.xls', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            setImportStatus('Only .json, .txt, .xlsx, .xls, and .docx files are allowed');
            setTimeout(() => setImportStatus(''), 3000);
            e.target.value = '';
            return;
        }

        try {
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.docx')) {
                setImportStatus('Error: Excel and Word files require conversion. Please export as CSV or JSON first.');
                setTimeout(() => setImportStatus(''), 3000);
                e.target.value = '';
                return;
            }

            const records = await parseImportedFile(file);
            const validation = validateImportedRecords(records);

            if (!validation.valid) {
                setImportStatus(validation.message);
                setTimeout(() => setImportStatus(''), 3000);
                e.target.value = '';
                return;
            }

            let importedCount = 0;
            for (const record of validation.records) {
                const playerName = record.player;
                const amount = record.amount;
                const date = record.date;
                const description = record.description || '';

                let playerId = players.find(p => p.name.toLowerCase() === playerName.toLowerCase())?.id;
                if (!playerId) {
                    playerId = addPlayer({ name: playerName });
                }

                addFund({
                    amount: Number(amount),
                    type: 'INCOME',
                    playerId,
                    category: 'Balls',
                    description,
                    date: new Date(date).toISOString()
                });
                importedCount++;
            }

            setImportStatus(`Successfully imported ${importedCount} record(s)!`);
            setTimeout(() => setImportStatus(''), 3000);
        } catch (error) {
            setImportStatus(`Error importing file: ${error.message}`);
            setTimeout(() => setImportStatus(''), 3000);
        }
        
        e.target.value = '';
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
            const playerExpenses = funds.filter(f => f.playerId === formData.playerId && f.type === 'EXPENSE' && f.category === 'Balls');
            if (playerExpenses.length > 0) {
                const latestExpenseDate = new Date(Math.max(...playerExpenses.map(f => new Date(f.date).getTime())));
                const incomeDate = new Date(formData.date);
                if (incomeDate < latestExpenseDate) {
                    await showAlert(`Recovery money date cannot be earlier than when the ball was lost (${format(latestExpenseDate, 'dd MMM yyyy')}).`);
                    return;
                }
            }
        }

        addFund({
            ...formData,
            category: 'Balls',
            amount: Number(formData.amount)
        });

        setFormData({ amount: '', type: 'INCOME', playerId: '', description: '', date: '' });
        setShowForm(false);
    };

    const playerOptions = players.map(p => ({ label: p.name, value: p.id }));

    // Process data - Show individual entries for Balls category
    const ballsEntries = useMemo(() => {
        const ballsData = funds.filter(f => f.category === 'Balls' && f.type === 'INCOME');
        
        let result = ballsData.map((fund, index) => ({
            id: fund.id || index,
            date: fund.date,
            playerId: fund.playerId,
            playerName: players.find(p => p.id === fund.playerId)?.name || 'Unknown',
            amount: fund.amount
        }));

        // Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(entry => entry.playerName.toLowerCase().includes(lowerQuery));
        }

        // Sort
        result.sort((a, b) => {
            if (sortConfig.key === 'date') {
                return sortConfig.direction === 'desc'
                    ? new Date(b.date).getTime() - new Date(a.date).getTime()
                    : new Date(a.date).getTime() - new Date(b.date).getTime();
            }
            if (sortConfig.key === 'player') {
                return sortConfig.direction === 'asc'
                    ? a.playerName.localeCompare(b.playerName)
                    : b.playerName.localeCompare(a.playerName);
            }
            if (sortConfig.key === 'amount') {
                return sortConfig.direction === 'desc' ? b.amount - a.amount : a.amount - b.amount;
            }
            return 0;
        });

        return result;
    }, [funds, players, searchQuery, sortConfig]);

    return (
        <div className="page-container" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Balls Contributions</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Total collected: <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success-color)' }}>
                            ₹{ballsEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)}
                        </span>
                    </p>
                </div>
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary mb-6" onClick={() => setShowForm(!showForm)}>
                            <Plus size={18} /> Add Entry
                        </button>
                        <button 
                            className="btn btn-primary mb-6" 
                            onClick={() => document.getElementById('import-file-input')?.click()}
                            style={{ background: 'var(--secondary-color)', border: 'none' }}
                        >
                            📥 Import Records
                        </button>
                        <input 
                            id="import-file-input"
                            type="file" 
                            accept=".json,.txt,.xlsx,.xls,.docx"
                            onChange={handleImportRecords}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}
            </div>

            {importStatus && (
                <div style={{
                    padding: '1rem',
                    background: importStatus.includes('Error') ? 'var(--danger-bg)' : 'var(--success-bg)',
                    border: importStatus.includes('Error') ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    color: importStatus.includes('Error') ? 'var(--danger-color)' : 'var(--success-color)',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{importStatus}</span>
                </div>
            )}

            {isAdmin && showForm && (
                <div className="glass-card mb-6" style={{ animation: 'fadeInDown 0.2s ease-out', position: 'relative', zIndex: 10 }}>
                    <h2 className="mb-4">New Balls Contribution</h2>
                    <form onSubmit={handleAddSubmit} className="flex" style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
                            <label>Player</label>
                            <CustomSelect
                                value={formData.playerId}
                                onChange={(val) => setFormData({ ...formData, playerId: val })}
                                options={playerOptions}
                                placeholder="Search or add player..."
                                onAddNew={handleAddNewPlayer}
                            />
                        </div>

                        <div className="form-group" style={{ flex: '1', minWidth: '160px', marginBottom: 0 }}>
                            <label>Date</label>
                            <DatePicker
                                value={formData.date}
                                onChange={(iso) => setFormData({ ...formData, date: iso })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: '2', minWidth: '200px', marginBottom: 0 }}>
                            <label>Description</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="e.g. Ball purchase"
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
                                <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                    Date <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'date' ? 1 : 0.3 }} />
                                </th>
                                <th onClick={() => handleSort('player')} style={{ cursor: 'pointer' }}>
                                    Player <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'player' ? 1 : 0.3 }} />
                                </th>
                                <th className="text-right" onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                                    Amount (₹) <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: sortConfig.key === 'amount' ? 1 : 0.3 }} />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {ballsEntries.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                                        No contributions found.
                                    </td>
                                </tr>
                            ) : (
                                ballsEntries.map((entry, index) => (
                                    <tr key={entry.id}>
                                        <td style={{ color: 'var(--text-secondary)' }}>#{index + 1}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{format(new Date(entry.date), 'dd MMM yyyy')}</td>
                                        <td style={{ fontWeight: 500 }}>{entry.playerName}</td>
                                        <td className="text-right" style={{ fontWeight: 600, color: 'var(--success-color)', fontSize: '1.1rem' }}>
                                            ₹{entry.amount}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BallsContribution;
