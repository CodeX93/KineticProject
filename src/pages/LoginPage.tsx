
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, UserRole } from '../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('client')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const success = await login(email, password, role)
      if (success) {
        const redirectPath = role === 'client' ? '/client-dashboard' : '/provider-dashboard'
        navigate(redirectPath, { replace: true })
      } else {
        setError('Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">KineticAI</h2>
          <p className="text-gray-600">AI-Powered Movement Analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="form-input"
            >
              <option value="client">Client (Patient)</option>
              <option value="provider">Provider (Physiotherapist)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>Demo credentials:</p>
          <p>Email: demo@kinetic.ai | Password: demo123</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
