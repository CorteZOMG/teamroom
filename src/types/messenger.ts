// Messenger types
export interface ChatMessage {
  roomId: string;
  sender: string;
  content: string;
  type: 'CHAT';
  timestamp?: string;
}

export interface Room {
  roomId: string;
  roomName: string;
  photoUrl?: string;
  lastMessage?: ChatMessage;
  memberCount?: number;
}

export interface RoomMember {
  username: string;
  joinedAt?: string;
}

export interface BroadcastMessage {
  type: 'ROOM_CREATED' | 'USER_JOINED' | 'CHAT_MESSAGE';
  payload: any;
}

export interface CreateRoomRequest {
  roomName: string;
  photoUrl?: string;
}

export interface JoinRoomRequest {
  roomId: string;
  username: string;
}

export interface GetRoomMembersRequest {
  roomId: string;
}

export interface GetRoomMessagesRequest {
  roomId: string;
}

// WebSocket connection types
export interface WebSocketConfig {
  hostname: string;
  jwt: string;
}

export interface StompClient {
  connect: (headers: any, onConnect: () => void, onError: (error: any) => void) => void;
  subscribe: (destination: string, callback: (message: any) => void) => void;
  send: (destination: string, headers: any, body: string) => void;
  disconnect: () => void;
}
