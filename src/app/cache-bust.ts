// Force cache clearing for all users
export const CACHE_VERSION = `v2.1.${Date.now()}`;

// Clear all browser caches
export function clearAllCaches() {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear sessionStorage:', e);
    }

    // Force reload from server
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }

    // Clear browser cache
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
  }
}

