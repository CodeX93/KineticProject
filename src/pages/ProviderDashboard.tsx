
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import PoseEstimation from '../components/PoseEstimation'
import { dummyClients, dummyExercises, getProviderNotes, saveProviderNotes } from '../data/dummyData'

const ProviderDashboard: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [showPoseViewer, setShowPoseViewer] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [clientNotes, setClientNotes] = useState<string[]>([])
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])

  useEffect(() => {
    if (selectedClient) {
      const notes = getProviderNotes(selectedClient)
      setClientNotes(notes)
    }
  }, [selectedClient])

  const handleAddNote = () => {
    if (newNote.trim() && selectedClient) {
      const updatedNotes = [...clientNotes, newNote.trim()]
      setClientNotes(updatedNotes)
      saveProviderNotes(selectedClient, updatedNotes)
      setNewNote('')
    }
  }

  const handleAssignExercises = () => {
    if (selectedClient && selectedExercises.length > 0) {
      // In a real app, this would update the database
      alert(`Assigned ${selectedExercises.length} exercises to client`)
      setSelectedExercises([])
    }
  }

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Provider Dashboard</h2>
          <p className="text-gray-600">Manage your clients and monitor their progress</p>
        </div>

        {/* Client List */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">My Clients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dummyClients.map((client) => (
              <div 
                key={client.id} 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedClient === client.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedClient(client.id)}
              >
                <h4 className="font-semibold text-lg">{client.name}</h4>
                <p className="text-gray-600 text-sm">{client.email}</p>
                <p className="text-gray-600 text-sm">Condition: {client.condition}</p>
                <p className="text-gray-600 text-sm">Age: {client.age}</p>
                <p className="text-gray-500 text-xs mt-2">Last session: {client.lastSession}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedClient && (
          <>
            {/* Exercise Assignment */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Assign Exercises</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {dummyExercises.map((exercise) => (
                  <div 
                    key={exercise.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedExercises.includes(exercise.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleExerciseSelection(exercise.id)}
                  >
                    <h4 className="font-semibold">{exercise.name}</h4>
                    <p className="text-gray-600 text-sm">{exercise.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">{exercise.duration} min</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        exercise.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        exercise.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAssignExercises}
                disabled={selectedExercises.length === 0}
                className="btn btn-primary disabled:opacity-50"
              >
                Assign Selected Exercises ({selectedExercises.length})
              </button>
            </div>

            {/* Client Notes */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Client Notes</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note for this client..."
                    className="form-input flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    className="btn btn-primary"
                  >
                    Add Note
                  </button>
                </div>
                
                <div className="space-y-2">
                  {clientNotes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border">
                      <p className="text-gray-700">{note}</p>
                      <p className="text-xs text-gray-500 mt-1">Added by you</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Pose Viewer */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Client Pose Viewer</h3>
            <button
              onClick={() => setShowPoseViewer(!showPoseViewer)}
              className="btn btn-secondary"
            >
              {showPoseViewer ? 'Stop Viewer' : 'Start Pose Viewer'}
            </button>
          </div>
          {showPoseViewer && <PoseEstimation />}
        </div>
      </div>
    </Layout>
  )
}

export default ProviderDashboard
