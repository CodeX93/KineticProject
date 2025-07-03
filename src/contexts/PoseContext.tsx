
import React, { createContext, useContext, useState, ReactNode } from 'react'

export type PoseEngine = 'mediapipe' | 'openpose'

interface PoseContextType {
  currentEngine: PoseEngine
  switchEngine: (engine: PoseEngine) => void
  isDetecting: boolean
  setIsDetecting: (detecting: boolean) => void
}

const PoseContext = createContext<PoseContextType | undefined>(undefined)

export const usePose = () => {
  const context = useContext(PoseContext)
  if (context === undefined) {
    throw new Error('usePose must be used within a PoseProvider')
  }
  return context
}

interface PoseProviderProps {
  children: ReactNode
}

export const PoseProvider: React.FC<PoseProviderProps> = ({ children }) => {
  const [currentEngine, setCurrentEngine] = useState<PoseEngine>('mediapipe')
  const [isDetecting, setIsDetecting] = useState(false)

  const switchEngine = (engine: PoseEngine) => {
    setCurrentEngine(engine)
    localStorage.setItem('kinetic_pose_engine', engine)
  }

  const value: PoseContextType = {
    currentEngine,
    switchEngine,
    isDetecting,
    setIsDetecting
  }

  return (
    <PoseContext.Provider value={value}>
      {children}
    </PoseContext.Provider>
  )
}
