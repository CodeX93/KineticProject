
import React, { useRef, useEffect, useState } from 'react'
import { usePose } from '../contexts/PoseContext'

const PoseEstimation: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState('')
  const [poseData, setPoseData] = useState<any>(null)
  const { currentEngine, setIsDetecting } = usePose()

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsActive(true)
        setIsDetecting(true)
        startPoseDetection()
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setIsDetecting(false)
  }

  const startPoseDetection = () => {
    // Simulate pose detection based on selected engine
    const detectPose = () => {
      if (!isActive) return

      // Simulate pose detection results
      const simulatedPose = {
        engine: currentEngine,
        keypoints: generateSimulatedKeypoints(),
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        timestamp: Date.now()
      }

      setPoseData(simulatedPose)
      drawPose(simulatedPose)

      // Continue detection loop
      if (isActive) {
        setTimeout(detectPose, 100) // 10 FPS
      }
    }

    detectPose()
  }

  const generateSimulatedKeypoints = () => {
    // Generate simulated keypoints for demo purposes
    const keypoints = []
    const width = 640
    const height = 480
    
    // Simulate major body points
    const bodyParts = [
      'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
      'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
      'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
    ]

    bodyParts.forEach(part => {
      keypoints.push({
        name: part,
        x: Math.random() * width,
        y: Math.random() * height,
        confidence: Math.random() * 0.3 + 0.7
      })
    })

    return keypoints
  }

  const drawPose = (pose: any) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw keypoints
    pose.keypoints.forEach((keypoint: any) => {
      if (keypoint.confidence > 0.5) {
        ctx.beginPath()
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI)
        ctx.fillStyle = currentEngine === 'mediapipe' ? '#00ff00' : '#ff0000'
        ctx.fill()
        
        // Label
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px Arial'
        ctx.fillText(keypoint.name, keypoint.x + 8, keypoint.y - 8)
      }
    })

    // Draw connections (simplified)
    ctx.strokeStyle = currentEngine === 'mediapipe' ? '#00ff00' : '#ff0000'
    ctx.lineWidth = 2
    
    // Example: connect shoulders to elbows to wrists
    const connections = [
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'right_shoulder'],
      ['left_hip', 'right_hip'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip']
    ]

    connections.forEach(([start, end]) => {
      const startPoint = pose.keypoints.find((kp: any) => kp.name === start)
      const endPoint = pose.keypoints.find((kp: any) => kp.name === end)
      
      if (startPoint && endPoint && startPoint.confidence > 0.5 && endPoint.confidence > 0.5) {
        ctx.beginPath()
        ctx.moveTo(startPoint.x, startPoint.y)
        ctx.lineTo(endPoint.x, endPoint.y)
        ctx.stroke()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">
          Pose Detection ({currentEngine === 'mediapipe' ? 'MediaPipe' : 'OpenPose'})
        </h4>
        <div className="flex space-x-2">
          <button
            onClick={isActive ? stopCamera : startCamera}
            className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
          >
            {isActive ? 'Stop' : 'Start'} Camera
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="relative inline-block">
        <video
          ref={videoRef}
          width={640}
          height={480}
          className="rounded-lg border"
          style={{ display: isActive ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="pose-canvas rounded-lg"
          style={{ display: isActive ? 'block' : 'none' }}
        />
        {!isActive && (
          <div className="w-[640px] h-[480px] bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Camera not active</p>
          </div>
        )}
      </div>

      {poseData && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-semibold mb-2">Pose Data</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Engine:</strong> {poseData.engine}</p>
              <p><strong>Confidence:</strong> {(poseData.confidence * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p><strong>Keypoints Detected:</strong> {poseData.keypoints.length}</p>
              <p><strong>High Confidence:</strong> {poseData.keypoints.filter((kp: any) => kp.confidence > 0.7).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PoseEstimation
