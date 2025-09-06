import React, { useState } from 'react';
import api from '../api';

export default function AddEventForm({ batchId, onEventAdded }) {
  const [actor, setActor] = useState('');
  const [data, setData] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post(`/api/herbs/${batchId}/process`, {
        actor,
        data,
      });
      setMessage('✅ Event added successfully');
      setActor('');
      setData('');
      if (onEventAdded) onEventAdded(res.data);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message;
      setMessage('❌ Error: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={formWrapper}>
      <h4 style={{ marginBottom: '10px' }}>Add Processing Event</h4>
      <form onSubmit={submit} style={formStyle}>
        <input
          placeholder="Actor (e.g. Farmer, Transporter, Retailer)"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          placeholder="Event details (e.g. Drying started)"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Adding...' : 'Add Event'}
        </button>
      </form>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

// --- Styles ---
const formWrapper = {
  background: '#fff',
  padding: '15px',
  marginTop: '20px',
  borderRadius: '6px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputStyle = {
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px',
};

const buttonStyle = {
  padding: '10px',
  background: '#2c3e50',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};
