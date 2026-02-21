const API_URL = '/api';

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la petición');
    }
    return response.json();
  },

  auth: {
    login: (credentials: any) => api.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  },

  raffles: {
    getAll: () => api.fetch('/raffles'),
    create: (data: any) => api.fetch('/raffles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (id: number, status: string) => api.fetch(`/raffles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  },

  tickets: {
    getByRaffle: (raffleId: number) => api.fetch(`/tickets/raffle/${raffleId}`),
    update: (id: number, data: any) => api.fetch(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    getPayments: (id: number) => api.fetch(`/tickets/${id}/payments`),
  },

  dashboard: {
    getStats: (raffleId: number) => api.fetch(`/dashboard/${raffleId}`),
    getWallet: (raffleId: number) => api.fetch(`/dashboard/wallet/${raffleId}`),
  }
};
