import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { getToken } from './auth';
import type { 
  WebSocketService, 
  OnConnectedCallback, 
  OnErrorCallback, 
  OnUserBroadcastCallback, 
  OnTopicBroadcastCallback,
  CreateRoomRequest,
  JoinRoomRequest,
  GetRoomMembersRequest,
  GetRoomMessagesRequest,
  ChatMessage,
  UserBroadcast,
  TopicBroadcast
} from '../types';

class WebSocketServiceImpl implements WebSocketService {
  private stompClient: any = null;
  private isConnectedFlag = false;
  private userBroadcastSubscription: any = null;
  private roomSubscriptions = new Map<string, any>();

  constructor() {
    // Don't initialize client immediately - wait for connect() call
  }

  private initializeClient() {
    if (this.stompClient) {
      return; // Already initialized
    }

    // Use dedicated WebSocket URL from environment, fallback to converting API URL
    const wsUrl = import.meta.env.VITE_WS_URL || 
      (import.meta.env.VITE_API_URL || 'https://team-room-back.onrender.com').replace('https://', 'http://');
    const fullWsUrl = `${wsUrl}/ws`;
    console.log('WebSocket URL:', fullWsUrl);
    const socket = new SockJS(fullWsUrl);
    
    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = (str: string) => {
      console.log('STOMP Debug:', str);
    };
  }

  connect(onConnected: OnConnectedCallback, onError: OnErrorCallback) {
    const token = getToken();
    if (!token) {
      console.error('No authentication token found, cannot connect to WebSocket');
      onError(new Error('No authentication token found'));
      return;
    }

    console.log('Initializing WebSocket client with token...');
    this.initializeClient();

    if (this.stompClient) {
      console.log('Connecting to WebSocket...');
      
      // Use the exact connection method from backend specification
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      this.stompClient.connect(
        headers,
        (frame: any) => {
          console.log('WebSocket connected successfully, frame:', frame);
          this.isConnectedFlag = true;
          console.log('Setting isConnectedFlag to true, calling onConnected');
          onConnected();
        },
        (error: any) => {
          console.error('WebSocket connection failed:', error);
          console.error('Error details:', error.body, error.headers, error.message);
          this.isConnectedFlag = false;
          onError(new Error(error.body || 'WebSocket connection failed'));
        }
      );
    } else {
      console.error('STOMP client not initialized');
      onError(new Error('STOMP client not initialized'));
    }
  }

  disconnect() {
    if (this.stompClient && this.isConnectedFlag) {
      // Unsubscribe from all subscriptions
      if (this.userBroadcastSubscription) {
        this.userBroadcastSubscription.unsubscribe();
        this.userBroadcastSubscription = null;
      }
      
      this.roomSubscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.roomSubscriptions.clear();
      
      this.stompClient.deactivate();
      this.isConnectedFlag = false;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag && this.stompClient !== null;
  }

  subscribeToUserBroadcasts(callback: OnUserBroadcastCallback) {
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Subscribing to user broadcasts...');
    this.userBroadcastSubscription = this.stompClient.subscribe(
      '/user/queue/notifications',
      (message: any) => {
        try {
          console.log('Raw user broadcast message:', message.body);
          const broadcast: UserBroadcast = JSON.parse(message.body);
          console.log('Parsed user broadcast:', broadcast);
          callback(broadcast);
        } catch (error) {
          console.error('Error parsing user broadcast:', error);
          console.error('Raw message body:', message.body);
        }
      }
    );
  }

  createRoom(request: CreateRoomRequest) {
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Creating room:', request);
    this.stompClient.send('/app/room.create', {}, JSON.stringify(request));
  }

  joinRoom(request: JoinRoomRequest) {
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Joining room:', request);
    this.stompClient.send('/app/room.join', {}, JSON.stringify(request));
  }

  getRoomMembers(request: GetRoomMembersRequest) {
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Getting room members:', request);
    this.stompClient.send('/app/get-room-members', {}, JSON.stringify(request));
  }

  getRoomMessages(request: GetRoomMessagesRequest) {
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Getting room messages:', request);
    this.stompClient.send('/app/get-room-messages', {}, JSON.stringify(request));
  }

  getInitialData() {
    console.log('getInitialData called - stompClient:', !!this.stompClient, 'isConnectedFlag:', this.isConnectedFlag);
    
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected - stompClient:', !!this.stompClient, 'isConnectedFlag:', this.isConnectedFlag);
      return;
    }

    console.log('Getting initial data - sending request to /app/get-initial-data');
    try {
      this.stompClient.send('/app/get-initial-data', {}, '{}');
      console.log('Initial data request sent successfully');
    } catch (error) {
      console.error('Error sending initial data request:', error);
    }
  }

  sendMessage(message: ChatMessage) {
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected');
      return;
    }

    console.log('Sending message to /app/chat.sendMessage:', message);
    this.stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(message));
  }

  subscribeToRoom(roomId: string, callback: OnTopicBroadcastCallback) {
    if (!this.stompClient || !this.isConnectedFlag) {
      console.error('WebSocket not connected');
      return;
    }

    const topicPath = `/topic/rooms/${roomId}`;
    console.log('Subscribing to room:', topicPath);
    
    const subscription = this.stompClient.subscribe(topicPath, (message: any) => {
      try {
        console.log(`Topic broadcast for room ${roomId}:`, message.body);
        const broadcast: TopicBroadcast = JSON.parse(message.body);
        console.log('Topic broadcast received:', broadcast);
        callback(broadcast);
      } catch (error) {
        console.error('Error parsing topic broadcast:', error);
      }
    });

    this.roomSubscriptions.set(roomId, subscription);
  }

  unsubscribeFromRoom(roomId: string) {
    const subscription = this.roomSubscriptions.get(roomId);
    if (subscription) {
      subscription.unsubscribe();
      this.roomSubscriptions.delete(roomId);
      console.log('Unsubscribed from room:', roomId);
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketServiceImpl();
export default webSocketService;
