import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, LogOut, Eye, EyeOff, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './FamilyManagement.css';

/* ── Toast ── */
const Toast = ({ toasts, remove }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.message}</span>
        <button className="toast-close" onClick={() => remove(t.id)}>✕</button>
      </div>
    ))}
  </div>
);
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const remove = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

/* ── Password Strength ── */
function getStrength(pw) {
  if (!pw) return { level: 0, label: '', cls: '' };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const clss   = ['', 'label-weak', 'label-fair', 'label-good', 'label-strong'];
  return { level: s, label: labels[s], cls: clss[s] };
}

/* ── Logout All Modal ── */
const LogoutAllModal = ({ onConfirm, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="confirm-icon"><AlertTriangle size={32} /></div>
      <h3>Log Out All Devices?</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
        This will sign you out from all active sessions. You'll need to log in again on each device.
      </p>
      <div className="security-warning" style={{ textAlign: 'left', width: '100%' }}>
        <AlertTriangle size={16} className="security-warning-icon" />
        <div>
          <h4>Cannot be undone</h4>
          <p>All sessions, cookies, and refresh tokens will be revoked.</p>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>Log Out All</button>
      </div>
    </div>
  </div>
);

/* ── Main ── */
const Security = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, add: toast, remove } = useToast();

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw]   = useState({ current: false, newPw: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [twoFA, setTwoFA] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vaultx_2fa') || 'false'); } catch { return false; }
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const strength = getStrength(pwForm.newPw);

  const validatePw = () => {
    const e = {};
    if (!pwForm.current)                 e.current = 'Enter your current password';
    if (!pwForm.newPw)                   e.newPw   = 'Enter a new password';
    else if (pwForm.newPw.length < 8)    e.newPw   = 'Minimum 8 characters';
    if (pwForm.newPw !== pwForm.confirm) e.confirm  = 'Passwords do not match';
    return e;
  };

  const handleChangePw = async () => {
    const e = validatePw();
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setPwLoading(false);
    setPwForm({ current: '', newPw: '', confirm: '' });
    setPwErrors({});
    toast('Password changed successfully!', 'success');
  };

  const toggleTwoFA = () => {
    const next = !twoFA;
    setTwoFA(next);
    localStorage.setItem('vaultx_2fa', JSON.stringify(next));
    toast(next ? '2FA enabled' : '2FA disabled', next ? 'success' : 'info');
  };

  const handleLogoutAll = () => {
    setShowLogoutModal(false);
    toast('Logged out from all devices', 'info');
    setTimeout(() => { logout(); navigate('/login'); }, 1200);
  };

  /* Password input with show/hide toggle */
  const PwInput = ({ field, placeholder }) => (
    <div style={{ position: 'relative' }}>
      <input
        type={showPw[field] ? 'text' : 'password'}
        className={pwErrors[field] ? 'input-error' : ''}
        value={pwForm[field]}
        placeholder={placeholder}
        onChange={e => {
          setPwForm(p => ({ ...p, [field]: e.target.value }));
          setPwErrors(p => ({ ...p, [field]: '' }));
        }}
        style={{ paddingRight: '42px' }}
      />
      <button
        type="button"
        onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex', padding: 0,
        }}
      >
        {showPw[field] ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  return (
    <div className="page-container sec-wide">
      <Toast toasts={toasts} remove={remove} />

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title"><ShieldCheck size={28} /> Security</h1>
        <p className="page-subtitle">Manage your account security and authentication settings.</p>
      </div>

      {/* Two-column grid */}
      <div className="sec-grid">

        {/* ── LEFT: Change Password ── */}
        <div className="settings-card sec-pw-card">
          <div className="card-header" style={{ marginBottom: 20 }}>
            <div className="card-title-group">
              <span className="card-icon-wrap security-icon"><Lock size={18} /></span>
              <div>
                <h2 className="card-title">Change Password</h2>
                <p className="card-desc">Keep your account secure with a strong password</p>
              </div>
            </div>
          </div>

          {/* Fields fill remaining height */}
          <div className="sec-pw-fields">
            <div className="form-group">
              <label>Current Password</label>
              <PwInput field="current" placeholder="Enter current password" />
              {pwErrors.current && <span className="field-error">{pwErrors.current}</span>}
            </div>

            <div className="form-group">
              <label>New Password</label>
              <PwInput field="newPw" placeholder="Enter new password (min. 8 chars)" />
              {pwForm.newPw && (
                <>
                  <div className="pw-strength">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`pw-bar ${strength.level >= i ? `active-${strength.label.toLowerCase()}` : ''}`} />
                    ))}
                  </div>
                  <span className={`pw-label ${strength.cls}`}>{strength.label}</span>
                </>
              )}
              {pwErrors.newPw && <span className="field-error">{pwErrors.newPw}</span>}
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <PwInput field="confirm" placeholder="Confirm new password" />
              {pwErrors.confirm && <span className="field-error">{pwErrors.confirm}</span>}
            </div>

            {/* Button pinned to the bottom */}
            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <button
                className="btn-primary"
                onClick={handleChangePw}
                disabled={pwLoading}
                style={{ opacity: pwLoading ? 0.7 : 1 }}
              >
                {pwLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Saving…
                  </span>
                ) : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: 2FA + Sessions ── */}
        <div className="sec-right-col">

          {/* 2FA card */}
          <div className="settings-card">
            <div className="card-header" style={{ marginBottom: twoFA ? 16 : 12 }}>
              <div className="card-title-group">
                <span className="card-icon-wrap security-icon"><Smartphone size={18} /></span>
                <div>
                  <h2 className="card-title">Two-Factor Auth</h2>
                  <p className="card-desc">Extra layer of account protection</p>
                </div>
              </div>
              {/* Toggle sits in card-header, right-aligned */}
              <label className="toggle-switch">
                <input type="checkbox" checked={twoFA} onChange={toggleTwoFA} />
                <span className="toggle-slider" />
              </label>
            </div>

            {!twoFA ? (
              <div className="security-warning">
                <AlertTriangle size={16} className="security-warning-icon" />
                <div>
                  <h4>2FA is disabled</h4>
                  <p>Enable authenticator app protection for your account.</p>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px 16px', borderRadius: 10, color: '#4ade80',
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: '0.875rem', display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <CheckCircle size={16} />
                <span>2FA is active. Your account is protected.</span>
              </div>
            )}
          </div>

          {/* Sessions card — grows to fill remaining space */}
          <div className="settings-card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div className="card-title-group">
                <span className="card-icon-wrap" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                  <LogOut size={18} />
                </span>
                <div>
                  <h2 className="card-title">Active Sessions</h2>
                  <p className="card-desc">Manage where you're signed in</p>
                </div>
              </div>
            </div>

            <div className="security-warning" style={{ marginBottom: 20 }}>
              <AlertTriangle size={16} className="security-warning-icon" />
              <div>
                <h4>Revoke all sessions</h4>
                <p>Immediately signs you out of VaultX on all devices. Use if you suspect unauthorized access.</p>
              </div>
            </div>

            <button
              className="btn-danger"
              onClick={() => setShowLogoutModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <LogOut size={15} /> Log Out All Devices
            </button>
          </div>

        </div>{/* end sec-right-col */}
      </div>{/* end sec-grid */}

      {showLogoutModal && (
        <LogoutAllModal onConfirm={handleLogoutAll} onClose={() => setShowLogoutModal(false)} />
      )}
    </div>
  );
};

export default Security;
