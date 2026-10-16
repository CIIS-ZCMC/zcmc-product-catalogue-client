const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:7000/api`;

export const authStorage = {
  getToken: () => localStorage.getItem('zcmc_catalogue_token'),
  setToken: (token) => localStorage.setItem('zcmc_catalogue_token', token),
  removeToken: () => localStorage.removeItem('zcmc_catalogue_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('zcmc_catalogue_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('zcmc_catalogue_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('zcmc_catalogue_user'),
  clear: () => {
    localStorage.removeItem('zcmc_catalogue_token');
    localStorage.removeItem('zcmc_catalogue_user');
  },
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authStorage.getToken();

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      authStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      // not JSON
    }
    const message = errorData.message || errorData.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.errors = errorData.errors;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const api = {
  // Authentication (email and password only)
  login: async (credentials) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.access_token) {
      authStorage.setToken(res.access_token);
      authStorage.setUser(res.user);
    }
    return res;
  },

  register: async (credentials) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.access_token) {
      authStorage.setToken(res.access_token);
      authStorage.setUser(res.user);
    }
    return res;
  },

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clear();
    }
  },

  getMe: () => request('/auth/me'),

  getDashboardStats: () => request('/dashboard/stats'),

  getInternalCategories: () => request('/internal-categories'),

  getItemUnits: () => request('/item-units'),

  getNextErpCode: (categoryCode, internalCategoryCode = '', internalCategoryId = '', categoryKey = '') => {
    const query = new URLSearchParams();
    if (categoryCode) query.append('category_code', categoryCode);
    if (categoryKey) query.append('category_key', categoryKey);
    if (internalCategoryCode) query.append('internal_category_code', internalCategoryCode);
    if (internalCategoryId) query.append('internal_category_id', internalCategoryId);
    return request(`/products/next-erp-code?${query.toString()}`);
  },

  // `options` is passed through to fetch (e.g. { signal } to cancel stale list requests).
  getProducts: (params = {}, options = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/products?${query.toString()}`, options);
  },

  getProduct: (id, options = {}) => request(`/products/${id}`, options),

  createProduct: (data) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id, data) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: 'DELETE',
    }),

  validateNaming: (description, options = {}) =>
    request('/products/validate-naming', {
      ...options,
      method: 'POST',
      body: JSON.stringify({ description }),
    }),

  uploadSpecsPdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/products/upload-specs-pdf', {
      method: 'POST',
      body: formData,
    });
  },

  getPriceHistory: (id) => request(`/products/${id}/price-history`),

  importProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/products/import', {
      method: 'POST',
      body: formData,
    });
  },

  getExportUrl: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const token = authStorage.getToken();
    if (token) {
      query.append('token', token);
    }
    return `${API_BASE_URL}/products/export?${query.toString()}`;
  },

  downloadExportCsv: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const token = authStorage.getToken();
    const url = `${API_BASE_URL}/products/export?${query.toString()}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'text/csv, application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      let msg = 'Failed to export CSV';
      try {
        const errJson = await res.json();
        msg = errJson.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `ZCMC_Product_Catalogue_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  getCategories: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/categories?${query.toString()}`);
  },

  searchCategories: (q) => {
    return request(`/categories/search?q=${encodeURIComponent(q)}`);
  },

  getCommodities: (q = '', options = {}) => {
    return request(`/categories/commodities?q=${encodeURIComponent(q)}`, options);
  },

  getRootCategories: () => request('/categories/roots'),

  getCategoryChildren: (key) => request(`/categories/${key}/children`),

  getCategory: (key) => request(`/categories/${key}`),

  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (key, data) =>
    request(`/categories/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCategory: (key) =>
    request(`/categories/${key}`, {
      method: 'DELETE',
    }),

  getActivityLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/activity-logs?${query.toString()}`);
  },

  getProductActivityLogs: (productId, options = {}) => request(`/products/${productId}/activity-logs`, options),
};
