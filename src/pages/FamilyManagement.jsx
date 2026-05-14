import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Edit3, X, Check, Crown, Eye, Shield, ChevronDown, AlertTriangle, Link2, Loader } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import './FamilyManagement.css';

/* ── Toast ── */
const Toast = ({ toasts, remove }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.message}</span>
        <button className="toast-close" onClick={() => remove(t.id)}><X size={14} /></button>
      </div>
    ))}
  </div>
);
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, add, remove };
}

/* ── Role Icon ── */
const RoleIcon = ({ role }) => {
  if (role === 'Admin') return <Crown size={13} className="role-icon role-admin" />;
  if (role === 'Member') return <Shield size={13} className="role-icon role-member" />;
  return <Eye size={13} className="role-icon role-viewer" />;
};

/* ── Confirm Remove ── */
const ConfirmModal = ({ member, onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-card confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="confirm-icon"><AlertTriangle size={32} /></div>
      <h3>Remove Member?</h3>
      <p>Are you sure you want to remove <strong>{member.name}</strong>? This cannot be undone.</p>
      <div className="modal-actions">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>Remove</button>
      </div>
    </div>
  </div>
);

/* ── Link Account Modal ── */
const LinkAccountModal = ({ onLink, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLink(email.trim().toLowerCase(), role);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to link account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Link2 size={20} /> Link Account</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="modal-desc">Enter the email address of the person you want to add. They must already have a VaultX account.</p>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            className={error ? 'input-error' : ''}
            value={email}
            placeholder="friend@gmail.com"
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          {error && <span className="field-error">{error}</span>}
        </div>
        <div className="form-group">
          <label>Role</label>
          <div className="select-wrapper">
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option>Admin</option><option>Member</option><option>Viewer</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Linking…</> : 'Link Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Member Card ── */
const MemberCard = ({ member, isAdmin, assetCount, editingRoleId, setEditingRoleId, onRoleChange, onRemove, isCurrentUser }) => {
  const ROLES = ['Admin', 'Member', 'Viewer'];
  const memberKey = member.uid || member.email;

  return (
    <div className="member-card">
      <div className="mc-top">
        <div className="mc-avatar">{(member.name || '?')[0].toUpperCase()}</div>
        <div className="mc-info">
          <span className="mc-name">
            {member.name}
            {isCurrentUser && <span style={{ fontSize: '0.7rem', marginLeft: 6, color: 'var(--accent-color)', fontWeight: 700 }}>You</span>}
            {member.status === 'invited' && <span style={{ fontSize: '0.7rem', marginLeft: 6, color: '#94a3b8' }}>(not registered)</span>}
          </span>
          <span className="mc-email">{member.email}</span>
        </div>
        {isAdmin && !isCurrentUser && (
          <button className="btn-remove mc-remove" onClick={() => onRemove(member)} title="Remove">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="mc-bottom">
        <div className="mc-assets-pill">{assetCount} asset{assetCount !== 1 ? 's' : ''}</div>
        {isAdmin && !isCurrentUser && editingRoleId === memberKey ? (
          <div className="role-select-inline">
            {ROLES.map(r => (
              <button key={r}
                className={`role-btn ${member.role === r ? 'role-btn-active' : ''}`}
                onClick={() => onRoleChange(memberKey, r)}>
                {r}
              </button>
            ))}
            <button className="btn-icon-ghost" onClick={() => setEditingRoleId(null)}><X size={11} /></button>
          </div>
        ) : (
          <div
            className={`role-badge role-${member.role?.toLowerCase()} ${isAdmin && !isCurrentUser ? 'role-clickable' : ''}`}
            onClick={() => isAdmin && !isCurrentUser && setEditingRoleId(memberKey)}
          >
            <RoleIcon role={member.role} />
            {member.role}
            {isAdmin && !isCurrentUser && <Edit3 size={10} className="edit-hint" />}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main ── */
const FamilyManagement = () => {
  const { family, updateFamilyName, removeMember, updateMemberRole, inviteMember } = useSettings();
  const { allAssets } = useAssets();
  const { user } = useAuth();
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(family.familyName);
  const [showLink, setShowLink] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);

  const members = family.members;
  const assetCountByUid = allAssets.reduce((acc, a) => {
    if (a.ownerUid) acc[a.ownerUid] = (acc[a.ownerUid] || 0) + 1;
    return acc;
  }, {});

  const currentMember = members.find(m => m.uid === user?.uid);
  const isAdmin = !currentMember || currentMember.role === 'Admin';

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    updateFamilyName(tempName.trim());
    setEditingName(false);
    addToast('Family name updated!', 'success');
  };

  const handleLink = async (email, role) => {
    if (email === user?.email?.toLowerCase()) throw new Error('You cannot link your own account.');
    const alreadyExists = members.find(m => m.email?.toLowerCase() === email);
    if (alreadyExists) throw new Error('This account is already linked to your family.');
    await inviteMember(email, role);
    addToast('Account linked successfully!', 'success');
  };

  const handleRemove = () => {
    removeMember(confirmRemove.uid);
    addToast(`${confirmRemove.name} removed`, 'info');
    setConfirmRemove(null);
  };

  const handleRoleChange = (uid, role) => {
    updateMemberRole(uid, role);
    setEditingRoleId(null);
    addToast('Role updated', 'success');
  };

  return (
    <div className="page-container fm-wide">
      <Toast toasts={toasts} remove={removeToast} />

      <div className="page-header fm-header-row">
        <div>
          <h1 className="page-title"><Link2 size={28} /> Link Family Accounts</h1>
          <p className="page-subtitle">Link accounts to share and view combined portfolios.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowLink(true)}>
            <UserPlus size={15} /> Link Account
          </button>
        )}
      </div>

      {/* Family name card */}
      <div className="settings-card fm-name-card">
        <div className="card-title-group">
          <span className="card-icon-wrap family-icon"><Users size={18} /></span>
          <div style={{ flex: 1 }}>
            <p className="card-desc" style={{ marginBottom: 4 }}>Family Name</p>
            <div className="family-name-row">
              {editingName ? (
                <>
                  <input className="family-name-input" value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()} autoFocus />
                  <button className="btn-icon-success" onClick={handleSaveName}><Check size={16} /></button>
                  <button className="btn-icon-ghost" onClick={() => { setEditingName(false); setTempName(family.familyName); }}><X size={16} /></button>
                </>
              ) : (
                <>
                  <span className="family-name-text">{family.familyName}</span>
                  {isAdmin && <button className="btn-icon-ghost" onClick={() => setEditingName(true)}><Edit3 size={15} /></button>}
                </>
              )}
            </div>
          </div>
          <div className="fm-stats">
            <div className="fm-stat"><span className="fm-stat-num">{members.length}</span><span className="fm-stat-label">Members</span></div>
            <div className="fm-stat"><span className="fm-stat-num">{allAssets.length}</span><span className="fm-stat-label">Assets</span></div>
          </div>
        </div>
      </div>

      {/* Member cards */}
      <div className="member-cards-grid">
        {members.map(member => (
          <MemberCard
            key={member.uid || member.email}
            member={member}
            isAdmin={isAdmin}
            isCurrentUser={member.uid === user?.uid}
            assetCount={assetCountByUid[member.uid] || 0}
            editingRoleId={editingRoleId}
            setEditingRoleId={setEditingRoleId}
            onRoleChange={handleRoleChange}
            onRemove={setConfirmRemove}
          />
        ))}
      </div>

      {/* Role legend */}
      <div className="settings-card role-legend-card">
        <h3 className="legend-title">Role Permissions</h3>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="role-badge role-admin"><Crown size={13} /> Admin</span>
            <p>Full access — manage members, edit roles, view all data.</p>
          </div>
          <div className="legend-item">
            <span className="role-badge role-member"><Shield size={13} /> Member</span>
            <p>Add/edit own assets, cannot manage other members.</p>
          </div>
          <div className="legend-item">
            <span className="role-badge role-viewer"><Eye size={13} /> Viewer</span>
            <p>Read-only — view but not modify any portfolio data.</p>
          </div>
        </div>
      </div>

      {showLink && <LinkAccountModal onLink={handleLink} onClose={() => setShowLink(false)} />}
      {confirmRemove && <ConfirmModal member={confirmRemove} onConfirm={handleRemove} onCancel={() => setConfirmRemove(null)} />}
    </div>
  );
};

export default FamilyManagement;
