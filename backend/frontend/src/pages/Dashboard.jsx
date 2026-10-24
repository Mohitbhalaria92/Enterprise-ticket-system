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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [domainFilter, setDomainFilter] = useState('ALL');

  // Theme State ('dark' or 'light')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStaff = user.role === 'ADMIN' || user.role === 'AGENT';

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const colors = {
    dark: {
      bg: '#111827',
      cardBg: '#1f2937',
      textMain: '#ffffff',
      textMuted: '#9ca3af',
      border: '#374151',
      inputBg: '#111827',
    },
    light: {
      bg: '#f3f4f6',
      cardBg: '#ffffff',
      textMain: '#111827',
      textMuted: '#6b7280',
      border: '#d1d5db',
      inputBg: '#ffffff',
    }
  };

  const currentTheme = colors[theme];

  const domainColors = {
    RND: '#7c3aed',
    IT_PLATFORMS: '#2563eb',
    SECURITY: '#dc2626',
    DATABASE: '#d97706',
    GENERAL: '#4b5563'
  };

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
        prevTickets.map((t) => (t.id === ticketId ? { ...t, status: updated.status || newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update ticket status', err);
      alert('Failed to update ticket status.');
    }
  };

  const handleDomainChange = async (ticketId, newDomain) => {
    try {
      const response = await API.patch(`/tickets/${ticketId}`, { domain: newDomain });
      const updated = response.data;

      setTickets((prevTickets) =>
        prevTickets.map((t) => (t.id === ticketId ? { ...t, domain: updated.domain || newDomain } : t))
      );
    } catch (err) {
      console.error('Failed to update ticket domain', err);
      alert('Failed to update ticket domain.');
    }
  };

  // Metrics Calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const criticalCount = tickets.filter(t => t.priority === 'CRITICAL').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  const filteredAndSortedTickets = [...tickets]
    .filter((ticket) => {
      if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
      if (domainFilter !== 'ALL' && (ticket.domain || 'GENERAL') !== domainFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const titleMatch = ticket.title && ticket.title.toLowerCase().includes(q);
        const descMatch = ticket.description && ticket.description.toLowerCase().includes(q);
        return titleMatch || descMatch;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'oldest') return a.id - b.id;
      if (sortBy === 'priority') {
        const weightA = priorityWeight[a.priority?.toUpperCase()] || 0;
        const weightB = priorityWeight[b.priority?.toUpperCase()] || 0;
        return weightB - weightA;
      }
      return 0;
    });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', backgroundColor: currentTheme.bg, color: currentTheme.textMain, minHeight: '100vh' }}>Loading dashboard...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentTheme.bg, color: currentTheme.textMain, padding: '24px', boxSizing: 'border-box', transition: 'background-color 0.3s' }}>
      
      {/* Top Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: currentTheme.textMain }}>Enterprise Ticket Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: currentTheme.textMuted }}>
            Logged in as: <span style={{ color: currentTheme.textMain, fontWeight: '500' }}>{user.email || 'User'}</span> 
            <span style={{ 
              marginLeft: '8px', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', 
              backgroundColor: user.role === 'ADMIN' ? '#b91c1c' : user.role === 'AGENT' ? '#d97706' : '#1e40af', color: '#ffffff' 
            }}>
              {user.role || 'USER'}
            </span>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={toggleTheme}
            style={{ backgroundColor: currentTheme.cardBg, color: currentTheme.textMain, border: `1px solid ${currentTheme.border}`, padding: '8px 14px', borderRadius: '4px', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
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

      {/* Analytics Metrics Banner */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: currentTheme.textMuted, fontWeight: '600' }}>TOTAL TICKETS</span>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: currentTheme.textMain }}>{totalCount}</h3>
        </div>
        <div style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>OPEN TICKETS</span>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#3b82f6' }}>{openCount}</h3>
        </div>
        <div style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>CRITICAL PRIORITY</span>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#ef4444' }}>{criticalCount}</h3>
        </div>
        <div style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>RESOLVED / CLOSED</span>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#10b981' }}>{resolvedCount}</h3>
        </div>
      </div>

      {error && <div style={{ maxWidth: '1200px', margin: '0 auto 24px auto', backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '4px' }}>{error}</div>}

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: currentTheme.cardBg, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '24px', border: `1px solid ${currentTheme.border}` }}>
        
        {/* Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px', backgroundColor: currentTheme.bg, padding: '16px', borderRadius: '6px', border: `1px solid ${currentTheme.border}` }}>
          
          <div style={{ flex: '1', minWidth: '220px' }}>
            <input 
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', backgroundColor: currentTheme.inputBg, border: `1px solid ${currentTheme.border}`, borderRadius: '4px', color: currentTheme.textMain, fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Domain Filter Dropdown */}
          <div>
            <select 
              value={domainFilter} 
              onChange={(e) => setDomainFilter(e.target.value)}
              style={{ padding: '8px 12px', backgroundColor: currentTheme.inputBg, border: `1px solid ${currentTheme.border}`, borderRadius: '4px', color: currentTheme.textMain, fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="ALL">All Domains</option>
              <option value="RND">R&D</option>
              <option value="IT_PLATFORMS">IT Platforms</option>
              <option value="SECURITY">Security</option>
              <option value="DATABASE">Database</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer',
                  backgroundColor: statusFilter === status ? '#2563eb' : currentTheme.cardBg,
                  color: statusFilter === status ? '#ffffff' : currentTheme.textMuted,
                  border: `1px solid ${statusFilter === status ? '#2563eb' : currentTheme.border}`
                }}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: currentTheme.textMuted }}>Sort:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '6px 12px', backgroundColor: currentTheme.inputBg, border: `1px solid ${currentTheme.border}`, borderRadius: '4px', color: currentTheme.textMain, fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="newest">Newest ID</option>
              <option value="oldest">Oldest ID</option>
              <option value="priority">Priority (High to Low)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: currentTheme.textMain }}>
            {isStaff ? 'All Organization Tickets (Staff View)' : 'My Support Tickets'} ({filteredAndSortedTickets.length})
          </h2>
        </div>

        {filteredAndSortedTickets.length === 0 ? (
          <p style={{ color: currentTheme.textMuted, padding: '20px 0', textAlign: 'center' }}>No tickets found matching your criteria.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: currentTheme.textMuted, textTransform: 'uppercase' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Title</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Domain</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: currentTheme.textMuted, textTransform: 'uppercase' }}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: `1px solid ${currentTheme.border}` }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: currentTheme.textMain }}>#{ticket.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>
                      <span 
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'none' }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {ticket.title}
                      </span>
                    </td>
                    
                    {/* Domain Column / Staff Editable Dropdown */}
                    <td style={{ padding: '16px', fontSize: '12px' }}>
                      {isStaff ? (
                        <select
                          value={ticket.domain || 'GENERAL'}
                          onChange={(e) => handleDomainChange(ticket.id, e.target.value)}
                          style={{
                            padding: '4px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '4px',
                            backgroundColor: domainColors[ticket.domain || 'GENERAL'] || '#4b5563', color: '#fff', border: '1px solid #374151', cursor: 'pointer'
                          }}
                        >
                          <option value="GENERAL">GENERAL</option>
                          <option value="RND">R&D</option>
                          <option value="IT_PLATFORMS">IT Platforms</option>
                          <option value="SECURITY">Security</option>
                          <option value="DATABASE">Database</option>
                        </select>
                      ) : (
                        <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: domainColors[ticket.domain || 'GENERAL'] || '#4b5563', color: '#fff', fontWeight: '600' }}>
                          {ticket.domain || 'GENERAL'}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px', fontSize: '14px', color: currentTheme.textMuted, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ticket.description || 'No description'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      {isStaff ? (
                        <select
                          value={ticket.status || 'OPEN'}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                          style={{
                            padding: '4px 8px', fontSize: '12px', fontWeight: '600', borderRadius: '4px',
                            backgroundColor: '#1e3a8a', color: '#93c5fd', border: '1px solid #3b82f6', cursor: 'pointer'
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
                    <td style={{ padding: '16px', fontSize: '14px', color: currentTheme.textMain }}>{ticket.priority}</td>
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