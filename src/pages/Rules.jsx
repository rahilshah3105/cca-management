import { useState } from 'react';
import { useStore, showConfirm } from '../store/useStore';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import Modal from '../components/Modal';

const Rules = () => {
  const { rules, addRule, updateRule, removeRule, isAdmin } = useStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingRule, setEditingRule] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addRule({ title: title.trim(), content: content.trim() });
    setTitle('');
    setContent('');
  };

  const handleEditOpen = (rule) => {
    setEditingRule(rule);
    setEditTitle(rule.title);
    setEditContent(rule.content || '');
  };

  const handleEditSave = () => {
    if (!editTitle.trim()) return;
    updateRule(editingRule.id, { title: editTitle.trim(), content: editContent.trim() });
    setEditingRule(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm('Delete this rule?');
    if (ok) removeRule(id);
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1>Rules</h1>
      </div>

      {isAdmin && (
        <div className="glass-card mb-6">
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <input type="text" className="form-control" placeholder="Rule title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <input type="text" className="form-control" placeholder="Short description" value={content} onChange={(e) => setContent(e.target.value)} />
            <button type="submit" className="btn btn-success"><Plus size={14} /> Add</button>
          </form>
        </div>
      )}

      <div className="glass-card">
        {rules.length === 0 ? (
          <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>No rules defined.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {rules.map((r) => (
              <div key={r.id} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  {r.content && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{r.content}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isAdmin && (
                    <>
                      <button onClick={() => handleEditOpen(r)} className="btn" style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(r.id)} className="btn" style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editingRule} onClose={() => setEditingRule(null)} title="Edit Rule">
        {editingRule && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Rule Title</label>
              <input
                type="text"
                className="form-control"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter rule title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter rule description"
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                className="btn btn-success"
                onClick={handleEditSave}
                style={{ background: 'var(--success-color)', color: '#fff', border: 'none', flex: 1 }}
              >
                Save Changes
              </button>
              <button
                className="btn"
                onClick={() => setEditingRule(null)}
                style={{ flex: 1, color: 'var(--text-color)', background: 'transparent', border: '1px solid var(--border-color)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Rules;
