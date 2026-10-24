import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const theme = localStorage.getItem('theme') || 'dark';

  const colors = {
    dark: { bg: '#111827', cardBg: '#1f2937', textMain: '#ffffff', textMuted: '#9ca3af', border: '#374151' },
    light: { bg: '#f3f4f6', cardBg: '#ffffff', textMain: '#111827', textMuted: '#6b7280', border: '#d1d5db' }
  };
  const currentTheme = colors[theme];

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : res.data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
      setError(`DEBUG ERROR: Status ${err.response?.status || 'Unknown'} | Message: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Restrict access if not admin
    if (currentUser.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.patch(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showNotification(`Successfully updated user role to ${newRole}`);
    } catch (err) {
      console.error('Failed to update role', err);
      alert('Failed to update user role.');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', backgroundColor: currentTheme.bg, color: currentTheme.textMain, minHeight: '100vh' }}>Loading user management...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentTheme.bg, color: currentTheme.textMain, padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Notification Toast */}
        {notification && (
          <div style={{ backgroundColor: '#065f46', color: '#6ee7b7', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', border: '1px solid #10b981' }}>
            ✨ {notification}
          </div>
        )}

        {/* Header & Back Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Admin User Management</h1>
            <p style={{ color: currentTheme.textMuted, fontSize: '14px', margin: '4px 0 0 0' }}>Manage system accounts, permissions, and roles.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ backgroundColor: currentTheme.cardBg, color: currentTheme.textMain, padding: '8px 14px', borderRadius: '4px', border: `1px solid ${currentTheme.border}`, cursor: 'pointer', fontWeight: '500' }}
          >
            &larr; Back to Dashboard
          </button>
        </div>

        {error && <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}

        {/* Users Table Card */}
        <div style={{ backgroundColor: currentTheme.cardBg, borderRadius: '8px', padding: '24px', border: `1px solid ${currentTheme.border}`, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Registered Accounts ({users.length})</h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: currentTheme.textMuted, textTransform: 'uppercase' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Current Role</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Actions / Permissions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                    <td style={{ padding: '16px', fontSize: '14px' }}>#{u.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{u.email}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <span style={{ 
                        padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px',
                        backgroundColor: u.role === 'ADMIN' ? '#b91c1c' : u.role === 'AGENT' ? '#d97706' : '#1e40af', color: '#ffffff' 
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{
                          padding: '6px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '4px',
                          backgroundColor: currentTheme.bg, color: currentTheme.textMain, border: `1px solid ${currentTheme.border}`, cursor: 'pointer'
                        }}
                      >
                        <option value="USER">USER</option>
                        <option value="AGENT">AGENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}