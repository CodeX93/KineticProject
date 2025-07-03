
import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePose } from '../contexts/PoseContext'

const Header: React.FC = () => {
  const { user, logout, switchRole } = useAuth()
  const { currentEngine, switchEngine } = usePose()

  const handleRoleSwitch = () => {
    const newRole = user?.role === 'client' ? 'provider' : 'client'
    switchRole(newRole)
    window.location.href = newRole === 'client' ? '/client-dashboard' : '/provider-dashboard'
  }

  const handleEngineSwitch = () => {
    const newEngine = currentEngine === 'mediapipe' ? 'openpose' : 'mediapipe'
    switchEngine(newEngine)
  }

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {user?.role === 'client' ? 'Client Dashboard' : 'Provider Dashboard'}
          </h1>
          <span className="text-sm text-gray-500">
            Currently using: {currentEngine === 'mediapipe' ? 'MediaPipe' : 'OpenPose'}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleEngineSwitch}
            className="btn btn-secondary text-sm"
          >
            Switch to {currentEngine === 'mediapipe' ? 'OpenPose' : 'MediaPipe'}
          </button>
          
          <button
            onClick={handleRoleSwitch}
            className="btn btn-secondary text-sm"
          >
            Switch to {user?.role === 'client' ? 'Provider' : 'Client'}
          </button>
          
          <span className="text-sm text-gray-600">
            Welcome, {user?.name}
          </span>
          
          <button
            onClick={logout}
            className="btn btn-primary text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
