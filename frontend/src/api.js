const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = 'Something went wrong';
    if (typeof data?.detail === 'string') message = data.detail;
    else if (data?.detail?.message) message = data.detail.message;
    else if (Array.isArray(data?.detail)) message = data.detail.map((err) => err.msg).join(', ');
    throw new Error(message);
  }

  return data;
}

export const api = {
  baseUrl: API_BASE_URL,
  getSummary: () => request('/dashboard/summary'),

  getProducts: () => request('/products'),
  createProduct: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  getCustomers: () => request('/customers'),
  createCustomer: (payload) => request('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  getOrders: () => request('/orders'),
  createOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  cancelOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};
