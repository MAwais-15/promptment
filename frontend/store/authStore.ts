import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'

export type UserRole = 'admin' | 'student' | 'executor'

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  city: string
  university: string
  walletBalance: number
  rating: number
  totalReviews: number
  verified: boolean
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  updateUser: (partial: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => {
        Cookies.set('promptment_token', token, { expires: 7, secure: true, sameSite: 'strict' })
        set({ token })
      },

      logout: () => {
        Cookies.remove('promptment_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'promptment-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
