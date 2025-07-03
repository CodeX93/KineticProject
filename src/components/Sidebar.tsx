
import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const Sidebar: React.FC = () => {
  const { user } = useAuth()

  const clientMenuItems = [
    { name: 'My Exercises', icon: '🏃‍♂️', active: true },
    { name: 'Progress', icon: '📊' },
    { name: 'Pose Analysis', icon: '🎯' },
    { name: 'Provider Notes', icon: '📝' }
  ]

  const providerMenuItems = [
    { name: 'My Clients', icon: '👥', active: true },
    { name: 'Exercise Plans', icon: '📋' },
    { name: 'Pose Viewer', icon: '🎯' },
    { name: 'Analytics', icon: '📈' }
  ]

  const menuItems = user?.role === 'client' ? clientMenuItems : providerMenuItems

  return (
    <div className="sidebar">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">KineticAI</h2>
        <p className="text-sm opacity-75">Movement Analysis</p>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-white opacity-75 hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto pt-8">
        <div className="text-center text-sm opacity-75">
          <p>Role: {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
