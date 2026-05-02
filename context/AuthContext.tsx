'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import api from '@/lib/axios'
import type { AuthUser, LoginResponse } from '@/types'

type AuthContextType = {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Rehydrate from cookies on mount
  useEffect(() => {
    const storedToken = Cookies.get('admin_token')
    const storedUser = Cookies.get('admin_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        Cookies.remove('admin_token')
        Cookies.remove('admin_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/admin/login', { email, password })
    const { token: newToken, user: newUser } = response.data.data

    // Store in cookies (7 days expiry)
    Cookies.set('admin_token', newToken, { expires: 7 })
    Cookies.set('admin_user', JSON.stringify(newUser), { expires: 7 })

    setToken(newToken)
    setUser(newUser)
    navigate('/dashboard')
  }, [navigate])

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/logout')
    } catch {
      // Ignore errors on logout
    } finally {
      Cookies.remove('admin_token')
      Cookies.remove('admin_user')
      setToken(null)
      setUser(null)
      navigate('/login')
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
