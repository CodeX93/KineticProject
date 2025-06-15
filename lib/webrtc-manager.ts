import { EventEmitter } from 'events';

interface PeerConfig {
  peerId: string;
  localStream: MediaStream;
  iceServers: RTCIceServer[];
  onTrack?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'peer-status';
  data: any;
  from?: string;
  to?: string;
}

export class WebRTCManager extends EventEmitter {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private ws: WebSocket | null = null;
  private roomId: string;
  private localStream: MediaStream | null = null;
  private localPeerId: string;

  constructor(roomId: string, localPeerId: string) {
    super();
    this.roomId = roomId;
    this.localPeerId = localPeerId;
  }

  public async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = async (event) => {
          const message = JSON.parse(event.data) as SignalingMessage;
          await this.handleSignalingMessage(message);
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.emit('disconnected');
          this.cleanup();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  public async initializePeerConnection(config: PeerConfig): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({ iceServers: config.iceServers });
    
    // Add local tracks
    config.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, config.localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          data: event.candidate,
          from: this.localPeerId,
          to: config.peerId
        });
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      if (config.onTrack) {
        config.onTrack(event.streams[0]);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      if (config.onConnectionStateChange) {
        config.onConnectionStateChange(peerConnection.connectionState);
      }
    };

    // Create data channel
    const dataChannel = peerConnection.createDataChannel('messages');
    this.setupDataChannel(dataChannel, config.peerId);
    
    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, config.peerId);
      if (config.onDataChannel) {
        config.onDataChannel(event.channel);
      }
    };

    this.peerConnections.set(config.peerId, peerConnection);
    return peerConnection;
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => {
      this.dataChannels.set(peerId, channel);
      this.emit('datachannel:open', { peerId, channel });
    };

    channel.onmessage = (event) => {
      this.emit('datachannel:message', { peerId, data: event.data });
    };

    channel.onclose = () => {
      this.dataChannels.delete(peerId);
      this.emit('datachannel:close', { peerId });
    };

    channel.onerror = (error) => {
      this.emit('datachannel:error', { peerId, error });
    };
  }

  public async createOffer(peerId: string): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return;

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        data: offer,
        from: this.localPeerId,
        to: peerId
      });
    } catch (err) {
      this.emit('error', err);
    }
  }

  public async handleRemoteOffer(peerId: string, offer: RTCSessionDescription): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: 'answer',
        data: answer,
        from: this.localPeerId,
        to: peerId
      });
    } catch (err) {
      this.emit('error', err);
    }
  }

  public async handleRemoteAnswer(peerId: string, answer: RTCSessionDescription): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      this.emit('error', err);
    }
  }

  public async handleRemoteIceCandidate(peerId: string, candidate: RTCIceCandidate): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) return;

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      this.emit('error', err);
    }
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    switch (message.type) {
      case 'offer':
        await this.handleRemoteOffer(message.from!, message.data);
        break;
      case 'answer':
        await this.handleRemoteAnswer(message.from!, message.data);
        break;
      case 'ice-candidate':
        await this.handleRemoteIceCandidate(message.from!, message.data);
        break;
      case 'peer-status':
        this.emit('peer:status', { peerId: message.from, status: message.data });
        break;
    }
  }

  private sendSignalingMessage(message: SignalingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        roomId: this.roomId,
      }));
    }
  }

  public sendToPeer(peerId: string, data: any): void {
    const channel = this.dataChannels.get(peerId);
    if (channel?.readyState === 'open') {
      channel.send(JSON.stringify(data));
    }
  }

  public updateMediaStream(stream: MediaStream): void {
    this.localStream = stream;
    
    // Update all peer connections with the new stream
    for (const [peerId, pc] of this.peerConnections) {
      const senders = pc.getSenders();
      
      stream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          pc.addTrack(track, stream);
        }
      });
    }
  }

  public cleanup(): void {
    // Close all peer connections
    for (const [peerId, pc] of this.peerConnections) {
      pc.close();
      this.peerConnections.delete(peerId);
    }

    // Close all data channels
    for (const [peerId, channel] of this.dataChannels) {
      channel.close();
      this.dataChannels.delete(peerId);
    }

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Stop local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}

export default WebRTCManager;
