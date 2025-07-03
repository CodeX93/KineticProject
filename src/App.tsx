
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PoseProvider } from './contexts/PoseContext'
import LoginPage from './pages/LoginPage'
import ClientDashboard from './pages/ClientDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <PoseProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/client-dashboard" 
              element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/provider-dashboard" 
              element={
                <ProtectedRoute requiredRole="provider">
                  <ProviderDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </PoseProvider>
    </AuthProvider>
  )
}

export default App
