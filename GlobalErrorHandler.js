import React, { Component } from 'react';

// Enhanced error types with more specific categories
const ErrorTypes = {
  NETWORK: 'network',
  API: 'api',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SYSTEM: 'system',
  DATABASE: 'database',
  FORM: 'form',
  UPLOAD: 'upload',
  PERMISSION: 'permission',
  TIMEOUT: 'timeout'
};

// Enhanced notification styles
const styles = {
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    maxWidth: '400px',
    padding: '16px 24px',
    borderRadius: '8px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: '14px',
    lineHeight: 1.6,
    animation: 'slideIn 0.5s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
  },
  errorContainer: {
    padding: '30px',
    margin: '30px auto',
    backgroundColor: '#fff3f3',
    border: '1px solid #ffcdd2',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
    maxWidth: '600px'
  },
  errorButton: {
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '20px',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    outline: 'none',
    '&:hover': {
      backgroundColor: '#b71c1c',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
    }
  }
};

// Enhanced error tracking initialization
const initializeErrorTracking = () => {
  // Override fetch with enhanced error handling
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const startTime = Date.now();
    try {
      const response = await Promise.race([
        originalFetch(...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
      ]);

      if (!response.ok) {
        const error = {
          type: ErrorTypes.API,
          status: response.status,
          message: `API Error: ${response.status}`,
          endpoint: args[0],
          duration: Date.now() - startTime
        };
        ErrorUtils.handleError(error);
      }
      return response;
    } catch (error) {
      const isTimeout = error.message === 'Request timeout';
      ErrorUtils.handleError({
        type: isTimeout ? ErrorTypes.TIMEOUT : ErrorTypes.NETWORK,
        message: isTimeout ? 'Request timed out' : 'Network request failed',
        endpoint: args[0],
        duration: Date.now() - startTime
      });
      throw error;
    }
  };

  // Enhanced network monitoring
  let wasOffline = !navigator.onLine;
  window.addEventListener('online', () => {
    if (wasOffline) {
      ErrorUtils.showNotification('Connection restored', 'success');
      wasOffline = false;
    }
  });

  window.addEventListener('offline', () => {
    wasOffline = true;
    ErrorUtils.handleError({
      type: ErrorTypes.NETWORK,
      message: 'Network connection lost'
    });
  });

  // Enhanced XHR monitoring
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const startTime = Date.now();

    xhr.addEventListener('load', function() {
      const duration = Date.now() - startTime;
      
      if (this.status >= 400) {
        const error = {
          type: this.status === 401 ? ErrorTypes.AUTH : ErrorTypes.API,
          status: this.status,
          message: this.statusText || `HTTP Error: ${this.status}`,
          duration
        };
        ErrorUtils.handleError(error);
      }
    });

    xhr.addEventListener('timeout', () => {
      ErrorUtils.handleError({
        type: ErrorTypes.TIMEOUT,
        message: 'Request timed out',
        duration: Date.now() - startTime
      });
    });

    return xhr;
  };

  // Form submission error handling
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form.checkValidity()) {
      event.preventDefault();
      ErrorUtils.handleError({
        type: ErrorTypes.FORM,
        message: 'Please check your input and try again'
      });
    }
  });

  // File upload error handling
  document.addEventListener('change', (event) => {
    const input = event.target;
    if (input.type === 'file' && input.files.length > 0) {
      const file = input.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSize) {
        ErrorUtils.handleError({
          type: ErrorTypes.UPLOAD,
          message: 'File size exceeds 5MB limit'
        });
        input.value = '';
      }
    }
  });
};

