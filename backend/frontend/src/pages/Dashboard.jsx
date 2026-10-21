import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import CreateTicketModal from '../components/CreateTicketModal';

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  // Retrieve stored user details and role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStaff = user.role === 'ADMIN' || user.role === 'AGENT';

  const fetchTickets = async () => {
    try {
      const response = await API.get('/tickets');
      const ticketData = Array.isArray(response.data) 
        ? response.data 
        : response.data.tickets || response.data.data || [];
      setTickets(ticketData);
    } catch (err) {
      setError('Failed to load tickets. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleTicketCreated = (newTicketData) => {
    const ticket = newTicketData.ticket || newTicketData.data || newTicketData;
    if (ticket && ticket.id && ticket.title) {
      setTickets((prevTickets) => [ticket, ...prevTickets]);
    } else {
      fetchTickets();
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const response = await API.patch(`/tickets/${ticketId}`, { status: newStatus });
      const updated = response.data;
      
      setTickets((prevTickets) =>
        prevTickets.map((t) => (t.id === ticketId ? { ...t, status: updated.status } : t))
      );
    } catch (err) {
      console.error('Failed to update ticket status', err);
      alert('Failed to update ticket status.');
    }
  };

  const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.id - a.id;
    } else if (sortBy === 'oldest') {
      return a.id - b.id;
    } else if (sortBy === 'priority') {
      const weightA = priorityWeight[a.priority?.toUpperCase()] || 0;
      const weightB = priorityWeight[b.priority?.toUpperCase()] || 0;
      return weightB - weightA;
    }
    return 0;
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>Loading dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: '#ffffff', padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Enterprise Ticket Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
            Logged in as: <span style={{ color: '#ffffff', fontWeight: '500' }}>{user.email || 'User'}</span> 
            <span style={{ 
              marginLeft: '8px', 
              padding: '2px 8px', 
              fontSize: '10px', 
              fontWeight: 'bold', 
              borderRadius: '4px', 
              backgroundColor: user.role === 'ADMIN' ? '#b91c1c' : user.role === 'AGENT' ? '#d97706' : '#1e40af', 
              color: '#ffffff' 
            }}>
              {user.role || 'USER'}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', borderRadius: '4px', border: 'none', fontWeight: '500', cursor: 'pointer' }}
          >
            + New Ticket
          </button>
          <button 
            onClick={handleLogout}
            style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '8px 16px', borderRadius: '4px', border: 'none', fontWeight: '500', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <div style={{ maxWidth: '1200px', margin: '0 auto 24px auto', backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '4px' }}>{error}</div>}

      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#1f2937', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#e5e7eb' }}>
            {isStaff ? 'All Organization Tickets (Staff View)' : 'My Support Tickets'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '6px 12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#ffffff', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="newest">Newest ID</option>
              <option value="oldest">Oldest ID</option>
              <option value="priority">Priority (High to Low)</option>
            </select>
          </div>
        </div>

        {sortedTickets.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No tickets found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Title</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#d1d5db' }}>#{ticket.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>{ticket.title}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#9ca3af', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ticket.description || 'No description'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#d1d5db' }}>
                      {isStaff ? (
                        <select
                          value={ticket.status || 'OPEN'}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: '4px',
                            backgroundColor: '#1e3a8a',
                            color: '#93c5fd',
                            border: '1px solid #3b82f6',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      ) : (
                        <span style={{ padding: '2px 8px', fontSize: '12px', fontWeight: '600', borderRadius: '9999px', backgroundColor: '#1e3a8a', color: '#93c5fd' }}>
                          {ticket.status || 'OPEN'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#d1d5db' }}>{ticket.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTicketCreated={handleTicketCreated} 
      />
    </div>
  );
}