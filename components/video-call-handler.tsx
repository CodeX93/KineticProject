'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { MediaStreamWithTracks, MediaTrack } from '@/types/media';

interface VideoCallProps {
  roomId: string;
  userId: string;
  userType: 'doctor' | 'patient';
  userName: string;
  onCallEnd?: () => void;
}

interface MediaStatus {
  video: boolean;
  audio: boolean;
  screen: boolean;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  connectionQuality?: 'good' | 'fair' | 'poor';
}

interface WebSocketMessage {
  type: 'room_info' | 'peer_joined' | 'peer_left' | 'offer' | 'answer' | 'ice-candidate' | 'peer_status_changed';
  peer_id?: string;
  from_peer?: string;
  targetPeer?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  status?: {
    video?: boolean;
    audio?: boolean;
    screen?: boolean;
  };
  peers?: Record<string, any>;
}

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastError?: string;
}

// Helper functions for type-safe operations
const peerOperations = {
  forEachPeer: (peers: Record<string, PeerConnection>, callback: (peer: PeerConnection) => void) => {
    (Object.values(peers) as PeerConnection[]).forEach(callback);
  },
  replacePeerTrack: (peer: PeerConnection, track: MediaStreamTrack) => {
    const sender = peer.connection.getSenders().find((s: RTCRtpSender) => 
      s.track?.kind === track.kind
    );
    if (sender) {
      sender.replaceTrack(track);
    }
  }
} as const;

// ICE server configuration
const iceServers: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Connection state update function type
type ConnectionStateUpdater = (prev: ConnectionState) => ConnectionState;
type MediaStatusUpdater = (prev: MediaStatus) => MediaStatus;

