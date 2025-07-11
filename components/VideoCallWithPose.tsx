'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Activity,
  Timer,
  Users,
  Download,
  AlertTriangle,
  Clock,
  Wifi,
  Info,
  Copy,
  Check,
} from "lucide-react"
import Peer from 'peerjs'

interface PoseKeypoint {
  x: number
  y: number
  confidence: number
}

interface PoseData {
  keypoints: PoseKeypoint[]
  score: number
}

interface VideoCallState {
  isConnected: boolean
  isConnecting: boolean
  isMuted: boolean
  isVideoOff: boolean
  callDuration: number
  connectionStatus: string
  roomId: string
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  peerId: string | null
  remotePeerId: string | null
}

interface PoseDetectionState {
  isEnabled: boolean
  isInitializing: boolean
  fps: number
  lastFrameTime: number
  poseData: PoseData | null
  error: string | null
}

export function VideoCallWithPose() {
  const [videoCallState, setVideoCallState] = useState<VideoCallState>({
    isConnected: false,
    isConnecting: false,
    isMuted: false,
    isVideoOff: false,
    callDuration: 0,
    connectionStatus: "Ready to start",
    roomId: "",
    localStream: null,
    remoteStream: null,
    peerId: null,
    remotePeerId: null,
  })

  const [poseState, setPoseState] = useState<PoseDetectionState>({
    isEnabled: false,
    isInitializing: false,
    fps: 0,
    lastFrameTime: 0,
    poseData: null,
    error: null,
  })

  const [copied, setCopied] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const poseCanvasRef = useRef<HTMLCanvasElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const poseDetectionRef = useRef<any>(null)

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const initializePoseDetection = async () => {
    try {
      setPoseState(prev => ({ ...prev, isInitializing: true, error: null }))
      
      const { Pose } = await import('@mediapipe/pose')
      
      if (!localVideoRef.current) {
        throw new Error("Local video element not found")
      }

      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
      })

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      pose.onResults(onPoseResults)
      poseDetectionRef.current = pose
      
      setPoseState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        isEnabled: true 
      }))
      
      startPoseDetection()
    } catch (error) {
      console.error('Error initializing pose detection:', error)
      setPoseState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize pose detection' 
      }))
    }
  }

  const onPoseResults = useCallback((results: any) => {
    if (!poseCanvasRef.current || !localVideoRef.current) return

    const canvas = poseCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (results.poseLandmarks) {
      drawPoseLandmarks(ctx, results.poseLandmarks, canvas.width, canvas.height)
    }

    const now = performance.now()
    const deltaTime = now - poseState.lastFrameTime
    const fps = deltaTime > 0 ? 1000 / deltaTime : 0
    
    setPoseState(prev => ({
      ...prev,
      fps: Math.round(fps),
      lastFrameTime: now,
      poseData: {
        keypoints: results.poseLandmarks?.map((landmark: any) => ({
          x: landmark.x * canvas.width,
          y: landmark.y * canvas.height,
          confidence: landmark.visibility || 0
        })) || [],
        score: results.poseLandmarks ? 1 : 0
      }
    }))
  }, [poseState.lastFrameTime])

  const drawPoseLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    // Define pose connections (skeleton)
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
      [11, 23], [12, 24], [23, 24], // Torso
      [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
      [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
      [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22], // Hands
      [27, 31], [28, 32], // Feet
    ]

    // Draw connections (skeleton lines)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]
      if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        ctx.beginPath()
        ctx.moveTo(startPoint.x * width, startPoint.y * height)
        ctx.lineTo(endPoint.x * width, endPoint.y * height)
        ctx.stroke()
      }
    })

    // Draw keypoints (joints)
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        // Draw keypoint circle
        ctx.fillStyle = '#ff0000'
        ctx.beginPath()
        ctx.arc(landmark.x * width, landmark.y * height, 6, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw keypoint border
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Draw keypoint number for debugging (optional)
        if (index % 2 === 0) { // Only show every other number to avoid clutter
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 12px Arial'
          ctx.fillText(index.toString(), landmark.x * width + 10, landmark.y * height - 10)
        }
      }
    })
  }

  const startPoseDetection = () => {
    if (!poseDetectionRef.current || !localVideoRef.current) return

    const detectPose = async () => {
      if (poseState.isEnabled && localVideoRef.current) {
        try {
          await poseDetectionRef.current.send({ image: localVideoRef.current })
        } catch (error) {
          console.error('Error detecting pose:', error)
        }
      }
      
      if (poseState.isEnabled) {
        animationFrameRef.current = requestAnimationFrame(detectPose)
      }
    }

    detectPose()
  }

  const stopPoseDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (poseDetectionRef.current) {
      poseDetectionRef.current.close()
      poseDetectionRef.current = null
    }

    setPoseState(prev => ({ ...prev, isEnabled: false }))
  }

  const initializePeer = () => {
    const peer = new Peer({
      host: 'peerjs-server.herokuapp.com',
      port: 443,
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    })

    peer.on('open', (id) => {
      setVideoCallState(prev => ({ 
        ...prev, 
        peerId: id,
        connectionStatus: "Ready to connect" 
      }))
    })

    peer.on('call', (incomingCall) => {
      callRef.current = incomingCall
      setVideoCallState(prev => ({ 
        ...prev, 
        remotePeerId: incomingCall.peer,
        connectionStatus: "Incoming call..." 
      }))
      
      // Answer the call
      incomingCall.answer(videoCallState.localStream!)
      
      incomingCall.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setVideoCallState(prev => ({ 
          ...prev, 
          remoteStream,
          isConnected: true,
          connectionStatus: "Connected" 
        }))
      })
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      setVideoCallState(prev => ({ 
        ...prev, 
        connectionStatus: "Connection error" 
      }))
    })

    peerRef.current = peer
  }

  const startVideoCall = async () => {
    try {
      setVideoCallState(prev => ({ ...prev, isConnecting: true, connectionStatus: "Starting call..." }))
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setVideoCallState(prev => ({
        ...prev,
        localStream: stream,
        isConnecting: false,
        connectionStatus: "Local video ready"
      }))

      initializePeer()
      
    } catch (error) {
      console.error('Error starting video call:', error)
      setVideoCallState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: "Failed to start call"
      }))
    }
  }

  const joinCall = async () => {
    if (!videoCallState.roomId.trim()) {
      alert("Please enter a room ID")
      return
    }

    try {
      setVideoCallState(prev => ({ ...prev, isConnecting: true, connectionStatus: "Joining call..." }))
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setVideoCallState(prev => ({
        ...prev,
        localStream: stream,
        isConnecting: false,
        connectionStatus: "Local video ready"
      }))

      initializePeer()
      
      // Connect to the specified peer
      setTimeout(() => {
        if (peerRef.current) {
          const call = peerRef.current.call(videoCallState.roomId, stream)
          callRef.current = call
          
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream
            }
            setVideoCallState(prev => ({ 
              ...prev, 
              remoteStream,
              isConnected: true,
              connectionStatus: "Connected" 
            }))
          })

          call.on('close', () => {
            setVideoCallState(prev => ({ 
              ...prev, 
              isConnected: false,
              connectionStatus: "Call ended" 
            }))
          })
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error joining call:', error)
      setVideoCallState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: "Failed to join call"
      }))
    }
  }

  const endCall = () => {
    stopPoseDetection()

    if (callRef.current) {
      callRef.current.close()
      callRef.current = null
    }

    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    if (videoCallState.localStream) {
      videoCallState.localStream.getTracks().forEach(track => track.stop())
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    setVideoCallState({
      isConnected: false,
      isConnecting: false,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
      connectionStatus: "Call ended",
      roomId: videoCallState.roomId,
      localStream: null,
      remoteStream: null,
      peerId: null,
      remotePeerId: null,
    })
  }

  const toggleMute = () => {
    if (videoCallState.localStream) {
      const audioTrack = videoCallState.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setVideoCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }))
      }
    }
  }

  const toggleVideo = () => {
    if (videoCallState.localStream) {
      const videoTrack = videoCallState.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setVideoCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }))
      }
    }
  }

  const togglePoseDetection = async () => {
    if (poseState.isEnabled) {
      stopPoseDetection()
    } else {
      await initializePoseDetection()
    }
  }

  useEffect(() => {
    if (videoCallState.isConnected) {
      const interval = setInterval(() => {
        setVideoCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [videoCallState.isConnected])

  useEffect(() => {
    return () => {
      stopPoseDetection()
      endCall()
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Call with Pose Detection
          </h1>
          <p className="text-gray-600">
            Real-time video calling with AI-powered pose detection overlay using PeerJS
          </p>
        </div>

        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant={videoCallState.isConnected ? "default" : "secondary"}>
                    {videoCallState.connectionStatus}
                  </Badge>
                  {videoCallState.isConnected && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDuration(videoCallState.callDuration)}
                      </span>
                    </div>
                  )}
                  {poseState.isEnabled && (
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        {poseState.fps} FPS
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {poseState.isInitializing && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-600">Initializing Pose Detection...</span>
                    </div>
                  )}
                  {poseState.error && (
                    <Alert className="w-auto">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{poseState.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Local Video</span>
                  {poseState.isEnabled && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Activity className="h-3 w-3 mr-1" />
                      Pose Detection Active
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 lg:h-80 bg-gray-900 rounded-lg"
                  />
                  <canvas
                    ref={poseCanvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    width={640}
                    height={480}
                  />
                  {!videoCallState.localStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No video feed</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Remote Video</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 lg:h-80 bg-gray-900 rounded-lg"
                />
                {!videoCallState.remoteStream && (
                  <div className="flex items-center justify-center h-64 lg:h-80 bg-gray-900 rounded-lg">
                    <div className="text-center text-white">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Waiting for remote participant...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Call Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Room ID / Peer ID</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="roomId"
                      value={videoCallState.roomId}
                      onChange={(e) => setVideoCallState(prev => ({ ...prev, roomId: e.target.value }))}
                      placeholder="Enter peer ID to join"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVideoCallState(prev => ({ ...prev, roomId: generateRoomId() }))}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                {videoCallState.peerId && (
                  <div className="space-y-2">
                    <Label>Your Peer ID</Label>
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                      <code className="text-sm flex-1">{videoCallState.peerId}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(videoCallState.peerId!)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {!videoCallState.isConnected ? (
                    <div className="space-y-2">
                      <Button
                        onClick={startVideoCall}
                        disabled={videoCallState.isConnecting}
                        className="w-full"
                      >
                        {videoCallState.isConnecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Starting Call...
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4 mr-2" />
                            Start Video Call
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={joinCall}
                        disabled={videoCallState.isConnecting || !videoCallState.roomId.trim()}
                        className="w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Join Call
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={endCall}
                      className="w-full"
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Call
                    </Button>
                  )}
                </div>

                {videoCallState.isConnected && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={toggleMute}
                      className="w-full"
                    >
                      {videoCallState.isMuted ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Mute
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={toggleVideo}
                      className="w-full"
                    >
                      {videoCallState.isVideoOff ? (
                        <>
                          <VideoOff className="h-4 w-4 mr-2" />
                          Turn On Video
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Turn Off Video
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Pose Detection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pose-detection">Enable Pose Detection</Label>
                  <Switch
                    id="pose-detection"
                    checked={poseState.isEnabled}
                    onCheckedChange={togglePoseDetection}
                    disabled={!videoCallState.isConnected || poseState.isInitializing}
                  />
                </div>

                {poseState.isEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>FPS:</span>
                      <span className="font-mono">{poseState.fps}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Keypoints Detected:</span>
                      <span className="font-mono">{poseState.poseData?.keypoints.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Confidence:</span>
                      <span className="font-mono">
                        {poseState.poseData ? Math.round(poseState.poseData.score * 100) : 0}%
                      </span>
                    </div>
                  </div>
                )}

                {poseState.isEnabled && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (poseCanvasRef.current) {
                        const link = document.createElement('a')
                        link.download = `pose-capture-${Date.now()}.png`
                        link.href = poseCanvasRef.current.toDataURL()
                        link.click()
                      }
                    }}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Capture Pose
                  </Button>
                )}
              </CardContent>
            </Card>

            {videoCallState.isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wifi className="h-5 w-5" />
                    <span>Connection Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Your ID:</span>
                    <span className="font-mono text-xs">{videoCallState.peerId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Remote ID:</span>
                    <span className="font-mono text-xs">{videoCallState.remotePeerId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Local Stream:</span>
                    <Badge variant={videoCallState.localStream ? "default" : "secondary"}>
                      {videoCallState.localStream ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Remote Stream:</span>
                    <Badge variant={videoCallState.remoteStream ? "default" : "secondary"}>
                      {videoCallState.remoteStream ? "Active" : "Waiting"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>How to Use</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Video Call Setup:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Click "Start Video Call" to get your Peer ID</li>
                  <li>Share your Peer ID with another person</li>
                  <li>They enter your ID and click "Join Call"</li>
                  <li>Both parties will connect automatically</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Pose Detection:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Start a video call first</li>
                  <li>Toggle "Enable Pose Detection"</li>
                  <li>Stand in front of your camera</li>
                  <li>Watch real-time pose overlay</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 