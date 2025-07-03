
export interface Exercise {
  id: string
  name: string
  description: string
  duration: number // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  videoUrl?: string
  instructions: string[]
}

export interface ClientProgress {
  clientId: string
  exerciseId: string
  completedSessions: number
  totalSessions: number
  lastCompleted: string
  notes: string[]
}

export interface Client {
  id: string
  name: string
  email: string
  age: number
  condition: string
  assignedExercises: string[] // exercise IDs
  progress: ClientProgress[]
  lastSession: string
}

export const dummyExercises: Exercise[] = [
  {
    id: '1',
    name: 'Shoulder Circles',
    description: 'Gentle shoulder mobility exercise',
    duration: 5,
    difficulty: 'Easy',
    category: 'Shoulder Rehabilitation',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lift arms to shoulder height',
      'Make slow, controlled circles',
      'Repeat 10 times in each direction'
    ]
  },
  {
    id: '2',
    name: 'Wall Push-ups',
    description: 'Modified push-ups for upper body strength',
    duration: 8,
    difficulty: 'Medium',
    category: 'Upper Body Strengthening',
    instructions: [
      'Stand arm\'s length from wall',
      'Place palms against wall at shoulder height',
      'Slowly push body toward wall',
      'Push back to starting position',
      'Repeat 15 times'
    ]
  },
  {
    id: '3',
    name: 'Knee to Chest Stretch',
    description: 'Lower back flexibility exercise',
    duration: 3,
    difficulty: 'Easy',
    category: 'Back Rehabilitation',
    instructions: [
      'Lie on your back',
      'Bring one knee to chest',
      'Hold for 15-30 seconds',
      'Switch legs and repeat'
    ]
  }
]

export const dummyClients: Client[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    age: 45,
    condition: 'Lower Back Pain',
    assignedExercises: ['1', '3'],
    progress: [
      {
        clientId: '1',
        exerciseId: '1',
        completedSessions: 8,
        totalSessions: 10,
        lastCompleted: '2024-01-15',
        notes: ['Good form', 'Increasing range of motion']
      }
    ],
    lastSession: '2024-01-15'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    age: 32,
    condition: 'Shoulder Impingement',
    assignedExercises: ['1', '2'],
    progress: [
      {
        clientId: '2',
        exerciseId: '1',
        completedSessions: 12,
        totalSessions: 15,
        lastCompleted: '2024-01-14',
        notes: ['Excellent progress', 'Pain reduced significantly']
      }
    ],
    lastSession: '2024-01-14'
  }
]

export const getClientProgress = (clientId: string): ClientProgress[] => {
  const savedProgress = localStorage.getItem(`progress_${clientId}`)
  if (savedProgress) {
    return JSON.parse(savedProgress)
  }
  
  const client = dummyClients.find(c => c.id === clientId)
  return client?.progress || []
}

export const saveClientProgress = (clientId: string, progress: ClientProgress[]) => {
  localStorage.setItem(`progress_${clientId}`, JSON.stringify(progress))
}

export const getProviderNotes = (clientId: string): string[] => {
  const savedNotes = localStorage.getItem(`notes_${clientId}`)
  return savedNotes ? JSON.parse(savedNotes) : []
}

export const saveProviderNotes = (clientId: string, notes: string[]) => {
  localStorage.setItem(`notes_${clientId}`, JSON.stringify(notes))
}
