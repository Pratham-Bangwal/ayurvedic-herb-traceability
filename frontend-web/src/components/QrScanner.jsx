import React, { useState, useRef, useEffect } from 'react';
import { BrowserCodeReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import TraceabilityView from './TraceabilityView';

export default function QrScanner() {
  const [scannedBatch, setScannedBatch] = useState(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [componentError, setComponentError] = useState(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null); // Store manual stream for cleanup

  // Debug log to verify component is rendering
  console.log('QrScanner component rendering...', {
    scannedBatch,
    isScanning,
    isLoading,
    error,
    isMobile,
  });

  // Component error boundary
  if (componentError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '15px',
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>⚠️ Component Error</h2>
          <p style={{ marginBottom: '20px' }}>{componentError}</p>
          <button
            onClick={() => {
              setComponentError(null);
              window.location.reload();
            }}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let mounted = true;

    // Detect mobile device
    const checkMobile = () => {
      if (!mounted) return;
      const isMobileDevice =
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Initialize QR reader safely
    const initTimer = setTimeout(() => {
      if (!mounted) return;
      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
        codeReaderRef.current = new BrowserCodeReader(hints);
        console.log('QR code reader initialized successfully');
      } catch (initError) {
        console.error('QR reader initialization error:', initError);
        if (mounted) {
          setError('QR scanner initialization failed. Please refresh the page.');
        }
      }
    }, 200);

    // Ultra-safe cleanup that never calls any QR library methods
    return () => {
      mounted = false;
      clearTimeout(initTimer);

      try {
        window.removeEventListener('resize', checkMobile);
      } catch (e) {
        /* ignore */
      }

      // Only clear reference, never call methods
      codeReaderRef.current = null;
    };
  }, []);

  function handleScan(result) {
    if (!result) return;
    try {
      const url = new URL(result);
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
        stopScanning();
      } else {
        setError('Invalid QR format');
      }
    } catch {
      setError('Failed to parse QR code');
    }
  }

  const startScanning = async () => {
    try {
      setIsLoading(true);
      setIsScanning(false);
      setError(null);
      setPermissionDenied(false);

      // Reinitialize codeReader if it was cleared
      if (!codeReaderRef.current) {
        try {
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
          codeReaderRef.current = new BrowserCodeReader(hints);
          console.log('QR code reader reinitialized');
        } catch (initError) {
          console.error('Failed to reinitialize QR reader:', initError);
          setError('QR scanner initialization failed. Please refresh the page.');
          setIsLoading(false);
          return;
        }
      }

      // Request camera permission and test stream
      let testStream = null;
      try {
        testStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isMobile ? 'environment' : 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        console.log('Camera permission granted, stream obtained');

        // Test by temporarily connecting stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = testStream;
          console.log('Test stream connected to video element');
        }

        // Stop test stream
        testStream.getTracks().forEach((track) => track.stop());
      } catch (permError) {
        console.error('Camera permission error:', permError);
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access and try again.');
        setIsLoading(false);
        return;
      }

      setIsScanning(true);
      setIsLoading(false);

      // Start scanning with mobile-optimized settings
      try {
        // Ensure video element is ready
        if (!videoRef.current) {
          throw new Error('Video element not found');
        }

        console.log('Starting QR scanning with video element:', videoRef.current);

        await codeReaderRef.current.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result, error) => {
            if (result) {
              handleScan(result.getText());
              // Add haptic feedback on mobile
              if (isMobile && navigator.vibrate) {
                navigator.vibrate(200);
              }
            }
            if (error && !(error instanceof Error)) {
              console.log('Scan error:', error);
            }
          }
        );

        // Backup: If video doesn't show after QR library setup, manually set stream
        setTimeout(async () => {
          if (
            videoRef.current &&
            (!videoRef.current.srcObject || videoRef.current.videoWidth === 0)
          ) {
            console.log('Video not displaying, trying manual stream setup...');
            try {
              const fallbackStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: isMobile ? 'environment' : 'user',
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                },
              });

              videoRef.current.srcObject = fallbackStream;
              await videoRef.current.play();
              console.log('Manual video stream setup successful');

              // Store stream for cleanup
              streamRef.current = fallbackStream;
            } catch (fallbackError) {
              console.error('Fallback video setup failed:', fallbackError);
            }
          }
        }, 1000);

        // Ensure video is visible and playing
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.style.display = 'block';
            videoRef.current.play().catch((e) => console.log('Video play error:', e));
            console.log('Video element configured:', {
              src: videoRef.current.src,
              srcObject: videoRef.current.srcObject,
              videoWidth: videoRef.current.videoWidth,
              videoHeight: videoRef.current.videoHeight,
            });
          }
        }, 500);

        console.log('QR scanning started successfully');
      } catch (scanError) {
        console.error('Scanning start error:', scanError);
        setError('Failed to start scanning. Please try again.');
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(
        `Camera access failed: ${err.message}. Try refreshing the page or checking camera permissions.`
      );
      setIsScanning(false);
      setIsLoading(false);
    }
  };

  const stopScanning = () => {
    console.log('Stopping QR scanner safely...');
    setIsScanning(false);

    // Stop video stream if active
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        console.log('Video stream stopped');
      }
    } catch (error) {
      console.log('Error stopping video stream:', error);
    }

    // Stop manual stream if exists
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        console.log('Manual stream stopped');
      }
    } catch (error) {
      console.log('Error stopping manual stream:', error);
    }

    // Clear QR reader reference
    if (codeReaderRef.current) {
      console.log('QR scanner reference cleared');
    }
    // Note: We don't set to null here anymore to allow reuse
  };

  return (
    <div
      className="app-container"
      style={{
        minHeight: '100vh',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        className="main-card"
        style={{
          visibility: 'visible',
          display: 'block',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          className="header"
          style={{
            background: 'linear-gradient(135deg, #2c5530 0%, #5cb85c 100%)',
            padding: '30px',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h1>📷 QR Code Scanner</h1>
          <p>Scan QR codes to view herb traceability details</p>
        </div>

        <div
          className="content"
          style={{
            padding: '30px',
            backgroundColor: 'white',
            minHeight: '400px',
          }}
        >
          {!scannedBatch && (
            <div className="form-section fade-in">
              <h2 className="form-title">
                <span className="herb-icon">🔍</span>
                Camera Scanner
              </h2>

              <div style={{ textAlign: 'center' }}>
                <video
                  ref={videoRef}
                  width={isMobile ? Math.min(window.innerWidth - 60, 350) : 400}
                  height={isMobile ? Math.min((window.innerWidth - 60) * 0.75, 260) : 300}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    border: '3px solid #5cb85c',
                    borderRadius: '15px',
                    display: isScanning ? 'block' : 'none',
                    margin: '0 auto',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    maxWidth: '100%',
                    backgroundColor: '#000',
                    objectFit: 'cover',
                  }}
                />

                {!isScanning && !isLoading && (
                  <div
                    style={{
                      width: isMobile ? 'calc(100vw - 60px)' : '400px',
                      maxWidth: isMobile ? '350px' : '400px',
                      height: isMobile ? Math.min((window.innerWidth - 60) * 0.75, 260) : '300px',
                      border: '3px dashed #5cb85c',
                      borderRadius: '15px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8f9fa',
                      margin: '0 auto',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <div style={{ fontSize: isMobile ? '40px' : '48px', marginBottom: '20px' }}>
                      {isMobile ? '📱' : '📷'}
                    </div>
                    <button
                      onClick={startScanning}
                      className="modern-button"
                      style={{
                        fontSize: isMobile ? '16px' : '18px',
                        padding: isMobile ? '12px 24px' : '15px 30px',
                      }}
                    >
                      <span>📹</span>
                      {isMobile ? 'Start Scanner' : 'Start Camera'}
                    </button>

                    {isMobile && (
                      <p
                        style={{
                          marginTop: '15px',
                          fontSize: '14px',
                          color: '#666',
                          textAlign: 'center',
                          paddingX: '10px',
                        }}
                      >
                        💡 Hold your phone steady and point at QR code
                      </p>
                    )}
                  </div>
                )}

                {isLoading && (
                  <div
                    style={{
                      width: isMobile ? 'calc(100vw - 60px)' : '400px',
                      maxWidth: isMobile ? '350px' : '400px',
                      height: isMobile ? Math.min((window.innerWidth - 60) * 0.75, 260) : '300px',
                      border: '3px solid #5cb85c',
                      borderRadius: '15px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8f9fa',
                      margin: '0 auto',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '20px' }}>⏳</div>
                    <p style={{ color: '#666', fontSize: '16px' }}>
                      {permissionDenied ? 'Waiting for permission...' : 'Starting camera...'}
                    </p>
                  </div>
                )}

                {isScanning && (
                  <div style={{ marginTop: '20px' }}>
                    <button
                      onClick={stopScanning}
                      className="modern-button secondary"
                      style={{
                        fontSize: isMobile ? '16px' : '18px',
                        padding: isMobile ? '12px 24px' : '15px 30px',
                      }}
                    >
                      <span>⏹️</span>
                      Stop Scanning
                    </button>

                    {isMobile && (
                      <div
                        style={{
                          marginTop: '15px',
                          padding: '10px',
                          backgroundColor: '#e8f5e8',
                          borderRadius: '8px',
                          border: '1px solid #5cb85c',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#2c5530',
                            textAlign: 'center',
                          }}
                        >
                          🎯 Keep QR code within the camera frame
                          <br />
                          📱 The scanner will automatically detect the code
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <p
                  style={{
                    marginTop: '20px',
                    color: '#666',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                >
                  {isMobile
                    ? '� Position QR code in camera view'
                    : '�📷 Point your camera at the QR code to scan'}
                </p>

                {error && (
                  <div className="message error fade-in" style={{ marginTop: '20px' }}>
                    {error}
                    {permissionDenied && (
                      <div className="camera-help" style={{ marginTop: '15px' }}>
                        <strong>📱 Camera Access Help:</strong>
                        <ul style={{ margin: '10px 0', paddingLeft: '20px', textAlign: 'left' }}>
                          <li>
                            <strong>Chrome:</strong> Click the camera icon in address bar → Allow
                          </li>
                          <li>
                            <strong>Firefox:</strong> Click shield icon → Allow camera
                          </li>
                          <li>
                            <strong>Safari:</strong> Safari → Preferences → Websites → Camera →
                            Allow
                          </li>
                          <li>
                            <strong>Edge:</strong> Click lock icon → Camera → Allow
                          </li>
                          <li>Refresh this page after granting permission</li>
                          <li>Ensure no other app is using the camera</li>
                        </ul>
                        <button
                          onClick={() => window.location.reload()}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginTop: '10px',
                          }}
                        >
                          🔄 Refresh Page
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isMobile && !isScanning && !error && (
                  <div className="camera-help" style={{ marginTop: '20px' }}>
                    <strong>📱 Mobile QR Scanning Tips:</strong>
                    <ul style={{ margin: '10px 0', paddingLeft: '20px', textAlign: 'left' }}>
                      <li>🔦 Ensure good lighting conditions</li>
                      <li>📏 Hold phone 6-12 inches from QR code</li>
                      <li>🎯 Keep QR code centered in camera view</li>
                      <li>📱 Hold phone steady for automatic detection</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {scannedBatch && (
            <div className="fade-in">
              <div className="qr-section">
                <h3
                  style={{
                    color: '#2c5530',
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontSize: isMobile ? '20px' : '24px',
                  }}
                >
                  <span className="herb-icon">✅</span>
                  Successfully Scanned!
                </h3>
                <p
                  style={{
                    fontSize: isMobile ? '16px' : '18px',
                    fontWeight: '600',
                    color: '#2c5530',
                    textAlign: 'center',
                    marginBottom: '20px',
                  }}
                >
                  Batch ID: {scannedBatch}
                </p>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <button
                    onClick={() => {
                      setScannedBatch(null);
                      setError(null);
                      setPermissionDenied(false);
                    }}
                    className="modern-button secondary"
                    style={{
                      fontSize: isMobile ? '14px' : '16px',
                      padding: isMobile ? '12px 20px' : '15px 25px',
                    }}
                  >
                    <span>🔄</span>
                    {isMobile ? 'Scan Again' : 'Scan Another QR Code'}
                  </button>
                </div>

                {isMobile && (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '14px',
                      marginBottom: '20px',
                    }}
                  >
                    💡 Swipe down to see full traceability details
                  </div>
                )}
              </div>

              <div className="divider"></div>

              <TraceabilityView batchId={scannedBatch} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
