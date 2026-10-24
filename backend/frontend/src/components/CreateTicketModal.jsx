import React, { useState } from 'react';
import API from '../services/api';

export default function CreateTicketModal({ isOpen, onClose, onTicketCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  // If the parent dashboard controls rendering via isOpen and it's false, render nothing
  if (isOpen === false) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return alert('Title and description are required.');

    setLoading(true);
    try {
      const response = await API.post('/tickets', {
        title,
        description,
        priority,
        domain: domain || undefined // Auto-routes on backend if blank
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDomain('');
      
      if (onTicketCreated) onTicketCreated(response.data);
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to create ticket', err);
      alert('Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose} // 👈 Clicking the background backdrop now closes the modal
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000 
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Prevents clicks inside the modal from closing it
        style={{ 
          backgroundColor: '#1f2937', 
          color: '#ffffff', 
          padding: '24px', 
          borderRadius: '8px', 
          width: '450px', 
          maxWidth: '90%', 
          border: '1px solid #374151' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Create New Ticket</h2>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g., Docker container crash on staging server"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', border: '1px solid #374151', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#9ca3af' }}>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Provide detailed information..."
              rows="4"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', border: '1px solid #374151', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#9ca3af' }}>Priority</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', border: '1px solid #374151' }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#9ca3af' }}>Domain (Optional)</label>
              <select 
                value={domain} 
                onChange={e => setDomain(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#111827', color: '#fff', border: '1px solid #374151' }}
              >
                <option value="">Auto-Route (Smart)</option>
                <option value="RND">R&D</option>
                <option value="IT_PLATFORMS">IT Platforms</option>
                <option value="SECURITY">Security</option>
                <option value="DATABASE">Database</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '8px 14px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              {loading ? 'Creating...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}