// Disable React error overlay for TV display
if (process.env.NODE_ENV === 'development') {
  // Remove error overlay iframe if it exists
  const removeErrorOverlay = () => {
    const overlay = document.querySelector('iframe[style*="z-index: 2147483647"]');
    if (overlay) {
      overlay.remove();
    }
  };

  // Check and remove overlay every second
  setInterval(removeErrorOverlay, 1000);

  // Also remove on load
  window.addEventListener('load', removeErrorOverlay);
  
  // Suppress console errors in production-like TV display
  const originalError = console.error;
  console.error = (...args) => {
    // Still log to console but don't trigger overlay
    originalError.apply(console, args);
  };
}
