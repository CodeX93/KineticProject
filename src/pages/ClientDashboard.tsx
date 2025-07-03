
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import PoseEstimation from '../components/PoseEstimation'
import { dummyExercises, getClientProgress, getProviderNotes } from '../data/dummyData'
import { useAuth } from '../contexts/AuthContext'

const ClientDashboard: React.FC = () => {
  const { user } = useAuth()
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [showPoseAnalysis, setShowPoseAnalysis] = useState(false)
  const [progress, setProgress] = useState<any[]>([])
  const [providerNotes, setProviderNotes] = useState<string[]>([])

  useEffect(() => {
    // Load client progress and notes
    const clientProgress = getClientProgress('current_client')
    const notes = getProviderNotes('current_client')
    setProgress(clientProgress)
    setProviderNotes(notes)
  }, [])

  const handleStartExercise = (exerciseId: string) => {
    setSelectedExercise(exerciseId)
    setShowPoseAnalysis(true)
  }

  const calculateOverallProgress = () => {
    if (progress.length === 0) return 0
    const totalProgress = progress.reduce((sum, p) => sum + (p.completedSessions / p.totalSessions), 0)
    return Math.round((totalProgress / progress.length) * 100)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600">Ready to continue your rehabilitation journey?</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
            <div className="progress-bar mb-2">
              <div 
                className="progress-fill"
                style={{ width: `${calculateOverallProgress()}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{calculateOverallProgress()}% Complete</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Sessions This Week</h3>
            <p className="text-3xl font-bold text-blue-600">5</p>
            <p className="text-sm text-gray-600">Target: 6 sessions</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Next Appointment</h3>
            <p className="text-lg font-semibold">Jan 18, 2024</p>
            <p className="text-sm text-gray-600">2:00 PM with Dr. Smith</p>
          </div>
        </div>

        {/* Exercise List */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">My Exercise Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dummyExercises.map((exercise) => (
              <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-2">{exercise.name}</h4>
                <p className="text-gray-600 text-sm mb-3">{exercise.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">{exercise.duration} min</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    exercise.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    exercise.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {exercise.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => handleStartExercise(exercise.id)}
                  className="w-full btn btn-primary"
                >
                  Start Exercise
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pose Analysis */}
        {showPoseAnalysis && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Pose Analysis</h3>
              <button
                onClick={() => setShowPoseAnalysis(false)}
                className="btn btn-secondary"
              >
                Stop Analysis
              </button>
            </div>
            <PoseEstimation />
          </div>
        )}

        {/* Provider Notes */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Notes from Your Provider</h3>
          {providerNotes.length > 0 ? (
            <div className="space-y-2">
              {providerNotes.map((note, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <p className="text-gray-700">{note}</p>
                  <p className="text-xs text-gray-500 mt-1">Added recently</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No notes from your provider yet.</p>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ClientDashboard
