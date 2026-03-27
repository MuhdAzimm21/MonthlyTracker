/**
 * Modern Popup & Notification System
 */

const Popup = {
  /**
   * Shows a custom alert modal
   * @param {string} title 
   * @param {string} message 
   * @param {string} icon 
   * @returns {Promise}
   */
  alert: function(title, message, icon = 'ℹ️') {
    return new Promise((resolve) => {
      this._createModal({
        title,
        message,
        icon,
        buttons: [
          { text: 'OK', type: 'primary', value: true }
        ],
        callback: resolve
      });
    });
  },

  /**
   * Shows a custom confirmation modal
   * @param {string} title 
   * @param {string} message 
   * @param {string} icon 
   * @returns {Promise<boolean>}
   */
  confirm: function(title, message, icon = '❓') {
    return new Promise((resolve) => {
      this._createModal({
        title,
        message,
        icon,
        buttons: [
          { text: 'Cancel', type: 'secondary', value: false },
          { text: 'Confirm', type: 'danger', value: true }
        ],
        callback: resolve
      });
    });
  },

  /**
   * Internal method to build the modal DOM
   */
  _createModal: function(config) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    
    const card = document.createElement('div');
    card.className = 'popup-card';
    
    card.innerHTML = `
      <div class="popup-title">${config.title}</div>
      <div class="popup-message">${config.message}</div>
      <div class="popup-buttons"></div>
    `;
    
    const btnContainer = card.querySelector('.popup-buttons');
    
    config.buttons.forEach(btnConfig => {
      const btn = document.createElement('button');
      btn.className = `popup-btn popup-btn-${btnConfig.type}`;
      btn.textContent = btnConfig.text;
      btn.onclick = () => {
        this._closeModal(overlay, () => config.callback(btnConfig.value));
      };
      btnContainer.appendChild(btn);
    });
    
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    
    // Trigger animation
    setTimeout(() => overlay.classList.add('active'), 10);
  },

  _closeModal: function(overlay, callback) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 300);
  },

  /**
   * Shows a brief toast notification
   */
  toast: function(message, type = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 800);
  }
};

// Global overrides (Optional but recommended for consistency)
window.nativeAlert = window.alert;
window.nativeConfirm = window.confirm;

// We won't override window.alert directly to avoid breaking 3rd party scripts, 
// but we will use Popup.alert in our app.
