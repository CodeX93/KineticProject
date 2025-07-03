
import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePose } from '../contexts/PoseContext'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
