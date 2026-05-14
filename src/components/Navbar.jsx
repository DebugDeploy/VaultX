import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Bitcoin, Coins, Building, Plus,
  User, Activity, PieChart, Landmark, Users, LogOut, Shield,
  Download, Palette, Link2, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetContext';
import styles from './Navbar.module.css';

const Navbar = ({ onAddClick }) => {
  const { user, logout } = useAuth();
  const {
    portfolioMembers, activePortfolio, setActivePortfolio,
    priceStatus,
  } = useAssets();

  const [time, setTime] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Overview',    path: '/dashboard',   icon: LayoutDashboard },
    { name: 'Stocks',      path: '/stocks',       icon: TrendingUp },
    { name: 'Crypto',      path: '/crypto',       icon: Bitcoin },
    { name: 'Commodities', path: '/commodities',  icon: Coins },
    { name: 'Real Estate', path: '/real-estate',  icon: Building },
    { name: 'ETFs',        path: '/etfs',         icon: PieChart },
    { name: 'Bonds',       path: '/bonds',        icon: Landmark },
  ];

  const settingsItems = [
    { label: 'Link Family Account', path: '/family',     icon: Link2 },
    { label: 'Appearance',          path: '/appearance', icon: Palette },
    { label: 'Security',            path: '/security',   icon: Shield },
    { label: 'Data Export',         path: '/export',     icon: Download },
  ];

  const goto = (path) => { setIsDropdownOpen(false); navigate(path); };

  const selectPortfolio = (uid) => {
    setActivePortfolio(uid);
    setIsDropdownOpen(false);
    navigate('/dashboard');
  };

  const isSettingsPage = settingsItems.some(s => location.pathname === s.path);

  // User display info
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Account';
  const initials = displayName.slice(0, 2).toUpperCase();

  // Me entry in portfolioMembers
  const meEntry = portfolioMembers.find(m => m.uid === user?.uid);
  const myName  = meEntry?.name || displayName;

  // Linked accounts (everyone except the current user)
  const linkedMembers = portfolioMembers.filter(m => m.uid !== user?.uid);

  // Active member info for the header
  const activeMember = activePortfolio === 'combined' || activePortfolio === user?.uid
    ? null
    : portfolioMembers.find(m => m.uid === activePortfolio);
  const headerName  = activeMember ? activeMember.name  : displayName;
  const headerEmail = activeMember ? activeMember.email : user?.email;
  const headerInitials = headerName.slice(0, 2).toUpperCase();

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>

        {/* ── Left: Logo + Nav links ───────────────── */}
        <div className={styles.leftNav}>
          <div className={styles.logo}>
            <Activity size={28} className={styles.logoIcon} />
            <span className={styles.logoText}>VaultX Portfolio Aggregator</span>
          </div>

          <div className={styles.navLinks}>
            {navItems.map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                }
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* ── Right: Live indicator + Add + Profile ── */}
        <div className={styles.navActions}>
          {/* Live price indicator */}
          <div
            className={styles.liveIndicator}
            title="Live prices"
          >
            {priceStatus === 'loading' ? (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="3"
                style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <span
                className={styles.dot}
                style={{ background: priceStatus === 'live' ? 'var(--profit)' : priceStatus === 'error' ? '#f97316' : 'var(--profit)' }}
              />
            )}
            {priceStatus === 'loading'
              ? 'Updating…'
              : priceStatus === 'live'
                ? `Live  ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Stale  ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>

          {user && (
            <button className={styles.addButton} onClick={onAddClick}>
              <Plus size={18} />
              <span>Add Asset</span>
            </button>
          )}

          {/* ── Profile dropdown ──────────────────── */}
          <div className={styles.profileContainer} ref={dropdownRef}>
            <div
              className={styles.profile}
              style={isSettingsPage ? {
                background: 'var(--accent-color)',
                color: '#fff',
                boxShadow: '0 0 12px var(--accent-color)',
              } : {}}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title={headerName}
            >
              {user ? (
                <span className={styles.profileInitials}>{headerInitials}</span>
              ) : (
                <User size={20} />
              )}
            </div>

            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>

                {/* ── User header ─────────────────── */}
                {user && (
                  <>
                    <div className={styles.userHeader}>
                      <div className={styles.userAvatar}>{headerInitials}</div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{headerName}</span>
                        <span className={styles.userEmail}>{headerEmail}</span>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider} />
                  </>
                )}

                {/* ── Portfolio section ────────────── */}
                <div className={styles.dropdownSection}>
                  <div className={styles.dropdownLabel}>Portfolios</div>

                  {/* 1. Family Combined — only when 2+ members */}
                  {portfolioMembers.length > 1 && (
                    <div
                      className={`${styles.dropdownItem} ${activePortfolio === 'combined' ? styles.activeDropdownItem : ''}`}
                      onClick={() => selectPortfolio('combined')}
                    >
                      <Users size={16} />
                      <span>Family Combined Portfolio</span>
                      {activePortfolio === 'combined' && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </div>
                  )}

                  {/* 2. Current user — always shown */}
                  {user && (
                    <div
                      className={`${styles.dropdownItem} ${activePortfolio === user.uid ? styles.activeDropdownItem : ''}`}
                      onClick={() => selectPortfolio(user.uid)}
                    >
                      <User size={16} />
                      <span>{myName} <span className={styles.youBadge}>You</span></span>
                      {activePortfolio === user.uid && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </div>
                  )}

                  {/* 3. Linked members — only when 2+ members */}
                  {portfolioMembers.length > 1 && linkedMembers.map(member => (
                    <div
                      key={member.uid}
                      className={`${styles.dropdownItem} ${activePortfolio === member.uid ? styles.activeDropdownItem : ''}`}
                      onClick={() => selectPortfolio(member.uid)}
                    >
                      <User size={16} />
                      <span>{member.name}</span>
                      {activePortfolio === member.uid && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </div>
                  ))}
                </div>

                <div className={styles.dropdownDivider} />

                {/* ── Settings section ─────────────── */}
                <div className={styles.dropdownSection}>
                  <div className={styles.dropdownLabel}>Settings</div>
                  {settingsItems.map(({ label, path, icon: Icon }) => (
                    <div
                      key={path}
                      className={`${styles.dropdownItem} ${location.pathname === path ? styles.activeDropdownItem : ''}`}
                      onClick={() => goto(path)}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.dropdownDivider} />

                {/* ── Logout ───────────────────────── */}
                <div className={styles.dropdownSection}>
                  {user ? (
                    <div
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                      onClick={() => { logout(); setIsDropdownOpen(false); navigate('/login'); }}
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </div>
                  ) : (
                    <div
                      className={styles.dropdownItem}
                      onClick={() => goto('/login')}
                    >
                      <User size={16} />
                      <span>Sign In</span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
