import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function TraceabilityView({ batchId }) {
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventForm, setEventForm] = useState({ actor: '', data: '' });
  const [transferForm, setTransferForm] = useState({ newOwner: '' });
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  async function load() {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await axios.get(`${baseUrl}/api/herbs/${batchId}/trace`);
      const payload = res.data?.data || res.data;
      setTrace(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  async function submitEvent(e) {
    e.preventDefault();
    setSubmitting(true);
    setActionMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await axios.post(`${baseUrl}/api/herbs/${batchId}/process`, eventForm);
      setEventForm({ actor: '', data: '' });
      setActionMsg('✅ Event added');
      await load();
    } catch (err) {
      setActionMsg('❌ ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitTransfer(e) {
    e.preventDefault();
    setSubmitting(true);
    setActionMsg('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await axios.post(`${baseUrl}/api/herbs/${batchId}/transfer`, transferForm);
      setTransferForm({ newOwner: '' });
      setActionMsg('✅ Ownership transferred');
      await load();
    } catch (err) {
      setActionMsg('❌ ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading trace...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!trace) return <p>No trace data found.</p>;

  const [lng, lat] = trace.geo?.coordinates || [];

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'Arial' }}>
      <h2>Herb Batch Trace</h2>

      <div style={cardStyle}>
        <b>Batch ID:</b> {trace.batchId}
      </div>
      <div style={cardStyle}>
        <b>Farmer:</b> {trace.farmerName}
      </div>
      <div style={cardStyle}>
        <b>Created At:</b> {new Date(trace.createdAt).toLocaleString()}
      </div>

      <div style={cardStyle}>
        <b>Geo Location:</b>
        {lat && lng ? (
          <img
            alt="Map"
            src={`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&size=450,300&l=map&pt=${lng},${lat},pm2rdm`}
            style={{ display: 'block', marginTop: '10px', borderRadius: '6px' }}
          />
        ) : (
          <p>No location available</p>
        )}
      </div>

      {trace.photoIpfsCid && (
        <div style={cardStyle}>
          <b>Photo:</b>
          <img
            alt="Herb"
            src={`https://ipfs.io/ipfs/${trace.photoIpfsCid}`}
            style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '6px' }}
          />
        </div>
      )}

      <div style={cardStyle}>
        <b>Processing Events:</b>
        {trace.processingEvents.length > 0 ? (
          <ul style={timelineStyle}>
            {trace.processingEvents.map((ev, i) => (
              <li key={i} style={timelineItemStyle}>
                <span
                  style={{
                    ...dotStyle,
                    backgroundColor: getActorColor(ev.actor),
                  }}
                />
                <b>{ev.actor}</b>: {ev.data || '—'}{' '}
                <i>({new Date(ev.timestamp).toLocaleString()})</i>
                {ev.chain && (
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                    tx: {truncate(ev.chain.txHash)} • blk: {ev.chain.blockNumber || '—'} • {ev.chain.action || 'EVENT'}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events recorded yet.</p>
        )}
        <form
          onSubmit={submitEvent}
          style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}
        >
          <input
            placeholder="Actor (e.g., Manufacturer)"
            value={eventForm.actor}
            required
            onChange={(e) => setEventForm({ ...eventForm, actor: e.target.value })}
            style={inputSm}
          />
          <input
            placeholder="Description"
            value={eventForm.data}
            onChange={(e) => setEventForm({ ...eventForm, data: e.target.value })}
            style={inputLg}
          />
          <button disabled={submitting} style={btnSm}>
            {submitting ? '...' : 'Add'}
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <b>Ownership Transfers:</b>
        {trace.ownershipTransfers && trace.ownershipTransfers.length > 0 ? (
          <ul style={timelineStyle}>
            {trace.ownershipTransfers.map((tr, i) => (
              <li key={i} style={timelineItemStyle}>
                <span
                  style={{
                    ...dotStyle,
                    backgroundColor: '#f39c12', // orange for transfers
                  }}
                />
                <b>New Owner:</b> {tr.to} <i>({new Date(tr.timestamp).toLocaleString()})</i>
                {tr.by && <span style={{ marginLeft: '6px', fontSize: '12px' }}>by {tr.by}</span>}
                {tr.chain && (
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                    tx: {truncate(tr.chain.txHash)} • blk: {tr.chain.blockNumber || '—'} • {tr.chain.action || 'TRANSFER'}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No ownership transfers yet.</p>
        )}
        <form
          onSubmit={submitTransfer}
          style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}
        >
          <input
            placeholder="New Owner Address / ID"
            value={transferForm.newOwner}
            required
            onChange={(e) => setTransferForm({ ...transferForm, newOwner: e.target.value })}
            style={inputLg}
          />
          <button disabled={submitting} style={btnSm}>
            {submitting ? '...' : 'Transfer'}
          </button>
        </form>
      </div>
      {actionMsg && <p style={{ marginTop: '10px' }}>{actionMsg}</p>}
    </div>
  );
}

// --- Styling ---
const cardStyle = {
  background: '#f9f9f9',
  padding: '15px',
  margin: '10px 0',
  borderRadius: '6px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
};

const timelineStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '10px 0',
  position: 'relative',
};

const timelineItemStyle = {
  position: 'relative',
  marginBottom: '20px',
  paddingLeft: '20px',
  borderLeft: '3px solid #2c3e50',
};

const dotStyle = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  position: 'absolute',
  left: '-7px',
  top: '5px',
};

// --- Color coding by actor ---
function getActorColor(actor = '') {
  actor = actor.toLowerCase();
  if (actor.includes('farmer')) return '#27ae60'; // Green
  if (actor.includes('transporter')) return '#2980b9'; // Blue
  if (actor.includes('retailer')) return '#e67e22'; // Orange
  if (actor.includes('manufacturer')) return '#8e44ad'; // Purple
  return '#2c3e50'; // Default dark grey
}

function truncate(v = '', size = 10) {
  if (!v) return '';
  return v.length > size ? v.slice(0, size) + '…' : v;
}

// Small form styles
const inputSm = {
  padding: '6px',
  flex: '1 1 140px',
  border: '1px solid #ccc',
  borderRadius: '4px',
};
const inputLg = {
  padding: '6px',
  flex: '2 1 220px',
  border: '1px solid #ccc',
  borderRadius: '4px',
};
const btnSm = {
  padding: '6px 12px',
  background: '#2c3e50',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};
