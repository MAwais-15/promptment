import axios from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// ─── Axios Instance ──────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request: attach token
api.interceptors.request.use((config) => {
  const token = Cookies.get('promptment_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('promptment_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth API ────────────────────────────────────────────
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  register: (data: {
    name: string; email: string; password: string;
    role: string; city: string; university: string;
  }) => api.post('/auth/register', data),

  me: () => api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  refreshToken: () => api.post('/auth/refresh'),
}

// ─── Assignments API ─────────────────────────────────────
export const assignmentAPI = {
  create: (data: FormData) =>
    api.post('/assignments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  getAll: (params?: {
    status?: string; type?: string; minBudget?: number;
    maxBudget?: number; city?: string; university?: string;
    page?: number; limit?: number;
  }) => api.get('/assignments', { params }),

  getById: (id: string) => api.get(`/assignments/${id}`),

  getMyAssignments: (params?: { status?: string; page?: number }) =>
    api.get('/assignments/my', { params }),

  update: (id: string, data: Partial<any>) => api.put(`/assignments/${id}`, data),

  delete: (id: string) => api.delete(`/assignments/${id}`),

  apply: (id: string) => api.post(`/assignments/${id}/apply`),

  accept: (id: string, executorId: string) =>
    api.post(`/assignments/${id}/accept`, { executorId }),

  submit: (id: string, data: FormData) =>
    api.post(`/assignments/${id}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  approve: (id: string) => api.post(`/assignments/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.post(`/assignments/${id}/reject`, { reason }),

  getApplicants: (id: string) => api.get(`/assignments/${id}/applicants`),
}

// ─── Payments API ────────────────────────────────────────
export const paymentAPI = {
  createEscrow: (assignmentId: string, method: string, amount: number) =>
    api.post('/payments/escrow', { assignmentId, method, amount }),

  getPaymentStatus: (paymentId: string) =>
    api.get(`/payments/${paymentId}/status`),

  getMyTransactions: () => api.get('/payments/transactions'),

  getWalletBalance: () => api.get('/payments/wallet'),

  withdrawToBank: (data: { amount: number; bankDetails: any }) =>
    api.post('/payments/withdraw', data),

  cryptoAddress: (currency: string) =>
    api.get(`/payments/crypto-address/${currency}`),

  adminReleasePayment: (paymentId: string) =>
    api.post(`/payments/${paymentId}/release`),
}

// ─── Chat API ────────────────────────────────────────────
export const chatAPI = {
  getConversation: (assignmentId: string) =>
    api.get(`/chat/${assignmentId}`),

  getMessages: (conversationId: string, page = 1) =>
    api.get(`/chat/${conversationId}/messages`, { params: { page } }),

  sendMessage: (conversationId: string, content: string, attachments?: string[]) =>
    api.post(`/chat/${conversationId}/messages`, { content, attachments }),

  markRead: (conversationId: string) =>
    api.put(`/chat/${conversationId}/read`),
}

// ─── User API ────────────────────────────────────────────
export const userAPI = {
  getProfile: (id: string) => api.get(`/users/${id}`),

  updateProfile: (data: FormData) =>
    api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  getPublicProfile: (id: string) => api.get(`/users/${id}/public`),

  submitReview: (executorId: string, assignmentId: string, rating: number, comment: string) =>
    api.post(`/users/${executorId}/reviews`, { assignmentId, rating, comment }),

  getReviews: (userId: string) => api.get(`/users/${userId}/reviews`),
}

// ─── Admin API ───────────────────────────────────────────
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/stats'),

  getAllUsers: (params?: { role?: string; page?: number; search?: string }) =>
    api.get('/admin/users', { params }),

  banUser: (id: string) => api.put(`/admin/users/${id}/ban`),

  unbanUser: (id: string) => api.put(`/admin/users/${id}/unban`),

  getAllAssignments: (params?: any) => api.get('/admin/assignments', { params }),

  pendingApprovals: () => api.get('/admin/approvals'),

  approveAssignment: (id: string) => api.post(`/admin/assignments/${id}/approve`),

  getActivityLogs: (params?: any) => api.get('/admin/logs', { params }),

  getPaymentDashboard: () => api.get('/admin/payments'),

  getCommissions: (params?: any) => api.get('/admin/commissions', { params }),
}

// ─── Notification API ────────────────────────────────────
export const notificationAPI = {
  getAll: (page = 1) => api.get('/notifications', { params: { page } }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
}
