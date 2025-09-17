// WebSocket message types
export interface ChatMessage {
  roomId: string | number; // Backend sends numbers
  sender: string;
  content: string;
  type: 'CHAT' | 'JOIN'; // Backend sends different message types
  timestamp?: string;
  id?: string;
  // Backend fields for mapping
  senderUsername?: string;
}

export interface Room {
  id?: string; // Optional for backward compatibility
  roomId?: string; // Backend sends this field
  roomName: string;
  photoUrl?: string;
  members?: RoomMember[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
  memberCount?: number;
}

export interface RoomMember {
  id: string;
  username: string;
  photoUrl?: string;
  isOnline?: boolean;
  userId?: string; // Alternative field name for compatibility
}

// WebSocket broadcast types
export interface UserBroadcast {
  type: 'ROOM_CREATED' | 'USER_JOINED' | 'CHAT_MESSAGE' | 'USER_LEFT' | 'ROOM_UPDATED' | 'INITIAL_DATA';
  payload: any;
  timestamp?: string;
}

export interface TopicBroadcast {
  type: 'MESSAGE_RECEIVED' | 'USER_JOINED' | 'USER_LEFT' | 'ROOM_UPDATED' | 'ROOM_MESSAGES' | 'CHAT_MESSAGE';
  payload: any;
  timestamp?: string;
}

// WebSocket request types
export interface CreateRoomRequest {
  roomName: string;
  photoUrl?: string;
}

export interface JoinRoomRequest {
  roomId: string;
  username: string;
}

export interface GetRoomMembersRequest {
  roomId: string | number;
}

export interface GetRoomMessagesRequest {
  roomId: string | number;
}

// WebSocket service callbacks
export type OnConnectedCallback = () => void;
export type OnErrorCallback = (error: any) => void;
export type OnUserBroadcastCallback = (broadcast: UserBroadcast) => void;
export type OnTopicBroadcastCallback = (broadcast: TopicBroadcast) => void;

// WebSocket service interface
export interface WebSocketService {
  connect: (onConnected: OnConnectedCallback, onError: OnErrorCallback) => void;
  disconnect: () => void;
  isConnected: () => boolean;
  
  // User broadcasts
  subscribeToUserBroadcasts: (callback: OnUserBroadcastCallback) => void;
  
  // Room operations
  createRoom: (request: CreateRoomRequest) => void;
  joinRoom: (request: JoinRoomRequest) => void;
  getRoomMembers: (request: GetRoomMembersRequest) => void;
  getRoomMessages: (request: GetRoomMessagesRequest) => void;
  getInitialData: () => void;
  
  // Messaging
  sendMessage: (message: ChatMessage) => void;
  subscribeToRoom: (roomId: string, callback: OnTopicBroadcastCallback) => void;
  unsubscribeFromRoom: (roomId: string) => void;
}
