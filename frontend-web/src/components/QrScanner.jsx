import React, { useState } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import TraceabilityView from './TraceabilityView';

export default function QrScanner() {
  const [scannedBatch, setScannedBatch] = useState(null);
  const [error, setError] = useState(null);

  function handleScan(result) {
    if (!result?.text) return;
    try {
      const url = new URL(result.text);
      const segments = url.pathname.split('/').filter(Boolean);
      let batchId = null;
      const traceIdx = segments.indexOf('trace');
      if (traceIdx === 0 && segments.length >= 2) {
        // /trace/:batchId
        batchId = segments[1];
      } else if (traceIdx > 0) {
        // /api/herbs/:batchId/trace
        batchId = segments[traceIdx - 1];
      }
      if (batchId) {
        setScannedBatch(batchId);
        setError(null);
      } else {
        setError('Invalid QR format');
      }
    } catch {
      setError('Failed to parse QR code');
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>QR Scanner</h2>

      {!scannedBatch && (
        <div style={{ margin: '20px auto', width: '100%', maxWidth: '400px' }}>
          <BarcodeScannerComponent
            width={400}
            height={300}
            onUpdate={(err, result) => {
              if (result) handleScan(result);
            }}
          />
          <p style={{ marginTop: '10px', color: 'gray' }}>Point your camera at the QR code</p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}

      {scannedBatch && (
        <div style={{ marginTop: '20px' }}>
          <h3>Scanned Batch ID: {scannedBatch}</h3>
          <TraceabilityView batchId={scannedBatch} />
        </div>
      )}
    </div>
  );
}
