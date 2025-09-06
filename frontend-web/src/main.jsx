import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import QrScanner from './components/QrScanner';
import TraceabilityView from './components/TraceabilityView';
import './index.css';

function TraceabilityViewWrapper() {
  const { batchId } = useParams();
  return <TraceabilityView batchId={batchId} />;
}

import { useParams } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Manufacturer Dashboard */}
        <Route path="/" element={<App />} />

        {/* QR Scanner */}
        <Route path="/scan" element={<QrScanner />} />

        {/* Direct traceability view */}
        <Route path="/trace/:batchId" element={<TraceabilityViewWrapper />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
