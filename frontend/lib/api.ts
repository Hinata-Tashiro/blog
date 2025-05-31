import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// API functions
export const auth = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    });
    return response.data;
  },
  changeUsername: async (newUsername: string, currentPassword: string) => {
    const response = await api.post('/auth/change-username', { 
      new_username: newUsername, 
      current_password: currentPassword 
    });
    return response.data;
  },
};

export const posts = {
  list: async (params?: { page?: number; per_page?: number; category?: string; tag?: string; search?: string }) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },
  get: async (slug: string) => {
    const response = await api.get(`/posts/${slug}`);
    return response.data;
  },
  search: async (q: string, limit?: number) => {
    const response = await api.get('/posts/search', { params: { q, limit } });
    return response.data;
  },
};

export const categories = {
  list: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

export const tags = {
  list: async () => {
    const response = await api.get('/tags');
    return response.data;
  },
};

export const admin = {
  posts: {
    list: async (page?: number, per_page?: number) => {
      const response = await api.get('/admin/posts', { params: { page, per_page } });
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/admin/posts', data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/admin/posts/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/admin/posts/${id}`);
      return response.data;
    },
  },
  categories: {
    list: async () => {
      const response = await api.get('/admin/categories');
      return response.data;
    },
    get: async (id: number) => {
      const response = await api.get(`/admin/categories/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/admin/categories', data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/admin/categories/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/admin/categories/${id}`);
      return response.data;
    },
  },
  tags: {
    list: async () => {
      const response = await api.get('/admin/tags');
      return response.data;
    },
    get: async (id: number) => {
      const response = await api.get(`/admin/tags/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/admin/tags', data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await api.put(`/admin/tags/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await api.delete(`/admin/tags/${id}`);
      return response.data;
    },
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};