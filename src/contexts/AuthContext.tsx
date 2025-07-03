
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'client' | 'provider'

export interface User {
  email: string
  role: UserRole
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('kinetic_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('kinetic_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simple validation (in real app, this would be server-side)
    if (email && password.length >= 6) {
      const userData: User = {
        email,
        role,
        name: email.split('@')[0] // Use email prefix as name
      }
      
      setUser(userData)
      localStorage.setItem('kinetic_user', JSON.stringify(userData))
      return true
    }
    
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('kinetic_user')
  }

  const switchRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role }
      setUser(updatedUser)
      localStorage.setItem('kinetic_user', JSON.stringify(updatedUser))
    }
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    switchRole,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
