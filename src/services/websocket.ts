import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { getToken } from './auth';
import type {
    UserNotification,
    ChatBroadcast,
    SendMessageRequest,
    ReactRequest,
    EditMessageRequest,
    DeleteMessageRequest,
    ReadMessageRequest
} from '../types/websocket';


export type OnConnectedCallback = () => void;
export type OnErrorCallback = (error: Error) => void;
export type OnUserNotificationCallback = (notification: UserNotification) => void;
export type OnChatBroadcastCallback = (broadcast: ChatBroadcast) => void;

class WebSocketService {
  private stompClient: Stomp.Client | null = null;
  private isConnectedFlag = false;
  private isConnectingFlag = false;
  private userNotificationSubscription: Stomp.Subscription | null = null;
  private chatSubscriptions = new Map<number, Stomp.Subscription>();
  private messageQueue: Array<{ destination: string; body?: object }> = [];
  private maxRetries = 5;
  private retryCount = 0;

  private initializeClient() {
    if (this.stompClient) {
      return; 
    }

    const getWebSocketUrl = (): string => {
      // Check if we have an explicit WebSocket URL from environment variables
      const envWsUrl = import.meta.env.VITE_WS_URL;
      
      if (envWsUrl) {
        // Production: use the explicit URL (e.g., wss://your-backend.render.com/ws)
        return envWsUrl;
      }
      
      // Development/Docker: use relative path
      // In development, this will be intercepted by the Vite proxy.
      // In Docker, nginx will proxy this to the backend.
      else {
        return '/ws';
      }
    }

    const fullWsUrl = getWebSocketUrl();

    console.log('WebSocket URL:', fullWsUrl);
    const socket = new SockJS(fullWsUrl);
    
    this.stompClient = Stomp.over(socket);
    this.stompClient.debug = () => {
      // console.log('STOMP Debug:', str);
    };
  }

  connect(onConnected: OnConnectedCallback, onError: OnErrorCallback) {
    if (this.isConnectedFlag) {
      onConnected();
      return;
    }

    if (this.isConnectingFlag) {
      return;
    }

    this.isConnectingFlag = true;

    const token = getToken();
    if (!token) {
      this.isConnectingFlag = false;
      onError(new Error('No authentication token found'));
      return;
    }

    this.initializeClient();

    if (this.stompClient) {
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      this.stompClient.connect(
        headers,
        () => {
          this.isConnectedFlag = true;
          this.isConnectingFlag = false;
          this.retryCount = 0;
          this.flushMessageQueue();
          onConnected();
        },
        (error: any) => {
          this.isConnectedFlag = false;
          this.isConnectingFlag = false;
          
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delayMs = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000);
            console.log(`WebSocket connection failed. Retrying in ${delayMs}ms (attempt ${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
              this.stompClient = null;
              this.connect(onConnected, onError);
            }, delayMs);
          } else {
            onError(new Error(error.body || 'WebSocket connection failed after maximum retries'));
          }
        }
      );
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const { destination, body } = this.messageQueue.shift()!;
      if (this.stompClient && this.isConnectedFlag) {
        this.stompClient.send(destination, {}, body ? JSON.stringify(body) : undefined);
      }
    }
  }

  disconnect() {
    if (this.stompClient && this.isConnectedFlag) {
      this.userNotificationSubscription?.unsubscribe();
      this.chatSubscriptions.forEach((sub) => sub.unsubscribe());
      this.chatSubscriptions.clear();
      this.stompClient.disconnect(() => {
        this.isConnectedFlag = false;
      });
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  subscribeToUserNotifications(callback: OnUserNotificationCallback) {
    if (!this.stompClient || !this.isConnectedFlag) return;

    this.userNotificationSubscription = this.stompClient.subscribe(
      '/user/queue/notifications',
      (message) => {
        try {
          const notification: UserNotification = JSON.parse(message.body);
          callback(notification);
        } catch (error) {
          console.error('Error parsing user notification:', error);
        }
      }
    );
  }

  subscribeToChat(chatId: number, callback: OnChatBroadcastCallback) {
    if (!this.stompClient || !this.isConnectedFlag || this.chatSubscriptions.has(chatId)) return;

    const subscription = this.stompClient.subscribe(
      `/topic/chats/${chatId}`,
      (message) => {
        try {
          const broadcast: ChatBroadcast = JSON.parse(message.body);
          callback(broadcast);
        } catch (error) {
          console.error(`Error parsing chat broadcast for chat ${chatId}:`, error);
        }
      }
    );
    this.chatSubscriptions.set(chatId, subscription);
  }

  unsubscribeFromChat(chatId: number) {
    const subscription = this.chatSubscriptions.get(chatId);
    if (subscription) {
      subscription.unsubscribe();
      this.chatSubscriptions.delete(chatId);
    }
  }

  private send(destination: string, body?: object) {
    if (this.isConnectedFlag && this.stompClient) {
      this.stompClient.send(destination, {}, body ? JSON.stringify(body) : undefined);
    } else if (this.isConnectingFlag) {
      // Queue the message if we're still connecting
      this.messageQueue.push({ destination, body });
      console.log('WebSocket connecting, queuing message...');
    } else {
      console.error('WebSocket not connected, cannot send message');
    }
  }

  sendMessage(chatId: number, message: SendMessageRequest) {
    this.send(`/app/chat/${chatId}/send`, message);
  }

  sendReaction(chatId: number, reaction: ReactRequest) {
    console.log('WebSocketService: sending reaction', { chatId, reaction });
    this.send(`/app/chat/${chatId}/react`, reaction);
  }

  editMessage(chatId: number, message: EditMessageRequest) {
    this.send(`/app/chat/${chatId}/edit`, message);
  }

  deleteMessage(chatId: number, message: DeleteMessageRequest) {
    this.send(`/app/chat/${chatId}/delete`, message);
  }

  startTyping(chatId: number) {
    this.send(`/app/chat/${chatId}/typing/start`);
  }

  stopTyping(chatId: number) {
    this.send(`/app/chat/${chatId}/typing/stop`);
  }

  readMessage(chatId: number, message: ReadMessageRequest) {
    this.send(`/app/chat/${chatId}/read`, message);
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
''