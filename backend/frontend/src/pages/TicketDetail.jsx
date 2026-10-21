import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStaff = user.role === 'ADMIN' || user.role === 'AGENT';

  const fetchTicketDetails = async () => {
    try {
      // Fetch ticket list or a single ticket endpoint if available. 
      // If you have a single ticket route, use API.get(`/tickets/${id}`)
      // Here we fetch all and find the match, or directly hit the endpoint:
      const res = await API.get('/tickets');
      const tickets = Array.isArray(res.data) ? res.data : res.data.tickets || [];
      const found = tickets.find((t) => t.id === parseInt(id));
      
      if (!found) {
        setError('Ticket not found or access denied.');
      } else {
        setTicket(found);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load ticket details.');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await API.get(`/tickets/${id}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    fetchComments();
  }, [id]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await API.post(`/tickets/${id}/comments`, { message: newMessage });
      setComments((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Failed to post comment.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await API.patch(`/tickets/${id}`, { status: newStatus });
      setTicket((prev) => ({ ...prev, status: res.data.status }));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update ticket status.');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>Loading ticket thread...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#fca5a5' }}>{error}</div>;
  if (!ticket) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: '#ffffff', padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Navigation & Header */}
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ backgroundColor: '#374151', color: '#ffffff', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' }}
        >
          &larr; Back to Dashboard
        </button>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>TICKET #{ticket.id}</span>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#ffffff' }}>{ticket.title}</h1>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', backgroundColor: '#374151', color: '#d1d5db' }}>
                Priority: {ticket.priority}
              </span>
              
              {isStaff ? (
                <select
                  value={ticket.status || 'OPEN'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
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
                <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '9999px', backgroundColor: '#1e3a8a', color: '#93c5fd' }}>
                  {ticket.status || 'OPEN'}
                </span>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #374151', paddingTop: '16px', color: '#d1d5db', fontSize: '15px', lineHeight: '1.6' }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
          </div>
        </div>

        {/* Discussion / Comments Section */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#e5e7eb' }}>Activity & Comments</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {comments.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>No comments yet. Start the conversation below.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={{ backgroundColor: '#111827', borderRadius: '6px', padding: '16px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#ffffff' }}>{comment.user_name || comment.user_email}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: comment.user_role === 'ADMIN' ? '#b91c1c' : comment.user_role === 'AGENT' ? '#d97706' : '#374151', color: '#ffffff' }}>
                        {comment.user_role || 'USER'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>{comment.message}</p>
                </div>
              ))
            )}
          </div>

          {/* New Comment Form */}
          <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              rows="3"
              placeholder="Type your reply or status update..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', borderRadius: '4px', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '14px' }}
              >
                Post Comment
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}