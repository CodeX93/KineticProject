"""
Video call handler using WebRTC for doctor-patient communication.
Based on MiroTalkC2C's implementation.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, Optional, List
import asyncio
import json
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/video", tags=["Video Call"])

class VideoCallManager:
    def __init__(self):
        self.active_rooms: Dict[str, Dict[str, WebSocket]] = {}
        self.peer_info: Dict[str, Dict[str, dict]] = {}
        self.doctor_rooms: Dict[str, str] = {}  # doctor_id -> room_id
        self.patient_rooms: Dict[str, str] = {}  # patient_id -> room_id
        
    async def create_room(self, doctor_id: str) -> str:
        """Create a new video call room for a doctor"""
        room_id = str(uuid.uuid4())
        self.active_rooms[room_id] = {}
        self.peer_info[room_id] = {}
        self.doctor_rooms[doctor_id] = room_id
        return room_id
        
    async def join_room(self, websocket: WebSocket, room_id: str, peer_info: dict) -> str:
        """Join an existing video call room"""
        if room_id not in self.active_rooms:
            raise HTTPException(status_code=404, detail="Room not found")
            
        if len(self.active_rooms[room_id]) >= 2:
            raise HTTPException(status_code=409, detail="Room is full")
            
        peer_id = str(uuid.uuid4())
        await websocket.accept()
        
        self.active_rooms[room_id][peer_id] = websocket
        self.peer_info[room_id][peer_id] = peer_info
        
        # Notify existing peers about the new participant
        await self.broadcast_to_room(room_id, {
            "type": "peer_joined",
            "peer_id": peer_id,
            "peer_info": peer_info
        }, exclude_peer=peer_id)
        
        return peer_id
        
    async def leave_room(self, room_id: str, peer_id: str):
        """Leave a video call room"""
        if room_id in self.active_rooms and peer_id in self.active_rooms[room_id]:
            del self.active_rooms[room_id][peer_id]
            if peer_id in self.peer_info[room_id]:
                del self.peer_info[room_id][peer_id]
                
            await self.broadcast_to_room(room_id, {
                "type": "peer_left",
                "peer_id": peer_id
            }, exclude_peer=peer_id)
            
            # Clean up empty rooms
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]
                del self.peer_info[room_id]
                # Remove from doctor/patient mappings
                for doc_id, r_id in list(self.doctor_rooms.items()):
                    if r_id == room_id:
                        del self.doctor_rooms[doc_id]
                for pat_id, r_id in list(self.patient_rooms.items()):
                    if r_id == room_id:
                        del self.patient_rooms[pat_id]
                        
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_peer: Optional[str] = None):
        """Broadcast a message to all peers in a room except the sender"""
        if room_id in self.active_rooms:
            for peer_id, websocket in self.active_rooms[room_id].items():
                if peer_id != exclude_peer:
                    try:
                        await websocket.send_json(message)
                    except Exception as e:
                        logger.error(f"Error sending message to peer {peer_id}: {str(e)}")
                        await self.leave_room(room_id, peer_id)

    async def handle_signaling(self, room_id: str, peer_id: str, message: dict):
        """Handle WebRTC signaling messages"""
        message_type = message.get("type")
        
        if message_type in ["offer", "answer", "ice-candidate"]:
            # Add sender information and broadcast to room
            message["from_peer"] = peer_id
            await self.broadcast_to_room(room_id, message, exclude_peer=peer_id)
        elif message_type == "peer_status":
            # Handle peer status updates (video/audio/screen)
            if room_id in self.peer_info and peer_id in self.peer_info[room_id]:
                status = message.get("status", {})
                self.peer_info[room_id][peer_id].update(status)
                await self.broadcast_to_room(room_id, {
                    "type": "peer_status_changed",
                    "peer_id": peer_id,
                    "status": status
                }, exclude_peer=peer_id)
        
# Global video call manager
video_manager = VideoCallManager()

@router.post("/create/{doctor_id}")
async def create_video_room(doctor_id: str):
    """Create a new video call room"""
    try:
        room_id = await video_manager.create_room(doctor_id)
        return {
            "success": True,
            "room_id": room_id,
            "message": "Video call room created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating video room: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create video room")

@router.websocket("/ws/{room_id}")
async def video_call_websocket(
    websocket: WebSocket, 
    room_id: str,
    user_id: str,
    user_type: str,
    user_name: str
):
    """WebSocket endpoint for video call signaling"""
    peer_id = None
    try:
        # Join the room
        peer_info = {
            "user_id": user_id,
            "user_type": user_type,
            "user_name": user_name,
            "video": True,
            "audio": True,
            "screen": False
        }
        
        peer_id = await video_manager.join_room(websocket, room_id, peer_info)
        
        # Update room mappings
        if user_type == "doctor":
            video_manager.doctor_rooms[user_id] = room_id
        else:
            video_manager.patient_rooms[user_id] = room_id
            
        # Send room info to the new peer
        room_info = {
            "type": "room_info",
            "peer_id": peer_id,
            "peers": video_manager.peer_info[room_id]
        }
        await websocket.send_json(room_info)
        
        # Handle incoming messages
        while True:
            try:
                message = await websocket.receive_json()
                await video_manager.handle_signaling(room_id, peer_id, message)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from peer {peer_id}")
                continue
                
    except WebSocketDisconnect:
        if peer_id:
            await video_manager.leave_room(room_id, peer_id)
    except Exception as e:
        logger.error(f"Error in video call websocket: {str(e)}")
        if peer_id:
            await video_manager.leave_room(room_id, peer_id)
