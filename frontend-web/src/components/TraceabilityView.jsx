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
    load();
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

  if (loading) {
    return (
      <div className="form-section" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h3 style={{ color: '#2c5530' }}>Loading traceability data...</h3>
        <p style={{ color: '#666' }}>Fetching complete herb journey details</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="message error fade-in">
        <span style={{ fontSize: '20px', marginRight: '10px' }}>❌</span>
        Failed to load trace data: {error}
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="message error fade-in">
        <span style={{ fontSize: '20px', marginRight: '10px' }}>🚫</span>
        No trace data found for batch {batchId}
      </div>
    );
  }

  const [lng, lat] = trace.geo?.coordinates || [];

  const getActorColorClass = (actor) => {
    const actorLower = actor.toLowerCase();
    if (actorLower.includes('farmer')) return 'actor-farmer';
    if (actorLower.includes('processor')) return 'actor-processor';
    if (actorLower.includes('distributor')) return 'actor-distributor';
    if (actorLower.includes('retailer')) return 'actor-retailer';
    return 'actor-default';
  };

  return (
    <div className="fade-in">
      {/* Basic Info Section */}
      <div className="form-section">
        <h2 className="form-title">
          <span className="herb-icon">📋</span>
          Batch Information
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
          }}
        >
          <div className="info-card">
            <div className="info-label">Batch ID</div>
            <div className="info-value">{trace.batchId}</div>
          </div>

          <div className="info-card">
            <div className="info-label">Herb Name</div>
            <div className="info-value">{trace.herbName || trace.name || 'N/A'}</div>
          </div>

          <div className="info-card">
            <div className="info-label">Farmer</div>
            <div className="info-value">{trace.farmerName}</div>
          </div>

          <div className="info-card">
            <div className="info-label">Farm Location</div>
            <div className="info-value">{trace.farmLocation || 'N/A'}</div>
          </div>

          <div className="info-card">
            <div className="info-label">Planting Date</div>
            <div className="info-value">
              {trace.plantingDate ? new Date(trace.plantingDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Harvest Date</div>
            <div className="info-value">
              {trace.harvestDate ? new Date(trace.harvestDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Quantity</div>
            <div className="info-value">
              {trace.quantity ? `${trace.quantity} ${trace.unit || 'units'}` : 'N/A'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Organic Status</div>
            <div className="info-value">
              {trace.organicCertified ? (
                <span style={{ color: '#5cb85c' }}>🌱 Certified Organic</span>
              ) : (
                <span style={{ color: '#666' }}>📝 Conventional</span>
              )}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Created</div>
            <div className="info-value">
              {trace.createdAt ? new Date(trace.createdAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {trace.notes && (
          <div style={{ marginTop: '20px' }}>
            <div className="info-card">
              <div className="info-label">📝 Additional Notes</div>
              <div
                className="info-value"
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5',
                  color: '#555',
                }}
              >
                {trace.notes}
              </div>
            </div>
          </div>
        )}

        {lat && lng && (
          <div style={{ marginTop: '20px' }}>
            <div className="info-card" style={{ textAlign: 'center' }}>
              <div className="info-label">📍 Farm Location</div>
              <div className="info-value" style={{ marginBottom: '15px' }}>
                Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
              </div>
              <img
                alt="Farm Location Map"
                src={`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&size=450,300&l=map&pt=${lng},${lat},pm2rdm`}
                style={{
                  maxWidth: '100%',
                  borderRadius: '10px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                }}
              />
            </div>
          </div>
        )}

        {trace.photoIpfsCid && (
          <div style={{ marginTop: '20px' }}>
            <div className="info-card" style={{ textAlign: 'center' }}>
              <div className="info-label">📸 Herb Photo</div>
              <img
                alt="Herb"
                src={`https://ipfs.io/ipfs/${trace.photoIpfsCid}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '10px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                  marginTop: '15px',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Processing Events Section */}
      <div className="form-section">
        <h2 className="form-title">
          <span className="herb-icon">⚙️</span>
          Processing History
        </h2>

        {trace.processingEvents && trace.processingEvents.length > 0 ? (
          <ul className="timeline">
            {trace.processingEvents.map((ev, i) => (
              <li key={i} className="timeline-item">
                <span className={`timeline-dot ${getActorColorClass(ev.actor)}`} />
                <div className="timeline-content">
                  <div className="timeline-actor">{ev.actor}</div>
                  <div className="timeline-data">{ev.data}</div>
                  <div className="timeline-time">
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
            <p>No processing events recorded yet</p>
          </div>
        )}
      </div>

      {/* Ownership Transfers Section */}
      <div className="form-section">
        <h2 className="form-title">
          <span className="herb-icon">🔄</span>
          Ownership History
        </h2>

        {trace.ownershipTransfers && trace.ownershipTransfers.length > 0 ? (
          <ul className="timeline">
            {trace.ownershipTransfers.map((transfer, i) => (
              <li key={i} className="timeline-item">
                <span className="timeline-dot actor-default" />
                <div className="timeline-content">
                  <div className="timeline-actor">Transferred to: {transfer.to}</div>
                  <div className="timeline-data">Ownership change recorded</div>
                  <div className="timeline-time">
                    {transfer.timestamp ? new Date(transfer.timestamp).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>👤</div>
            <p>No ownership transfers recorded</p>
          </div>
        )}
      </div>

      {/* Action Forms Section */}
      <div className="form-section">
        <h2 className="form-title">
          <span className="herb-icon">➕</span>
          Add New Event
        </h2>

        <form onSubmit={submitEvent}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Actor/Role</label>
              <input
                className="modern-input"
                placeholder="e.g., Processor, Distributor"
                value={eventForm.actor}
                onChange={(e) => setEventForm({ ...eventForm, actor: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Event Description</label>
              <input
                className="modern-input"
                placeholder="e.g., Dried and packaged"
                value={eventForm.data}
                onChange={(e) => setEventForm({ ...eventForm, data: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="modern-button" disabled={submitting}>
            {submitting ? (
              <>
                <span>⏳</span>
                Adding Event...
              </>
            ) : (
              <>
                <span>✅</span>
                Add Processing Event
              </>
            )}
          </button>
        </form>

        <div className="divider" style={{ margin: '20px 0' }}></div>

        <h3 className="form-title" style={{ fontSize: '1.2rem' }}>
          <span className="herb-icon">🔄</span>
          Transfer Ownership
        </h3>

        <form onSubmit={submitTransfer}>
          <div className="input-group">
            <label className="input-label">New Owner</label>
            <input
              className="modern-input"
              placeholder="Enter new owner name/ID"
              value={transferForm.newOwner}
              onChange={(e) => setTransferForm({ ...transferForm, newOwner: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="modern-button secondary" disabled={submitting}>
            {submitting ? (
              <>
                <span>⏳</span>
                Transferring...
              </>
            ) : (
              <>
                <span>🔄</span>
                Transfer Ownership
              </>
            )}
          </button>
        </form>

        {actionMsg && (
          <div
            className={`message ${actionMsg.includes('✅') ? 'success' : 'error'} fade-in`}
            style={{ marginTop: '20px' }}
          >
            {actionMsg}
          </div>
        )}
      </div>
    </div>
  );
}
