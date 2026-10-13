import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import CreateTicketModal from '../components/CreateTicketModal';

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'priority'
  const navigate = useNavigate();

  // Fetch all tickets on load
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

  // Safely handle newly created ticket data and refresh list
  const handleTicketCreated = (newTicketData) => {
    const ticket = newTicketData.ticket || newTicketData.data || newTicketData;
    if (ticket && ticket.id && ticket.title) {
      setTickets((prevTickets) => [ticket, ...prevTickets]);
    } else {
      fetchTickets();
    }
  };

  // Priority weight mapping for sorting
  const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  // Compute sorted tickets based on selected option
  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.id - a.id;
    } else if (sortBy === 'oldest') {
      return a.id - b.id;
    } else if (sortBy === 'priority') {
      const weightA = priorityWeight[a.priority?.toUpperCase()] || 0;
      const weightB = priorityWeight[b.priority?.toUpperCase()] || 0;
      return weightB - weightA; // High priority first
    }
    return 0;
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>Loading dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: '#ffffff', padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Enterprise Ticket Dashboard</h1>
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
        
        {/* Header and Sorting Controls Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#e5e7eb' }}>All Support Tickets</h2>
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
                      <span style={{ padding: '2px 8px', fontSize: '12px', fontWeight: '600', borderRadius: '9999px', backgroundColor: '#1e3a8a', color: '#93c5fd' }}>
                        {ticket.status || 'OPEN'}
                      </span>
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