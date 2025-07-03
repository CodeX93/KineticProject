
"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, ScreenShare, Maximize2, Minimize2, Bot, Activity, X, Settings, Volume2, VolumeX, Camera, CameraOff, Monitor, Users, Heart, Zap, Star, Award, Shield, Wifi, Phone, MonitorOff, BarChart3, Sparkles, Record, StopCircle, Brain } from "lucide-react"

interface VideoCallProps {
  therapistName: string
  therapistImage: string
  onEndCall: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
  isAIAgent?: boolean
  sessionId: string
  userId: string
  userType: 'doctor' | 'patient'
  userName: string
}

export function VideoCall({
  therapistName,
  therapistImage,
  onEndCall,
  isMinimized = false,
  onToggleMinimize,
  isAIAgent = false,
  sessionId,
}: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isConnecting, setIsConnecting] = useState(true)
  const [aiResponse, setAiResponse] = useState("")
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Connecting...")
  
  // Premium features state
  const [noiseCancellation, setNoiseCancellation] = useState(true)
  const [beautyFilter, setBeautyFilter] = useState(false)
  const [virtualBackground, setVirtualBackground] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [videoQuality, setVideoQuality] = useState('HD')
  const [networkQuality, setNetworkQuality] = useState(5)
  const [participantCount, setParticipantCount] = useState(2)
  const [sessionRating, setSessionRating] = useState(0)
  const [showAnalytics, setShowAnalytics] = useState(false)
  
  // WebRTC and connection refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Initialize connection and AI agent
  useEffect(() => {
    initializeVideoCall()
    return () => {
      cleanup()
    }
  }, [])

  const initializeVideoCall = async () => {
    try {
      setConnectionStatus("Starting session...")
      await startLocalVideo()
      setIsConnecting(false)
      setConnectionStatus("Connected")
    } catch (error) {
      console.error('Failed to initialize video call:', error)
      setConnectionStatus("Connection failed")
      setIsConnecting(false)
    }
  }

  const cleanup = async () => {
    try {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => {
          track.stop()
        })
      }
      
      if (wsRef.current) {
        wsRef.current.close()
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  // Update call duration
  useEffect(() => {
    if (!isConnecting) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isConnecting])
  
  // Audio level monitoring simulation
  useEffect(() => {
    if (!isMuted && !isConnecting) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isMuted, isConnecting])

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Start local video (user's camera)
  const startLocalVideo = async () => {
    try {
      if (localVideoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true
        })
        
        localVideoRef.current.srcObject = stream
        setConnectionStatus("Video ready")
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setIsVideoOff(true)
      setConnectionStatus("Camera access failed")
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted
      })
    }
  }

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff)
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff
      })
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await startLocalVideo()
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      }
      setIsScreenSharing(!isScreenSharing)
    } catch (err) {
      console.error("Error sharing screen:", err)
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden z-50 w-72">
        <div className="p-2 bg-[#014585] text-white flex justify-between items-center">
          <span className="text-sm font-medium">Call with {therapistName}</span>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-blue-700"
              onClick={onToggleMinimize}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-red-600" onClick={onEndCall}>
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative h-40 bg-gray-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            poster={therapistImage}
          />
          <div className="absolute bottom-2 right-2 w-20 h-20 bg-gray-800 rounded overflow-hidden border border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <Video className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {formatDuration(callDuration)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="bg-white h-full w-full flex flex-col">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/30">
                {isAIAgent ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                ) : (
                  <img
                    src={therapistImage || "/placeholder.svg"}
                    alt={therapistName}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">{isAIAgent ? 'AI Therapist Pro' : therapistName}</h3>
              </div>
              <div className="flex items-center space-x-3 text-sm opacity-90">
                <span>{isAIAgent ? 'Premium AI-Powered Session' : 'Certified Physical Therapist'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-lg font-mono font-bold">{formatDuration(callDuration)}</div>
              <div className="text-xs opacity-75">{videoQuality} • {isRecording ? 'REC' : 'LIVE'}</div>
            </div>
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-blue-700/50 transition-all duration-200"
                onClick={onToggleMinimize}
              >
                <Minimize2 className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-red-600/50 transition-all duration-200"
              onClick={onEndCall}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex-1 overflow-hidden">
          {isConnecting ? (
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
              <div className="relative mb-8">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-500 to-purple-500 shadow-2xl backdrop-blur-sm">
                    {isAIAgent ? (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <Bot className="h-20 w-20 text-white" />
                      </div>
                    ) : (
                      <img
                        src={therapistImage || "/placeholder.svg"}
                        alt={therapistName}
                        width={160}
                        height={160}
                        className="object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center backdrop-blur-sm bg-black/20 rounded-2xl p-6">
                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {isAIAgent ? 'Connecting to Premium AI Therapist' : `Connecting to ${therapistName}`}
                </h3>
                <p className="text-gray-300 mb-4">{connectionStatus}</p>
              </div>
            </div>
          ) : (
            <div className="relative h-full z-10">
              <div className="absolute inset-0">
                {isAIAgent ? (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative">
                    <div className="text-center text-white relative z-10">
                      <div className="relative mb-8">
                        <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-400 to-purple-400 shadow-2xl mx-auto backdrop-blur-sm">
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <Bot className="h-28 w-28 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-6">
                        <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          {therapistName}
                        </h3>
                        <p className="text-blue-200 mb-2">Premium AI Therapy Companion</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      poster={therapistImage}
                    />
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-6 right-6 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Video className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          
          <div className="relative p-8">
            <div className="flex items-center justify-center space-x-8">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              </Button>
              
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-7 w-7" /> : <Video className="h-7 w-7" />}
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={toggleScreenShare}
              >
                <ScreenShare className="h-7 w-7" />
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                className="h-16 w-16 rounded-full"
              >
                <MessageSquare className="h-7 w-7" />
              </Button>
              
              <Button
                variant="destructive"
                size="lg"
                className="h-20 w-20 rounded-full"
                onClick={onEndCall}
              >
                <PhoneOff className="h-9 w-9" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
