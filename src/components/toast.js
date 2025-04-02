/**
 * Displays a toast notification.
 * @param {string} message - The message to display in the toast.
 * @param {'success' | 'error' | 'info'} [type='info'] - The type of the toast (success, error, info).
 * @param {number} [duration=3000] - The duration in milliseconds for which the toast is displayed.
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Create the toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        toastContainer.style.display = 'flex';
        toastContainer.style.flexDirection = 'column';
        toastContainer.style.gap = '10px';
        document.body.appendChild(toastContainer);
    }

    // Create the toast element
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.color = '#fff';
    toast.style.fontSize = '14px';
    toast.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    toast.style.animation = `fadeInOut ${duration}ms ease-in-out`;

    // Set the background color based on the type
    switch (type) {
        case 'success':
        toast.style.backgroundColor = '#4caf50';
        break;
        case 'error':
        toast.style.backgroundColor = '#f44336';
        break;
        case 'info':
        default:
        toast.style.backgroundColor = '#2196f3';
        break;
    }

    // Append the toast to the container
    toastContainer.appendChild(toast);

    // Remove the toast after the specified duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
    }

    // Add fade-in-out animation
    const style = document.createElement('style');
    style.textContent = `
    @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);
