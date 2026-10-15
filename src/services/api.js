const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000/api`;

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
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
  getDashboardStats: () => request('/dashboard/stats'),

  getInternalCategories: () => request('/internal-categories'),

  getNextErpCode: (categoryCode, internalCategoryCode = '', internalCategoryId = '', categoryKey = '') => {
    const query = new URLSearchParams();
    if (categoryCode) query.append('category_code', categoryCode);
    if (categoryKey) query.append('category_key', categoryKey);
    if (internalCategoryCode) query.append('internal_category_code', internalCategoryCode);
    if (internalCategoryId) query.append('internal_category_id', internalCategoryId);
    return request(`/products/next-erp-code?${query.toString()}`);
  },

  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/products?${query.toString()}`);
  },

  getProduct: (id) => request(`/products/${id}`),

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

  validateNaming: (description) =>
    request('/products/validate-naming', {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),

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
    return `${API_BASE_URL}/products/export?${query.toString()}`;
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

  getCommodities: (q = '') => {
    return request(`/categories/commodities?q=${encodeURIComponent(q)}`);
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
};
