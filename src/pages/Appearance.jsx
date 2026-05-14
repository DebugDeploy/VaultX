import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './FamilyManagement.css';

/* ───────── Toast ───────── */
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
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  const remove = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

const Appearance = () => {
  const { settings, updateSettings, accentColors } = useSettings();
  const { toasts, add: toast, remove } = useToast();

  const handleAccent = (key) => {
    updateSettings({ accentKey: key });
    toast(`Accent color updated to ${accentColors[key].label}`, 'success');
  };

  return (
    <div className="page-container">
      <Toast toasts={toasts} remove={remove} />

      <div className="page-header">
        <h1 className="page-title"><Palette size={28} /> Appearance</h1>
        <p className="page-subtitle">Personalize VaultX with your preferred accent color.</p>
      </div>

      {/* Accent Color — pills only */}
      <div className="settings-card">
        <div className="card-header">
          <div className="card-title-group">
            <span className="card-icon-wrap appear-icon"><Palette size={18} /></span>
            <div>
              <h2 className="card-title">Accent Color</h2>
              <p className="card-desc">Applied to buttons, highlights, active states, and charts throughout the app</p>
            </div>
          </div>
        </div>

        <div className="accent-grid">
          {Object.entries(accentColors).map(([key, c]) => (
            <button
              key={key}
              className={`accent-pill ${settings.accentKey === key ? 'active' : ''}`}
              style={{ background: c.value }}
              title={c.label}
              onClick={() => handleAccent(key)}
            />
          ))}
        </div>

        {/* Selected indicator */}
        <div className="accent-active-indicator">
          <span className="accent-swatch-current" style={{ background: accentColors[settings.accentKey]?.value }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Active:{' '}
            <strong style={{ color: accentColors[settings.accentKey]?.value }}>
              {accentColors[settings.accentKey]?.label}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