// Enhanced Error Utilities
export const ErrorUtils = {
  isHandlingError: false,
  lastErrorTimestamp: 0,
  activeNotifications: new Set(),
  errorLog: [],
  subscribers: new Set(),

  subscribeToErrors: function(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  },

  unsubscribeFromErrors: function(callback) {
    this.subscribers.delete(callback);
  },

  handleError: function(error) {
    const now = Date.now();
    if (this.isHandlingError || (now - this.lastErrorTimestamp) < 100) {
      return;
    }

    this.isHandlingError = true;
    this.lastErrorTimestamp = now;

    try {
      const message = this.getErrorMessage(error);
      if (!this.activeNotifications.has(message)) {
        this.activeNotifications.add(message);
        this.showNotification(message, error.type);
        this.logError({ ...error, message });
      }

      this.subscribers.forEach(callback => {
        try {
          callback(error);
        } catch (err) {
          console.error('Error in error subscriber:', err);
        }
      });

      this.handleErrorAction(error);
    } finally {
      setTimeout(() => {
        this.isHandlingError = false;
      }, 100);
    }
  },

  getErrorMessage: function(error) {
    if (!error) return 'An unexpected error occurred';

    if (!navigator.onLine) {
      return 'Network error: Please check your internet connection';
    }

    switch (error.type) {
      case ErrorTypes.API:
        switch (error.status) {
          case 400: return 'Invalid request. Please check your input.';
          case 401: return 'Your session has expired. Please log in again.';
          case 403: return 'You don\'t have permission to perform this action.';
          case 404: return 'The requested resource was not found.';
          case 429: return 'Too many requests. Please try again later.';
          case 500: return 'Server error. Our team has been notified.';
          default: return `Server error: ${error.status || 'Unknown'}`;
        }
      case ErrorTypes.NETWORK:
        return 'Network error: Unable to connect to the server';
      case ErrorTypes.AUTH:
        return 'Authentication required. Please log in.';
      case ErrorTypes.VALIDATION:
        return error.message || 'Please check your input and try again';
      case ErrorTypes.FORM:
        return 'Please fill in all required fields correctly';
      case ErrorTypes.UPLOAD:
        return error.message || 'File upload failed';
      case ErrorTypes.TIMEOUT:
        return 'Request timed out. Please try again';
      case ErrorTypes.PERMISSION:
        return 'You don\'t have permission to perform this action';
      default:
        return error.message || 'An unexpected error occurred';
    }
  },

  handleErrorAction: function(error) {
    switch (error.type) {
      case ErrorTypes.AUTH:
        sessionStorage.setItem('redirectPath', window.location.pathname);
        window.location.href = '/login';
        break;
      case ErrorTypes.PERMISSION:
        window.location.href = '/unauthorized';
        break;
      // Add more specific error actions as needed
    }
  },

  showNotification: function(message, type = 'error') {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.textContent = message;
    const backgroundColor = this.getNotificationColor(type);
    Object.assign(notification.style, styles.notification, {
      backgroundColor
    });

    container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.5s ease-in';
      setTimeout(() => {
        notification.remove();
        this.activeNotifications.delete(message);
      }, 500);
    }, 5000);
  },

  getNotificationColor: function(type) {
    switch (type) {
      case ErrorTypes.NETWORK: return '#e53935';
      case ErrorTypes.API: return '#d32f2f';
      case ErrorTypes.AUTH: return '#7b1fa2';
      case ErrorTypes.VALIDATION: return '#f57c00';
      case ErrorTypes.FORM: return '#fb8c00';
      case ErrorTypes.UPLOAD: return '#6d4c41';
      case ErrorTypes.TIMEOUT: return '#455a64';
      case ErrorTypes.PERMISSION: return '#c2185b';
      case 'success': return '#43a047';
      default: return '#ff5252';
    }
  },

  logError: function(error) {
    const errorInfo = {
      type: error.type,
      message: error.message,
      status: error.status,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errorLog.unshift(errorInfo);
    if (this.errorLog.length > 100) this.errorLog.pop();

    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', errorInfo);
    }

    // You could add error reporting service integration here
    // this.reportToErrorService(errorInfo);
  }
};

// Initialize error tracking
initializeErrorTracking();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Enhanced Error Boundary Component
class GlobalErrorBoundary extends Component {
  state = { 
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    ErrorUtils.handleError({
      type: ErrorTypes.SYSTEM,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.errorContainer}>
          <h2 style={{ color: '#d32f2f', marginBottom: '15px', fontSize: '24px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#555', marginBottom: '20px', fontSize: '16px' }}>
            The application has encountered an error. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={styles.errorButton}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary; 