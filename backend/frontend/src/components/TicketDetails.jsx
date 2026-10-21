import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TicketDetails({ ticket, onClose, onUpdate }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log("TicketDetails mounted for ticket:", ticket);
        if (ticket?.id) {
            fetchComments();
        }
    }, [ticket]);

    const fetchComments = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/tickets/${ticket.id}/comments`, {
                withCredentials: true
            });
            setComments(res.data);
        } catch (err) {
            console.error("Failed to load comments:", err);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            await axios.post(
                `http://localhost:5000/api/tickets/${ticket.id}/comments`,
                { message: newComment },
                { withCredentials: true }
            );
            setNewComment('');
            await fetchComments();
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to post comment:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!ticket) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 text-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-700 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
                    <div>
                        <h2 className="text-xl font-bold text-blue-400">#{ticket.id}: {ticket.title}</h2>
                        <span className="text-xs text-slate-400">Created by User #{ticket.user_id}</span>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-white font-bold text-xl px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Details */}
                <div className="mb-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <p className="text-slate-200 text-sm mb-3">{ticket.description}</p>
                    <div className="flex gap-4 text-xs">
                        <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                            Priority: <strong className="text-yellow-400">{ticket.priority || 'Medium'}</strong>
                        </span>
                        <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                            Status: <strong className="text-blue-400">{ticket.status}</strong>
                        </span>
                    </div>
                </div>

                {/* Comment List */}
                <div className="flex-1 overflow-y-auto my-2 space-y-3 pr-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Activity & Discussion</h3>
                    {comments.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No comments yet. Start the conversation below.</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700/60">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-blue-400 font-semibold">{c.user_email || c.user_name}</span>
                                    <span className="text-[10px] text-slate-500">
                                        {new Date(c.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-200">{c.message}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-slate-700 mt-2">
                    <input 
                        type="text" 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type a comment..." 
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                        {loading ? 'Posting...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
}