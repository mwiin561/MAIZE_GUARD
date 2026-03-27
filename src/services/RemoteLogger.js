import { API_URL } from '../api/client';

class RemoteLogger {
  constructor() {
    this.enabled = true;
  }

  async log(message, level = 'info') {
    // Still log locally too
    if (level === 'error') console.error(message);
    else if (level === 'warn') console.warn(message);
    else console.log(message);

    if (!this.enabled) return;

    try {
      // Create a signal to timeout if the backend is unreachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(`${API_URL}/debug/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: typeof message === 'string' ? message : JSON.stringify(message),
          level,
          timestamp: new Date().toLocaleTimeString(),
        }),
      }).then(() => {
        clearTimeout(timeoutId);
      }).catch(() => {
        clearTimeout(timeoutId);
        // Silently fails if backend is unreachable
      });
    } catch (e) {
      // Ignore network errors
    }
  }

  warn(msg) { this.log(msg, 'warn'); }
  error(msg) { this.log(msg, 'error'); }
}

export default new RemoteLogger();
