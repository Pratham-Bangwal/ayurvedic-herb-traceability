import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import TraceabilityView from './components/TraceabilityView';

export default function App() {
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    batchId: '',
    farmerName: '',
    lat: '',
    lng: '',
  });
  const [currentBatch, setCurrentBatch] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  const navigate = useNavigate();

  async function create(e) {
    e.preventDefault();
    try {
      const res = await api.post('/api/herbs', {
        batchId: form.batchId,
        name: form.farmerName, // map to model's name field
        farmerName: form.farmerName,
        lat: form.lat,
        lng: form.lng,
      });
      setMessage(`✅ Created batch ${form.batchId}`);
      setCurrentBatch(form.batchId);
      setQrCode(res.data?.qr || null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message;
      setMessage('❌ Error: ' + msg);
      setQrCode(null);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Manufacturer Dashboard - Demo</h2>

      {/* Batch creation form */}
      <form onSubmit={create} style={formStyle}>
        <input
          placeholder="Batch ID"
          value={form.batchId}
          onChange={(e) => setForm({ ...form, batchId: e.target.value })}
          required
          style={inputStyle}
        />
        <input
          placeholder="Farmer name"
          value={form.farmerName}
          onChange={(e) => setForm({ ...form, farmerName: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Latitude"
          value={form.lat}
          onChange={(e) => setForm({ ...form, lat: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Longitude"
          value={form.lng}
          onChange={(e) => setForm({ ...form, lng: e.target.value })}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Create
        </button>
      </form>

      <div style={{ marginTop: 20 }}>{message}</div>

      {/* QR code display */}
      {qrCode && (
        <div style={{ marginTop: 20 }}>
          <h3>QR Code for Batch</h3>
          <img
            src={qrCode}
            alt="QR Code"
            style={{ border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <p style={{ marginTop: 10 }}>Scan this QR to view the traceability details.</p>
        </div>
      )}

      {/* Direct navigation to QR Scanner */}
      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => navigate('/scan')}
          style={{
            ...buttonStyle,
            background: '#27ae60',
          }}
        >
          📷 Open QR Scanner
        </button>
      </div>

      {/* Traceability view */}
      {currentBatch && (
        <div style={{ marginTop: 40 }}>
          <h3>Traceability for {currentBatch}</h3>
          <TraceabilityView batchId={currentBatch} />
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxWidth: '300px',
};

const inputStyle = {
  padding: '8px',
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
