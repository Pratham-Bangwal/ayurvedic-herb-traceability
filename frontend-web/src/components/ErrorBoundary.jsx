import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-container">
          <div className="main-card">
            <div className="header">
              <h1>🚨 Oops! Something went wrong</h1>
              <p>We encountered an unexpected error</p>
            </div>

            <div className="content">
              <div className="form-section">
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>😔</div>
                  <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Error Details</h3>
                  <p style={{ marginBottom: '20px' }}>
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>

                  <button
                    onClick={() => {
                      this.setState({ hasError: false, error: null });
                      window.location.reload();
                    }}
                    className="modern-button"
                    style={{ marginRight: '10px' }}
                  >
                    <span>🔄</span>
                    Try Again
                  </button>

                  <button
                    onClick={() => (window.location.href = '/')}
                    className="modern-button secondary"
                  >
                    <span>🏠</span>
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
