import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import App from './App';
import QrScanner from './components/QrScanner';
import TraceabilityView from './components/TraceabilityView';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Suppress React Router deprecation warnings in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('React Router Future Flag Warning')) {
      return; // Suppress these specific warnings
    }
    originalWarn.apply(console, args);
  };
}

function TraceabilityViewWrapper() {
  const { batchId } = useParams();
  return <TraceabilityView batchId={batchId} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
          v7_fetcherPersist: true,
          v7_normalizeFormMethod: true,
          v7_partialHydration: true,
          v7_skipActionStatusRevalidation: true
        }}
      >
        <Routes>
          {/* Manufacturer Dashboard */}
          <Route path="/" element={<App />} />

          {/* QR Scanner */}
          <Route path="/scan" element={
            <ErrorBoundary>
              <QrScanner />
            </ErrorBoundary>
          } />

          {/* Direct traceability view */}
          <Route path="/trace/:batchId" element={<TraceabilityViewWrapper />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
