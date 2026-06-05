/**
 * Toast Notification Service
 * Provides consistent error, success, and info notifications across the app
 */

// Since react-hot-toast might not be available, we'll create a simple implementation
// or use browser notifications as fallback

let toastContainer = null;

const createToastContainer = () => {
  if (toastContainer) return toastContainer;
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
};

const createToastElement = (message, type = 'info', duration = 3000) => {
  const toast = document.createElement('div');
  const bgColor = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  }[type] || '#3b82f6';

  const icon = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  }[type] || 'i';

  toast.style.cssText = `
    background-color: ${bgColor};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    word-wrap: break-word;
  `;

  toast.innerHTML = `
    <span style="font-weight: bold; font-size: 18px;">${icon}</span>
    <span>${message}</span>
  `;

  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
};

// Add CSS animations
const addAnimationStyles = () => {
  if (document.getElementById('toast-animations')) return;
  
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.innerHTML = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
};

// Initialize animations on first use
addAnimationStyles();

export const toast = {
  success: (message, duration = 3000) => {
    const container = createToastContainer();
    const element = createToastElement(message, 'success', duration);
    container.appendChild(element);
    console.log('✓', message);
  },

  error: (message, duration = 5000) => {
    const container = createToastContainer();
    const element = createToastElement(message, 'error', duration);
    container.appendChild(element);
    console.error('✕', message);
  },

  warning: (message, duration = 4000) => {
    const container = createToastContainer();
    const element = createToastElement(message, 'warning', duration);
    container.appendChild(element);
    console.warn('!', message);
  },

  info: (message, duration = 3000) => {
    const container = createToastContainer();
    const element = createToastElement(message, 'info', duration);
    container.appendChild(element);
    console.info('i', message);
  },

  loading: (message) => {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast-loading';
    toast.style.cssText = `
      background-color: #3b82f6;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
      max-width: 400px;
    `;
    
    toast.innerHTML = `
      <div style="
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <span>${message}</span>
    `;
    
    // Add spin animation if not already present
    if (!document.getElementById('toast-spin-animation')) {
      const style = document.createElement('style');
      style.id = 'toast-spin-animation';
      style.innerHTML = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    container.appendChild(toast);
    return toast;
  }
};

export default toast;