export const VideoCallHandler = ({ roomId, userId, userType, userName, onCallEnd }: VideoCallProps) => {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStreamWithTracks | null>(null);
  const peerConnectionsRef = useRef<Record<string, PeerConnection>>({});
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
  });
  
  const [mediaStatus, setMediaStatus] = useState<MediaStatus>({
    video: true,
    audio: true,
    screen: false,
  });

  // Type-safe state update functions
  const updateConnectionState = (updater: ConnectionStateUpdater) => {
    setConnectionState(updater);
  };

  const updateMediaStatus = (updater: MediaStatusUpdater) => {
    setMediaStatus(updater);
  };

  // Peer operation functions with proper typing
  const updatePeerStatus = (peerId: string, status: 'good' | 'fair' | 'poor') => {
    const peer = peerConnectionsRef.current[peerId];
    if (peer) {
      peer.connectionQuality = status;
    }
  };

  const replaceVideoTrack = (track: MediaStreamTrack) => {
    peerOperations.forEachPeer(peerConnectionsRef.current, (peer) => {
      const sender = peer.connection.getSenders().find((s: RTCRtpSender) => 
        s.track?.kind === 'video'
      );
      if (sender) {
        sender.replaceTrack(track);
      }
    });
  };

  useEffect(() => {
    initializeCall();
    return () => cleanupCall();
  }, [roomId]);

  const initializeCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      }) as MediaStreamWithTracks;
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to signaling server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/video/ws/${roomId}?user_id=${userId}&user_type=${userType}&user_name=${userName}`;
      
      webSocketRef.current = new WebSocket(wsUrl);
      webSocketRef.current.onopen = handleWebSocketOpen;
      webSocketRef.current.onmessage = handleWebSocketMessage;
      webSocketRef.current.onclose = handleWebSocketClose;
      webSocketRef.current.onerror = handleWebSocketError;

    } catch (err) {
      console.error('Error initializing call:', err);
      onCallEnd?.();
    }
  };

  const cleanupCall = () => {
    // Stop local stream
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks() as MediaTrack[];
      tracks.forEach((track: MediaTrack) => track.stop());
    }

    // Close peer connections
    peerOperations.forEachPeer(peerConnectionsRef.current, peer => {
      peer.connection.close();
      peer.dataChannel?.close();
    });

    // Clear timeout if any
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Close WebSocket
    webSocketRef.current?.close();
  };

  // WebSocket event handlers with proper types
  const handleWebSocketOpen = () => {
    updateConnectionState(prev => ({
      ...prev,
      isConnected: true,
      isReconnecting: false,
      reconnectAttempts: 0,
    }));
  };

  const handleWebSocketMessage = async (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as WebSocketMessage;
    switch (data.type) {
      case 'room_info':
        handleRoomInfo(data);
        break;
      case 'peer_joined':
        handlePeerJoined(data);
        break;
      case 'peer_left':
        handlePeerLeft(data);
        break;
      case 'offer':
        handleOffer(data);
        break;
      case 'answer':
        handleAnswer(data);
        break;
      case 'ice-candidate':
        handleIceCandidate(data);
        break;
      case 'peer_status_changed':
        handlePeerStatusChanged(data);
        break;
    }
  };

  const handleWebSocketClose = () => {
    updateConnectionState(prev => ({
      ...prev,
      isConnected: false,
    }));
    onCallEnd?.();
  };

  const handleWebSocketError = (error: Event) => {
    updateConnectionState(prev => ({
      ...prev,
      lastError: 'WebSocket connection error',
    }));
    console.error('WebSocket error:', error);
  };

  const createPeerConnection = (peerId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(iceServers);

    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks() as MediaTrack[];
      tracks.forEach((track: MediaTrack) => {
        if (localStreamRef.current) {
          peerConnection.addTrack(track, localStreamRef.current);
        }
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendWebSocketMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetPeer: peerId,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const currentPeer = peerConnectionsRef.current[peerId];
      if (currentPeer) {
        switch (peerConnection.connectionState as RTCPeerConnectionState) {
          case 'connected':
            currentPeer.connectionQuality = 'good';
            break;
          case 'disconnected':
          case 'failed':
            currentPeer.connectionQuality = 'poor';
            break;
          case 'new':
          case 'connecting':
            currentPeer.connectionQuality = 'fair';
            break;
        }
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Create data channel
    const dataChannel = peerConnection.createDataChannel('chat');
    dataChannel.onmessage = handleDataChannelMessage;

    peerConnectionsRef.current[peerId] = { connection: peerConnection, dataChannel };
    return peerConnection;
  };

  const handleRoomInfo = (data: WebSocketMessage) => {
    if (data.peers) {
      Object.entries(data.peers).forEach(([peerId, peerInfo]) => {
        if (peerId !== data.peer_id) {
          createPeerConnection(peerId);
        }
      });
    }
  };

  const handlePeerJoined = async (data: WebSocketMessage) => {
    if (data.peer_id) {
      const peerId = data.peer_id;
      const peerConnection = createPeerConnection(peerId);

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      sendWebSocketMessage({
        type: 'offer',
        offer: offer,
        targetPeer: peerId,
      });
    }
  };

  const handlePeerLeft = (data: WebSocketMessage) => {
    if (data.peer_id) {
      peerConnectionsRef.current[data.peer_id]?.connection.close();
      delete peerConnectionsRef.current[data.peer_id];

      if (remoteVideoRef.current?.srcObject) {
        const tracks = (remoteVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  const handleOffer = async (data: WebSocketMessage) => {
    if (data.from_peer && data.offer) {
      const peerId = data.from_peer;
      const peerConnection = createPeerConnection(peerId);

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      sendWebSocketMessage({
        type: 'answer',
        answer: answer,
        targetPeer: peerId,
      });
    }
  };

  const handleAnswer = async (data: WebSocketMessage) => {
    if (data.from_peer && data.answer) {
      const peerConnection = peerConnectionsRef.current[data.from_peer]?.connection;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    }
  };

  const handleIceCandidate = async (data: WebSocketMessage) => {
    if (data.from_peer && data.candidate) {
      const peerConnection = peerConnectionsRef.current[data.from_peer]?.connection;
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  };

  const handlePeerStatusChanged = (data: WebSocketMessage) => {
    if (data.peer_id && data.status) {
      // Update UI based on peer's media status
      console.log(`Peer ${data.peer_id} status changed:`, data.status);
    }
  };

  const handleDataChannelMessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    // Handle chat messages or other data channel communications
    console.log('Received data channel message:', data);
  };

  const sendWebSocketMessage = (message: Partial<WebSocketMessage>) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0] as MediaTrack;
      videoTrack.enabled = !videoTrack.enabled;
      
      updateMediaStatus(prev => ({
        ...prev,
        video: videoTrack.enabled,
      }));

      sendWebSocketMessage({
        type: 'peer_status_changed',
        status: { video: videoTrack.enabled },
      });
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0] as MediaTrack;
      audioTrack.enabled = !audioTrack.enabled;
      
      updateMediaStatus(prev => ({
        ...prev,
        audio: audioTrack.enabled,
      }));

      sendWebSocketMessage({
        type: 'peer_status_changed',
        status: { audio: audioTrack.enabled },
      });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!mediaStatus.screen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        }) as MediaStreamWithTracks;

        const screenVideoTrack = screenStream.getVideoTracks()[0] as MediaTrack;
        peerOperations.forEachPeer(peerConnectionsRef.current, peer => {
          peerOperations.replacePeerTrack(peer, screenVideoTrack);
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenVideoTrack.onended = () => {
          void toggleScreenShare();
        };

      } else {
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0] as MediaTrack;
          peerOperations.forEachPeer(peerConnectionsRef.current, peer => {
            peerOperations.replacePeerTrack(peer, videoTrack);
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }
      }

      updateMediaStatus(prev => ({
        ...prev,
        screen: !prev.screen,
      }));

      sendWebSocketMessage({
        type: 'peer_status_changed',
        status: { screen: !mediaStatus.screen },
      });

    } catch (err) {
      console.error('Error toggling screen share:', err);
    }
  };

  return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`local-video ${mediaStatus.video ? '' : 'video-off'}`}
          />
          {!mediaStatus.video && (
            <div className="video-off-indicator">Camera Off</div>
          )}
        </div>
        <div className="remote-video-container">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        </div>
      </div>

      <div className="controls-container">
        <button
          onClick={toggleVideo}
          className={`control-button ${mediaStatus.video ? 'active' : ''}`}
        >
          {mediaStatus.video ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
        <button
          onClick={toggleAudio}
          className={`control-button ${mediaStatus.audio ? 'active' : ''}`}
        >
          {mediaStatus.audio ? 'Mute' : 'Unmute'}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`control-button ${mediaStatus.screen ? 'active' : ''}`}
        >
          {mediaStatus.screen ? 'Stop Sharing' : 'Share Screen'}
        </button>
        <button onClick={onCallEnd} className="control-button end-call">
          End Call
        </button>
      </div>

      <style jsx>{`
        .video-call-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .video-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .local-video-container,
        .remote-video-container {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          background: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }

        .local-video,
        .remote-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-off-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          background: rgba(0, 0, 0, 0.5);
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }

        .controls-container {
          display: flex;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.8);
        }

        .control-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background: #2c2c2c;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .control-button:hover {
          background: #3c3c3c;
        }

        .control-button.active {
          background: #4c4c4c;
        }

        .control-button.end-call {
          background: #dc3545;
        }

        .control-button.end-call:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
};

export default VideoCallHandler;
