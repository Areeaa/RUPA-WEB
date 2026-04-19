import api from './api';
import type { UserData, Product } from '../types';
import type { Order } from '../types/orders';

// --- Auth Services ---
export const authService = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  register: (userData: { name: string; email: string; password: string }) => 
    api.post('/auth/register', userData),
  googleLogin: (idToken: string) => 
    api.post('/auth/google-login', { idToken }),
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => 
    api.post(`/auth/reset-password/${token}`, { newPassword }),
  getProfile: () => 
    api.get('/users/profile'),
  updateProfile: (data: FormData | Partial<UserData>) => 
    api.put('/users/profile', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    }),
  changePassword: (current_password: string, new_password: string) => 
    api.put('/users/change-password', { current_password, new_password }),
  applyForCreator: (data: FormData) => 
    api.post('/users/apply-creator', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// --- Product Services ---
export const productService = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string | number) => api.get(`/products/${id}`),
  getCategories: () => api.get('/categories'),
  getMyProducts: () => api.get('/products/my-products'),
  getProductsByUser: (userId: string | number) => api.get(`/products/user/${userId}`),
  create: (data: FormData) => api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string | number, data: FormData) => api.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string | number) => api.delete(`/products/${id}`),
};

// --- Order Services ---
export const orderService = {
  getMyOrders: () => api.get('/orders/my-orders'),
  confirmPayment: (orderId: number, data: FormData) => 
    api.put(`/orders/confirm/${orderId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  completeOrder: (orderId: number) => 
    api.put(`/orders/complete/${orderId}`),
  // Seller only
  createInvoice: (data: any) => api.post('/orders/invoice', data),
  verifyPayment: (orderId: number, action: string) => 
    api.put(`/orders/verify/${orderId}`, { action }),
  inputResi: (orderId: number, tracking_number: string) => 
    api.put(`/orders/ship/${orderId}`, { tracking_number }),
  getReceivedOrders: () => api.get('/orders/received-orders'),
};

// --- Chat Services ---
export const chatService = {
  getMyConversations: () => api.get('/chats'),
  startChat: (productId: number | string) => 
    api.post('/chats/start', { productId }),
  getMessages: (conversationId: number | string) => 
    api.get(`/chats/${conversationId}`),
  sendMessage: (conversationId: number | string, text: string) => 
    api.post(`/chats/${conversationId}/message`, { text }),
};

// --- Review Services ---
export const reviewService = {
  create: (data: { orderId: number; productId: number; rating: number; comment: string }) => 
    api.post('/reviews', data),
  getProductReviews: (productId: number | string) => 
    api.get(`/reviews/product/${productId}`),
};

// --- License Services ---
export const licenseService = {
  submit: (data: any) => api.post('/licenses/submit', data),
  getMyLicenses: () => api.get('/licenses/my-licenses'),
};

// --- Admin Services ---
export const adminService = {
  getPendingCreators: () => api.get('/admin/creators/pending'),
  verifyCreator: (userId: number, action: 'approve' | 'reject') => 
    api.put(`/admin/creators/verify/${userId}`, { action }),
  // Categories
  createCategory: (name: string) => api.post('/admin/categories', { name }),
  updateCategory: (id: number, name: string) => api.put(`/admin/categories/${id}`, { name }),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  // Licenses
  getPendingLicenses: () => api.get('/admin/licenses/pending'),
  verifyLicense: (id: number, action: 'approve' | 'reject') => 
    api.put(`/admin/licenses/verify/${id}`, { action }),
  // Analytics
  getSystemStats: () => api.get('/admin/stats'),
  getDailyTransactions: () => api.get('/admin/analytics/daily'),
  getTopCreators: () => api.get('/admin/analytics/creators'),
  getTopProductsPerCategory: () => api.get('/admin/analytics/products'),
};
