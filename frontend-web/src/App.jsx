import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import TraceabilityView from './components/TraceabilityView';

export default function App() {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token') || '');
  const [showToast, setShowToast] = useState(false);
  const [form, setForm] = useState({
    batchId: '',
    herbName: '',
    farmerName: '',
    plantingDate: '',
    harvestDate: '',
    quantity: '',
    unit: 'kg',
    farmLocation: '',
    lat: '',
    lng: '',
    organicCertified: false,
    notes: '',
    photo: null,
  });
  const [currentBatch, setCurrentBatch] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qAdmin = params.get('admin') === '1';
    const lsRole = (localStorage.getItem('role') || '').toLowerCase();
    const hasToken = !!localStorage.getItem('token');
    setIsAdmin(qAdmin || lsRole === 'admin' || hasToken);
  }, []);
  const [herbs, setHerbs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loadingHerbs, setLoadingHerbs] = useState(false);

  const navigate = useNavigate();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!form.batchId?.trim()) {
      errors.batchId = 'Batch ID is required';
    } else if (form.batchId.length < 3) {
      errors.batchId = 'Batch ID must be at least 3 characters';
    }
    
    if (!form.herbName?.trim()) {
      errors.herbName = 'Herb name is required';
    }
    
    if (!form.farmerName?.trim()) {
      errors.farmerName = 'Farmer name is required';
    }
    
    if (!form.farmLocation?.trim()) {
      errors.farmLocation = 'Farm location is required';
    }
    
    if (form.quantity && (isNaN(form.quantity) || parseFloat(form.quantity) <= 0)) {
      errors.quantity = 'Quantity must be a positive number';
    }
    
    if (form.plantingDate && form.harvestDate) {
      const planting = new Date(form.plantingDate);
      const harvest = new Date(form.harvestDate);
      if (harvest <= planting) {
        errors.harvestDate = 'Harvest date must be after planting date';
      }
    }
    
    if (form.lat && (isNaN(form.lat) || Math.abs(parseFloat(form.lat)) > 90)) {
      errors.lat = 'Latitude must be between -90 and 90';
    }
    
    if (form.lng && (isNaN(form.lng) || Math.abs(parseFloat(form.lng)) > 180)) {
      errors.lng = 'Longitude must be between -180 and 180';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function loadHerbs() {
    setLoadingHerbs(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const headers = isAdmin
        ? (authToken ? { Authorization: `Bearer ${authToken}` } : {})
        : undefined;
      const response = await fetch(`${baseUrl}/api/herbs`, { headers });
      const data = await response.json();
      setHerbs(data.data || []);
    } catch (error) {
      console.error('Failed to load herbs:', error);
      setHerbs([]);
    } finally {
      setLoadingHerbs(false);
    }
  }

  const filteredHerbs = herbs.filter(herb => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      herb.batchId?.toLowerCase().includes(search) ||
      herb.herbName?.toLowerCase().includes(search) ||
      herb.name?.toLowerCase().includes(search) ||
      herb.farmerName?.toLowerCase().includes(search) ||
      herb.farmLocation?.toLowerCase().includes(search)
    );
  });

  const analytics = {
    totalBatches: herbs.length,
    organicBatches: herbs.filter(h => h.organicCertified).length,
    totalQuantity: herbs.reduce((sum, h) => sum + (parseFloat(h.quantity) || 0), 0),
    uniqueFarmers: new Set(herbs.map(h => h.farmerName).filter(Boolean)).size,
    uniqueLocations: new Set(herbs.map(h => h.farmLocation).filter(Boolean)).size,
    recentBatches: herbs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3),
    herbTypes: herbs.reduce((acc, h) => {
      const name = h.herbName || h.name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}),
    organicPercentage: herbs.length > 0 ? Math.round((herbs.filter(h => h.organicCertified).length / herbs.length) * 100) : 0
  };

  async function create(e) {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    setMessage('');
    
    // Validate form
    if (!validateForm()) {
      setMessage('Please fix the errors below and try again.');
      setMessageType('error');
      return;
    }
    
    setIsSubmitting(true);
    setIsLoading(true);
    
    try {
  const formData = new FormData();
  formData.append('batchId', form.batchId);
  formData.append('name', form.herbName); // 'name' is required by backend
  // Optionally send 'herbName' for compatibility, but not required by backend validation
  // formData.append('herbName', form.herbName);
  formData.append('farmerName', form.farmerName);
  if (form.plantingDate) formData.append('plantingDate', form.plantingDate);
  if (form.harvestDate) formData.append('harvestDate', form.harvestDate);
  if (form.quantity) formData.append('quantity', form.quantity);
  formData.append('unit', form.unit);
  if (form.farmLocation) formData.append('farmLocation', form.farmLocation);
  if (form.lat) formData.append('lat', String(form.lat));
  if (form.lng) formData.append('lng', String(form.lng));
  formData.append('organicCertified', form.organicCertified);
  if (form.notes) formData.append('notes', form.notes);
  if (form.photo) formData.append('photo', form.photo);

      const endpoint = form.photo ? '/api/herbs/upload' : '/api/herbs';
      const requestOptions = form.photo 
        ? { method: 'POST', body: formData }
        : { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batchId: form.batchId,
              name: form.herbName,
              herbName: form.herbName,
              farmerName: form.farmerName,
              plantingDate: form.plantingDate,
              harvestDate: form.harvestDate,
              quantity: form.quantity,
              unit: form.unit,
              farmLocation: form.farmLocation,
              lat: form.lat,
              lng: form.lng,
              organicCertified: form.organicCertified,
              notes: form.notes,
            })
          };

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}${endpoint}`, requestOptions);
      const res = await response.json();
      
      if (!response.ok) {
        let errorMessage = 'Failed to create herb batch. ';
        
        if (response.status === 400) {
          errorMessage += 'Please check your input data.';
        } else if (response.status === 409) {
          errorMessage += 'This batch ID already exists.';
        } else if (response.status >= 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          errorMessage += res.error?.message || 'Unknown error occurred.';
        }
        
        throw new Error(errorMessage);
      }

      // Success with animation
      const successMsg = `✅ Successfully created batch ${form.batchId}! ${form.photo ? 'Photo uploaded. ' : ''}QR code generated.`;
      showSuccessToast(successMsg);
      setCurrentBatch(form.batchId);
      setQrCode(res.data?.qr || null);
      
      // Reset form
      setForm({ 
        batchId: '', 
        herbName: '', 
        farmerName: '', 
        plantingDate: '', 
        harvestDate: '', 
        quantity: '', 
        unit: 'kg', 
        farmLocation: '', 
        lat: '', 
        lng: '', 
        organicCertified: false, 
        notes: '',
        photo: null 
      });
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Reload herbs data if needed
      if (showSearch || showDashboard) {
        loadHerbs();
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      const msg = err.message || 'Unknown error occurred';
      setMessage('❌ ' + msg);
      setMessageType('error');
      setQrCode(null);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  const showSuccessToast = (msg) => {
    setMessage(msg);
    setMessageType('success');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 300);
    }, 3000);
  };

  const extractBatchIdFromQrSrc = (src) => {
    try {
      const m = typeof src === 'string' ? src.match(/\/api\/herbs\/([^/]+)\/qrcode/) : null;
      return m?.[1] || null;
    } catch {
      return null;
    }
  };

  const downloadQrCode = async (batch) => {
    if (!batch) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      // Handle both data URLs and regular URLs
      let url;
      if (qrCode && qrCode.startsWith('data:')) {
        // If it's already a data URL, use it directly
        const blob = await fetch(qrCode).then(r => r.blob());
        url = URL.createObjectURL(blob);
      } else {
        // Otherwise, fetch from the API
        const res = await fetch(`${baseUrl}/api/herbs/${batch}/qrcode`);
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
      }
      
      // Determine file extension from content type
      const ct = res.headers.get('content-type') || '';
      const ext = ct.includes('svg') ? 'svg' : (ct.includes('png') ? 'png' : 'png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batch}-qr.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage('❌ Failed to download QR');
      setMessageType('error');
    }
  };

  return (
    <div className="app-container">
      <div className="main-card">
        <div className="header">
          <h1>🌿 Ayurvedic Herb Traceability</h1>
          <p>Ensuring Authenticity from Farm to Pharmacy</p>
        </div>

        <div className="content">
          {isMobile && (
            <div className="mobile-qr-help fade-in" style={{
              background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
              border: '1px solid #2196f3',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '28px', marginRight: '15px' }}>📱</div>
              <div>
                <strong>Mobile QR Code Scanner</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                  Use the scanner to verify herb authenticity. Tap 'Mobile Scanner' to start.
                </p>
              </div>
            </div>
          )}
          
          {/* Success or Error message */}
          {message && (
            <div
              className={`message ${messageType} ${showToast ? 'toast' : ''}`}
              onClick={clearMessage}
            >
              {message}
            </div>
          )}

          {/* QR Code display */}
          {qrCode && (
            <div className="qr-container fade-in">
              <div style={{ textAlign: 'center' }}>
                <img
                  src={qrCode}
                  alt="QR Code"
                  style={{
                    maxWidth: '250px',
                    maxHeight: '250px',
                    margin: '0 auto 10px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                  {currentBatch ? `Batch ID: ${currentBatch}` : 'Scan to verify authenticity'}
                </div>
                <button
                  className="modern-button small"
                  style={{ marginTop: '10px' }}
                  onClick={() => downloadQrCode(currentBatch || extractBatchIdFromQrSrc(qrCode))}
                >
                  <span>⬇️</span> Download QR
                </button>
              </div>
            </div>
          )}

          <div className="nav-section">
            <button
              onClick={() => navigate('/scan')}
              className="modern-button scanner"
              style={{ 
                background: isMobile ? 'linear-gradient(135deg, #007bff, #0056b3)' : undefined,
                fontSize: isMobile ? '16px' : undefined,
                padding: isMobile ? '15px 25px' : undefined
              }}
            >
              <span>{isMobile ? '📱' : '📷'}</span>
              {isMobile ? 'Mobile Scanner' : 'Open QR Scanner'}
            </button>
            
            {isAdmin && (
              <button
                onClick={() => {
                  setShowDashboard(!showDashboard);
                  if (!showDashboard) loadHerbs();
                }}
                className="modern-button"
              >
                <span>📊</span>
                {showDashboard ? 'Hide' : 'Show'} Analytics
              </button>
            )}
            
            {isAdmin && (
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (!showSearch) loadHerbs();
                }}
                className="modern-button secondary"
              >
                <span>🔍</span>
                {showSearch ? 'Hide' : 'Browse'} All Batches
              </button>
            )}
            
            <button
              onClick={() => {
                setCurrentBatch(null);
                setQrCode(null);
                clearMessage();
                setShowSearch(false);
                setShowDashboard(false);
              }}
              className="modern-button secondary"
            >
              <span>🔄</span>
              Reset View
            </button>

            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="modern-button danger"
            >
              <span>🛠️</span>
              {showAdmin ? 'Hide' : 'Show'} Admin
            </button>
          </div>

          {isAdmin && showDashboard && (
            <div className="form-section fade-in" style={{ marginTop: '40px' }}>
              <h3 className="form-title">
                <span className="herb-icon">📊</span>
                Analytics Dashboard
              </h3>
              
              {loadingHerbs ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                  <p>Loading analytics...</p>
                </div>
              ) : (
                <>
                  {/* Key Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    <div className="info-card">
                      <h4 style={{ margin: '0 0 15px 0', color: '#2c5530' }}>📦 Inventory Summary</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#555' }}>Total Herb Batches</span>
                        <span style={{ fontWeight: '600' }}>{analytics.totalBatches}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#555' }}>Total Quantity</span>
                        <span style={{ fontWeight: '600' }}>{analytics.totalQuantity.toFixed(2)} kg</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#555' }}>Organic Batches</span>
                        <span style={{ fontWeight: '600' }}>{analytics.organicBatches} <span style={{ color: '#5cb85c', fontSize: '0.9em' }}>(🌱 {analytics.organicPercentage}%)</span></span>
                      </div>
                      
                      <h4 style={{ margin: '20px 0 10px 0', color: '#2c5530', fontSize: '16px' }}>Herb Types</h4>
                      {Object.entries(analytics.herbTypes).length > 0 ? (
                        Object.entries(analytics.herbTypes)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([herb, count]) => (
                            <div key={herb} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ color: '#555' }}>{herb}</span>
                              <span style={{ fontWeight: '500' }}>{count}</span>
                            </div>
                          ))
                      ) : (
                        <p style={{ color: '#666', fontStyle: 'italic', margin: '5px 0' }}>No herbs yet</p>
                      )}
                    </div>
                    
                    <div className="info-card">
                      <h4 style={{ margin: '0 0 15px 0', color: '#2c5530' }}>🔄 Recent Activity</h4>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>Latest herb batches added to the system</p>
                      
                      {analytics.recentBatches.length > 0 ? (
                        analytics.recentBatches.map((herb) => (
                          <div key={herb._id} style={{ 
                            padding: '10px', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: '6px', 
                            marginBottom: '8px',
                            cursor: 'pointer' 
                          }} onClick={() => setCurrentBatch(herb.batchId)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: '600', color: '#2c5530' }}>{herb.herbName || herb.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{herb.batchId} • {herb.farmerName}</div>
                              </div>
                              {herb.organicCertified && <span style={{ color: '#5cb85c' }}>🌱</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No batches yet</p>
                      )}
                    </div>

                    {/* Quality Metrics */}
                    <div className="info-card">
                      <h4 style={{ margin: '0 0 15px 0', color: '#2c5530' }}>📈 Quality Metrics</h4>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ color: '#555' }}>Organic Certification</span>
                          <span style={{ fontWeight: '600', color: '#5cb85c' }}>{analytics.organicPercentage}%</span>
                        </div>
                        <div style={{ background: '#f0f0f0', borderRadius: '10px', height: '8px' }}>
                          <div style={{ 
                            background: 'linear-gradient(90deg, #5cb85c, #4a9a4a)', 
                            height: '100%', 
                            borderRadius: '10px',
                            width: `${analytics.organicPercentage}%`,
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                        <div>📍 <strong>{analytics.uniqueLocations}</strong> unique farm locations</div>
                        <div>👥 <strong>{analytics.uniqueFarmers}</strong> registered farmers</div>
                        <div>📦 <strong>{analytics.totalBatches}</strong> total herb batches</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {showAdmin && (
            <div className="form-section fade-in" style={{ marginTop: '40px' }}>
              <h3 className="form-title" style={{ color: '#b71c1c' }}>
                <span className="herb-icon">⚠️</span>
                Admin – Danger Zone
              </h3>
              {!authToken ? (
                <div className="info-card" style={{ borderLeft: '4px solid #2c5530', marginBottom: '16px' }}>
                  <p style={{ marginTop: 0, color: '#555' }}>Login to obtain an admin token (JWT) to access admin-only actions.</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      setIsLoading(true);
                      const username = e.target.elements.username.value;
                      const password = e.target.elements.password.value;
                      
                      if (!username || !password) {
                        throw new Error('Username and password are required');
                      }
                      
                      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                      console.log('Submitting login to:', `${baseUrl}/api/auth/login`);
                      const res = await fetch(`${baseUrl}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                      });
                      const json = await res.json();
                      console.log('Login response:', json);
                      if (!res.ok) throw new Error(json?.error?.message || 'Login failed');
                      const token = json?.data?.token;
                      if (!token) throw new Error('No token returned');
                      localStorage.setItem('token', token);
                      localStorage.setItem('role', 'admin');
                      setAuthToken(token);
                      setIsAdmin(true);
                      showSuccessToast('✅ Admin logged in');
                    } catch (e) {
                      console.error('Login error:', e);
                      setMessage('❌ ' + (e.message || 'Login failed'));
                      setMessageType('error');
                    } finally {
                      setIsLoading(false);
                    }
                  }} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input name="username" placeholder="Username" className="modern-input" style={{ maxWidth: '180px' }} />
                    <input name="password" placeholder="Password" type="password" className="modern-input" style={{ maxWidth: '180px' }} />
                    <button className="modern-button" type="submit">Login</button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="info-card" style={{ borderLeft: '4px solid #2c5530', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ marginTop: 0, color: '#555' }}>Logged in as admin. Token present.</p>
                      <button className="modern-button secondary" onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('role');
                        setAuthToken('');
                        setIsAdmin(false);
                        showSuccessToast('🔒 Logged out');
                      }}>Logout</button>
                    </div>
                  </div>
                
                  <div className="info-card" style={{ borderLeft: '4px solid #b71c1c' }}>
                    <p style={{ marginTop: 0, color: '#555' }}>
                      Wipes all herb data from the database. Available only in mock/demo mode.
                    </p>
                    <button
                      className="modern-button danger"
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                          const res = await fetch(`${baseUrl}/api/herbs/admin/wipe`, { 
                            method: 'POST',
                            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                          });
                          const json = await res.json();
                          if (!res.ok) throw new Error(json?.error?.message || 'Wipe failed');
                          showSuccessToast('🧹 All data wiped');
                          setCurrentBatch(null);
                          setQrCode(null);
                          await loadHerbs();
                        } catch (e) {
                          console.error('Wipe error:', e);
                          setMessage('❌ ' + (e.message || 'Wipe failed'));
                          setMessageType('error');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      Wipe All Data
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {showSearch && (
            <div className="form-section fade-in" style={{ marginTop: '40px' }}>
              <h3 className="form-title">
                <span className="herb-icon">🔍</span>
                Browse All Herb Batches
              </h3>
              
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <input
                  className="modern-input"
                  placeholder="Search by batch ID, herb name, farmer, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </div>

              {loadingHerbs ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                  <p>Loading herb batches...</p>
                </div>
              ) : filteredHerbs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
                  <p>{searchTerm ? 'No herbs found matching your search' : 'No herb batches found'}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {filteredHerbs.map((herb) => (
                    <div key={herb._id} className="info-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentBatch(herb.batchId)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: '#2c5530' }}>{herb.herbName || herb.name}</h4>
                        {herb.organicCertified && <span style={{ color: '#5cb85c', fontSize: '18px' }}>🌱</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                        <div><strong>Batch:</strong> {herb.batchId}</div>
                        <div><strong>Farmer:</strong> {herb.farmerName}</div>
                        {herb.farmLocation && <div><strong>Location:</strong> {herb.farmLocation}</div>}
                        {herb.quantity && <div><strong>Quantity:</strong> {herb.quantity} {herb.unit}</div>}
                        <div><strong>Created:</strong> {new Date(herb.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#999', marginRight: 'auto' }}>Click card for details</span>
                        <button
                          className="modern-button secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                            const img = `${baseUrl}/api/herbs/${herb.batchId}/qrcode`;
                            // Show QR inline using existing qrCode state and message area
                            setQrCode(img);
                            setMessage(`QR for ${herb.batchId}`);
                            setMessageType('info');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          View QR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentBatch && (
            <div style={{ marginTop: '40px' }} className="fade-in">
              <div className="divider"></div>
              <h3 style={{ color: '#2c5530', textAlign: 'center', margin: '30px 0' }}>
                <span className="herb-icon">🔍</span>
                Traceability Details for Batch {currentBatch}
              </h3>
              <TraceabilityView batchId={currentBatch} />
            </div>
          )}
          
          {!currentBatch && !showDashboard && !showSearch && (
            <div className="form-section fade-in">
              <h3 className="form-title">
                <span className="herb-icon">🌿</span>
                Register a New Herb Batch
              </h3>
              
              <form onSubmit={create} className="herb-form">
                <div className="input-group">
                  <label className="input-label">Batch ID *</label>
                  <input
                    className={`modern-input ${formErrors.batchId ? 'error' : ''}`}
                    placeholder="e.g., B123, TURMERIC2023"
                    value={form.batchId}
                    onChange={(e) => {
                      setForm({ ...form, batchId: e.target.value });
                      if (formErrors.batchId) {
                        setFormErrors({ ...formErrors, batchId: '' });
                      }
                    }}
                    required
                  />
                  {formErrors.batchId && (
                    <div className="input-error">{formErrors.batchId}</div>
                  )}
                </div>
                
                <div className="input-group">
                  <label className="input-label">Herb Name *</label>
                  <input
                    className={`modern-input ${formErrors.herbName ? 'error' : ''}`}
                    placeholder="e.g., Turmeric, Ashwagandha, Neem"
                    value={form.herbName}
                    onChange={(e) => {
                      setForm({ ...form, herbName: e.target.value });
                      if (formErrors.herbName) {
                        setFormErrors({ ...formErrors, herbName: '' });
                      }
                    }}
                    required
                  />
                  {formErrors.herbName && (
                    <div className="input-error">{formErrors.herbName}</div>
                  )}
                </div>
                
                <div className="input-group">
                  <label className="input-label">Farmer Name *</label>
                  <input
                    className={`modern-input ${formErrors.farmerName ? 'error' : ''}`}
                    placeholder="Enter farmer's name"
                    value={form.farmerName}
                    onChange={(e) => {
                      setForm({ ...form, farmerName: e.target.value });
                      if (formErrors.farmerName) {
                        setFormErrors({ ...formErrors, farmerName: '' });
                      }
                    }}
                    required
                  />
                  {formErrors.farmerName && (
                    <div className="input-error">{formErrors.farmerName}</div>
                  )}
                </div>
                
                <div className="input-group">
                  <label className="input-label">Farm Location *</label>
                  <input
                    className={`modern-input ${formErrors.farmLocation ? 'error' : ''}`}
                    placeholder="e.g., Village, District, State"
                    value={form.farmLocation}
                    onChange={(e) => {
                      setForm({ ...form, farmLocation: e.target.value });
                      if (formErrors.farmLocation) {
                        setFormErrors({ ...formErrors, farmLocation: '' });
                      }
                    }}
                  />
                  {formErrors.farmLocation && (
                    <div className="input-error">{formErrors.farmLocation}</div>
                  )}
                </div>
                
                <div className="input-group">
                  <label className="input-label">Planting Date</label>
                  <input
                    className="modern-input"
                    type="date"
                    value={form.plantingDate}
                    onChange={(e) => setForm({ ...form, plantingDate: e.target.value })}
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Harvest Date</label>
                  <input
                    className={`modern-input ${formErrors.harvestDate ? 'error' : ''}`}
                    type="date"
                    value={form.harvestDate}
                    onChange={(e) => {
                      setForm({ ...form, harvestDate: e.target.value });
                      if (formErrors.harvestDate) {
                        setFormErrors({ ...formErrors, harvestDate: '' });
                      }
                    }}
                  />
                  {formErrors.harvestDate && (
                    <div className="input-error">{formErrors.harvestDate}</div>
                  )}
                </div>
                
                <div className="input-group">
                  <label className="input-label">Quantity</label>
                  <input
                    className="modern-input"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Unit</label>
                  <select
                    className="modern-input"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="lb">Pounds (lb)</option>
                    <option value="oz">Ounces (oz)</option>
                    <option value="ton">Metric Tons</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Organic Certified</label>
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={form.organicCertified}
                      onChange={(e) => setForm({ ...form, organicCertified: e.target.checked })}
                      id="organic-checkbox"
                    />
                    <label htmlFor="organic-checkbox">
                      <span className="checkmark"></span>
                      <span>Yes, this herb is organically certified 🌱</span>
                    </label>
                  </div>
                </div>
                
                <div className="input-group coords">
                  <div>
                    <label className="input-label">Latitude</label>
                    <input
                      className={`modern-input ${formErrors.lat ? 'error' : ''}`}
                      placeholder="e.g., 23.45"
                      value={form.lat}
                      onChange={(e) => {
                        setForm({ ...form, lat: e.target.value });
                        if (formErrors.lat) {
                          setFormErrors({ ...formErrors, lat: '' });
                        }
                      }}
                    />
                    {formErrors.lat && (
                      <div className="input-error">{formErrors.lat}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="input-label">Longitude</label>
                    <input
                      className={`modern-input ${formErrors.lng ? 'error' : ''}`}
                      placeholder="e.g., 78.12"
                      value={form.lng}
                      onChange={(e) => {
                        setForm({ ...form, lng: e.target.value });
                        if (formErrors.lng) {
                          setFormErrors({ ...formErrors, lng: '' });
                        }
                      }}
                    />
                    {formErrors.lng && (
                      <div className="input-error">{formErrors.lng}</div>
                    )}
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Herb Photo</label>
                  <input
                    className="modern-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setForm({ ...form, photo: file });
                    }}
                  />
                  <div className="input-description">Optional: Upload a photo of the herb for verification</div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Notes</label>
                  <textarea
                    className="modern-input"
                    placeholder="Any additional information about this herb batch"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  ></textarea>
                </div>
                
                <button
                  className="modern-button submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      Register Herb Batch
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {showToast && <div className="toast-overlay" onClick={() => setShowToast(false)}></div>}

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Processing...</div>
        </div>
      )}
    </div>
  );
}