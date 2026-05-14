import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { User, Mail, LogOut, Settings, Phone, MapPin, Edit2, Save, X } from 'lucide-react';
import { db } from '../firebase.config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const { family, updateFamily } = useSettings();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const profileRef = doc(db, 'users', user.uid, 'config', 'profile');
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setFormData(prev => ({ ...prev, ...profileSnap.data() }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      // 1. Update Firebase Auth display name
      await updateUser({ displayName: formData.name });

      // 2. Update Firestore profile doc
      const profileRef = doc(db, 'users', user.uid, 'config', 'profile');
      await setDoc(profileRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      });

      // 3. Sync name into the family members list so the dropdown shows the new name
      if (family && family.members) {
        const updatedMembers = family.members.map(m =>
          m.uid === user.uid ? { ...m, name: formData.name } : m
        );
        if (JSON.stringify(updatedMembers) !== JSON.stringify(family.members)) {
          await updateFamily({ ...family, members: updatedMembers });
        }
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  if (!user) return null;

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    marginTop: '4px'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>My Profile</h1>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-color)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setIsEditing(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} /> Cancel
            </button>
            <button 
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', background: '#03fc5f', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        )}
      </div>
      
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
              {formData.name ? formData.name[0].toUpperCase() : <User size={40} />}
            </div>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} />
                </div>
              ) : (
                <>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{formData.name || 'Set Name'}</h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{formData.bio || 'Portfolio Investor'}</p>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isEditing && (
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bio / Role</label>
                <input type="text" name="bio" value={formData.bio} onChange={handleChange} style={inputStyle} placeholder="e.g. Portfolio Investor" />
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={18} color="var(--text-muted)" />
              <span>{user.email}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={18} color="var(--text-muted)" />
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="Add phone number" />
                </div>
              ) : (
                <span>{formData.phone || 'No phone number added'}</span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={18} color="var(--text-muted)" />
              {isEditing ? (
                <div style={{ flex: 1 }}>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} style={inputStyle} placeholder="Add address" />
                </div>
              ) : (
                <span>{formData.address || 'No address added'}</span>
              )}
            </div>
          </div>

          {!isEditing && (
            <button 
              onClick={handleLogout}
              style={{ 
                marginTop: '16px', 
                padding: '12px', 
                borderRadius: '8px', 
                background: '#0c0c0c', 
                color: '#ff4444', 
                border: '1px solid rgba(255, 68, 68, 0.1)', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

