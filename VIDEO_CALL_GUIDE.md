# Video Call with Pose Detection Guide

## Overview

This feature combines real-time video calling with AI-powered pose detection using WebRTC (PeerJS) and MediaPipe Pose. Users can have video conversations while simultaneously analyzing their body posture and movements in real-time.

## Features

### 🎥 Video Calling
- **Peer-to-Peer Connection**: Uses PeerJS for reliable WebRTC connections
- **Room ID System**: Simple peer ID sharing for connecting users
- **Media Controls**: Mute/unmute audio, enable/disable video
- **Real-time Connection**: Live video and audio streaming

### 🤖 Pose Detection
- **MediaPipe Integration**: Uses Google's MediaPipe Pose for accurate body tracking
- **Real-time Overlay**: Pose skeleton drawn directly on local video feed
- **Performance Metrics**: FPS counter and confidence scores
- **Screenshot Capture**: Save pose detection frames as images

## How to Use

### Starting a Video Call

1. **Navigate to Video Call Page**
   - Click "Video Call" in the main navigation
   - Or go directly to `/video-call-pose`

2. **Start Your Call**
   - Click "Start Video Call" button
   - Allow camera and microphone permissions
   - Your unique Peer ID will be generated and displayed

3. **Share Your ID**
   - Copy your Peer ID using the copy button
   - Share it with the person you want to call
   - They'll use this ID to join your call

### Joining a Call

1. **Enter Peer ID**
   - Paste the Peer ID you received in the "Room ID" field
   - Click "Join Call" button
   - Allow camera and microphone permissions

2. **Connect**
   - The call will automatically connect
   - You'll see both local and remote video feeds

### Using Pose Detection

1. **Enable Detection**
   - Start or join a video call first
   - Toggle "Enable Pose Detection" switch
   - Wait for initialization (loading spinner will appear)

2. **Position Yourself**
   - Stand in front of your camera
   - Ensure good lighting
   - Keep your full body in frame

3. **Monitor Results**
   - Watch the green skeleton overlay on your local video
   - Check FPS and confidence metrics
   - Use "Capture Pose" to save screenshots

## Technical Details

### Architecture
- **Frontend**: React with TypeScript and Next.js
- **Video Calling**: PeerJS for WebRTC signaling and connection
- **Pose Detection**: MediaPipe Pose running entirely in the browser
- **UI**: Tailwind CSS with Radix UI components

### Browser Requirements
- Modern browser with WebRTC support
- Camera and microphone access
- Sufficient processing power for real-time pose detection

### Performance Tips
- Good lighting improves pose detection accuracy
- Close unnecessary browser tabs to free up resources
- Use a wired internet connection for better video quality
- Stand 6-10 feet from camera for optimal pose detection

## Troubleshooting

### Common Issues

**Camera/Microphone Not Working**
- Check browser permissions
- Ensure no other apps are using the camera
- Try refreshing the page

**Pose Detection Not Starting**
- Make sure you're in a video call first
- Check browser console for errors
- Ensure good lighting conditions

**Connection Issues**
- Check internet connection
- Try refreshing the page
- Verify the Peer ID is correct

**Poor Performance**
- Close other browser tabs
- Reduce browser window size
- Check system resources

### Error Messages

- **"Failed to initialize pose detection"**: Browser compatibility issue or insufficient resources
- **"Connection error"**: Network or PeerJS server issue
- **"Camera access failed"**: Permission denied or camera in use

## Development

### File Structure
```
app/video-call-pose/
├── page.tsx                 # Main page component
components/
├── VideoCallWithPose.tsx    # Main video call component
└── ui/                      # UI components
```

### Key Dependencies
- `peerjs`: WebRTC peer-to-peer connections
- `@mediapipe/pose`: Real-time pose detection
- `@tensorflow/tfjs`: TensorFlow.js for ML models

### Customization
- Modify pose detection confidence thresholds in `initializePoseDetection()`
- Adjust skeleton colors in `drawPoseLandmarks()`
- Change PeerJS server configuration in `initializePeer()`

## Future Enhancements

- [ ] Multiple participant support
- [ ] Screen sharing functionality
- [ ] Recording capabilities
- [ ] Advanced pose analytics
- [ ] Exercise form analysis
- [ ] Real-time feedback system
- [ ] Mobile app version

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository. 