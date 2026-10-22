import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStaff = user.role === 'ADMIN' || user.role === 'AGENT';

  const fetchTicketDetails = async () => {
    try {
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
    if (!newMessage.trim() && !selectedFile) return;

    try {
      let attachmentUrl = null;

      // Handle File Upload if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await API.post(`/tickets/${id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = uploadRes.data.filePath || uploadRes.data.url;
      }

      // Post Comment along with optional attachment URL
      const res = await API.post(`/tickets/${id}/comments`, { 
        message: newMessage,
        attachment_url: attachmentUrl 
      });

      setComments((prev) => [...prev, res.data]);
      setNewMessage('');
      setSelectedFile(null);
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

        {/* Discussion / Comments & Activity Section */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#e5e7eb' }}>Activity & Comments</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {comments.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>No comments yet. Start the conversation below.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id || Math.random()} style={{ backgroundColor: '#111827', borderRadius: '6px', padding: '16px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#ffffff' }}>{comment.user_name || comment.user_email || 'User'}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', backgroundColor: comment.user_role === 'ADMIN' ? '#b91c1c' : comment.user_role === 'AGENT' ? '#d97706' : '#374151', color: '#ffffff' }}>
                        {comment.user_role || 'USER'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Just now'}</span>
                  </div>
                  {comment.message && <p style={{ margin: 0, fontSize: '14px', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>{comment.message}</p>}
                  
                  {/* Display File Attachment Link if present */}
                  {comment.attachment_url && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #1f2937' }}>
                      <a 
                        href={`http://localhost:5000/${comment.attachment_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: '#60a5fa', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        📎 View Attachment
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* New Comment & File Attachment Form */}
          <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              rows="3"
              placeholder="Type your reply or status update..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files[0])}
                style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer' }}
              />
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