// Toast Notification Utility
class Toast {
  constructor() {
    this.createToastContainer();
  }

  createToastContainer() {
    // Remove existing container if it exists
    const existingContainer = document.getElementById("toast-container");
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create toast container
    const container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  show(message, type = "info", duration = 5000) {
    const toast = document.createElement("div");
    const icon = this.getIcon(type);
    const bgColor = this.getBackgroundColor(type);
    const textColor = this.getTextColor(type);

    toast.style.cssText = `
      background: ${bgColor};
      color: ${textColor};
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Manrope', sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;

    toast.innerHTML = `
      <div style="font-size: 18px; flex-shrink: 0;">${icon}</div>
      <div style="flex: 1;">${message}</div>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 18px;
        opacity: 0.7;
        padding: 0;
        margin-left: 8px;
        flex-shrink: 0;
      ">&times;</button>
    `;

    const container = document.getElementById("toast-container");
    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duration);

    return toast;
  }

  success(message, duration = 5000) {
    return this.show(message, "success", duration);
  }

  error(message, duration = 7000) {
    return this.show(message, "error", duration);
  }

  warning(message, duration = 6000) {
    return this.show(message, "warning", duration);
  }

  info(message, duration = 5000) {
    return this.show(message, "info", duration);
  }

  getIcon(type) {
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };
    return icons[type] || icons.info;
  }

  getBackgroundColor(type) {
    const colors = {
      success: "#d4edda",
      error: "#f8d7da",
      warning: "#fff3cd",
      info: "#d1ecf1",
    };
    return colors[type] || colors.info;
  }

  getTextColor(type) {
    const colors = {
      success: "#155724",
      error: "#721c24",
      warning: "#856404",
      info: "#0c5460",
    };
    return colors[type] || colors.info;
  }
}

// Create global toast instance
window.toast = new Toast();
