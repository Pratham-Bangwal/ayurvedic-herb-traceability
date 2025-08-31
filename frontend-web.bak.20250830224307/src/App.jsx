import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

async function fetchHerbs() {
  const r = await fetch('/api/herbs');
  return r.json();
}

async function fetchTrace(batchId) {
  const r = await fetch(`/api/herbs/${batchId}/trace`);
  if (!r.ok) throw new Error('Trace not found');
  return r.json();
}

function Dashboard() {
  const [herbs, setHerbs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transfering, setTransfering] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  async function handleTransfer(e) {
    e.preventDefault();
    setTransfering(true);
    try {
      const r = await fetch(`/api/herbs/${selected}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwner })
      });
      if (!r.ok) throw new Error('Transfer failed');
      setTrace(await fetchTrace(selected));
      setNewOwner('');
    } catch (e) { setError(e.message); } finally { setTransfering(false); }
  }

  useEffect(() => { refresh(); }, []);
  async function refresh() { setHerbs(await fetchHerbs()); }

  async function select(batchId) {
    setSelected(batchId); setError(null); setTrace(null);
    try { setTrace(await fetchTrace(batchId)); } catch (e) { setError(e.message); }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    setUploading(true);
    try {
      const r = await fetch('/api/herbs/upload', { method: 'POST', body: fd });
      if (!r.ok) throw new Error('Upload failed');
      await refresh();
      form.reset();
    } catch (e) { setError(e.message); } finally { setUploading(false); }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h1>Herb Traceability Dashboard</h1>
      <section style={{ display: 'flex', gap: 40 }}>
        <div style={{ flex: 1 }}>
          <h2>Upload Batch</h2>
            <form onSubmit={handleUpload}>
              <input name="name" placeholder="Herb Name" required /> <br />
              <input name="batchId" placeholder="Batch ID" required /> <br />
              <input name="lat" placeholder="Latitude" /> <br />
              <input name="lng" placeholder="Longitude" /> <br />
              <input name="photo" type="file" accept="image/*" /> <br />
              <button disabled={uploading}>{uploading ? 'Uploading...' : 'Submit'}</button>
            </form>
          <h2 style={{ marginTop: 30 }}>Batches</h2>
          <ul>
            {herbs.map(h => <li key={h._id}><button onClick={() => select(h.batchId)}>{h.batchId} - {h.name}</button></li>)}
          </ul>
        </div>
        <div style={{ flex: 2 }}>
          <h2>Trace</h2>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {!trace && !error && selected && <div>Loading trace...</div>}
          {trace && (
            <div>
              <p><strong>Batch:</strong> {trace.batchId}</p>
              <p><strong>Name:</strong> {trace.name}</p>
              <p><strong>Harvested:</strong> {trace.harvestedAt || 'N/A'}</p>
              <p><strong>Geo:</strong> {trace.geoLocation ? JSON.stringify(trace.geoLocation.coordinates) : 'N/A'}</p>
              {trace.geoLocation && (
                <div style={{ height: 200, marginBottom: 16 }}>
                  <MapContainer style={{ height: '100%' }} center={[trace.geoLocation.coordinates[1], trace.geoLocation.coordinates[0]]} zoom={8} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[trace.geoLocation.coordinates[1], trace.geoLocation.coordinates[0]]}>
                      <Popup>{trace.batchId}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
              <p><strong>Processing Events:</strong></p>
              <ul>
                {(trace.processingEvents||[]).map((ev,i)=><li key={i}>{ev.stage} @ {ev.at}</li>)}
              </ul>
              <p><strong>Chain TX:</strong> {trace.chain?.txHash}</p>
              <div>
                <h3>QR Code</h3>
                <img alt="QR" src={`/api/herbs/${trace.batchId}/qrcode`} style={{ background:'#fff', padding:8 }} />
              </div>
              <div style={{ marginTop: 20 }}>
                <h3>Transfer Ownership</h3>
                <form onSubmit={handleTransfer}>
                  <input value={newOwner} onChange={e=>setNewOwner(e.target.value)} placeholder="New Owner Address" required />
                  <button disabled={transfering}>{transfering ? 'Transferring...' : 'Transfer'}</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PublicTrace() {
  const params = new URLSearchParams(window.location.search);
  const batchId = params.get('batchId');
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!batchId) return;
    fetch(`/api/trace/${batchId}`).then(r => r.ok ? r.json(): Promise.reject('not found'))
      .then(setTrace).catch(e => setError(e.toString()));
  }, [batchId]);
  if (!batchId) return <div style={{ padding:20 }}>Missing batchId param</div>;
  return <div style={{ padding:20, fontFamily:'sans-serif' }}>
    <h1>Herb Traceability</h1>
    {error && <div style={{ color:'red' }}>{error}</div>}
    {!trace && !error && <div>Loading...</div>}
    {trace && <div>
      <p><strong>Batch:</strong> {trace.batchId}</p>
      <p><strong>Name:</strong> {trace.name}</p>
      <p><strong>Events:</strong> {(trace.processingEvents||[]).length}</p>
      <p><strong>Chain TX:</strong> {trace.chain?.txHash}</p>
    </div>}
  </div>;
}

export default function App() {
  if (window.location.pathname === '/public/trace') return <PublicTrace />;
  return <Dashboard />;
}
