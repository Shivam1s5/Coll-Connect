import React, { useState, useEffect } from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/support`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveTicket = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/support/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="manage-users-container">
      <h2>Support Tickets</h2>
      {loading ? <p style={{color: '#9ca3af'}}>Loading tickets...</p> : tickets.length === 0 ? (
        <p style={{color: '#9ca3af'}}>No support tickets found.</p>
      ) : (
        <div className="ticket-list">
          {tickets.map(ticket => (
            <div key={ticket._id} className={`ticket-card ${ticket.status === 'resolved' ? 'resolved' : ''}`}>
              <div className="ticket-header">
                <div>
                  <span className="ticket-subject">{ticket.subject}</span>
                  <span className={`badge ${ticket.status === 'resolved' ? 'badge-user' : 'badge-admin'}`}>
                    {ticket.status.toUpperCase()}
                  </span>
                </div>
                <div className="ticket-date">{new Date(ticket.createdAt).toLocaleString()}</div>
              </div>
              <div className="ticket-meta">
                From: <strong>{ticket.username}</strong> ({ticket.email})
              </div>
              <div className="ticket-body">
                <p>{ticket.message}</p>
                {ticket.imageUrl && (
                  <div className="ticket-image">
                    <a href={ticket.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img src={ticket.imageUrl} alt="Attachment" style={{maxWidth: '200px', borderRadius: '8px', marginTop: '10px'}} />
                    </a>
                  </div>
                )}
              </div>
              {ticket.status !== 'resolved' && (
                <div className="ticket-actions mt-2">
                  <button className="btn-action btn-blue" onClick={() => resolveTicket(ticket._id)}>Mark as Resolved</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
