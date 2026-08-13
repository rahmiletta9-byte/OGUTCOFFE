const API_URL = import.meta.env.VITE_FLASK_API_URL || 'http://127.0.0.1:5000';

export const apiClient = {
  async fetch(endpoint, options = {}) {
    const token = localStorage.getItem('pos_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const url = `${API_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (res.status === 401 && !endpoint.includes('/api/auth/login')) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_refresh_token');
      localStorage.removeItem('pos_last_activity');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return res;
  },

  async get(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  },

  async post(endpoint, body, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async put(endpoint, body, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  async delete(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  }
};
