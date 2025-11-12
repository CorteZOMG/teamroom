import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../context/ChatContext';
import Layout from '../../../components/Layout';
import webSocketService from '../../../services/websocket';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import type { UserChatView } from '../../../types';
import type { JoinedToChatPayload } from '../../../types/websocket';

export default function MessengerPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addNewChat } = useChat();
  const [error, setError] = useState<string | null>(null);

  // Use a ref to hold the callback to avoid it being a dependency of useEffect
  const addNewChatRef = useRef(addNewChat);
  useEffect(() => {
    addNewChatRef.current = addNewChat;
  }, [addNewChat]);

  useEffect(() => {
    if (isAuthenticated && !webSocketService.isConnected()) {
      console.log('Attempting WebSocket connection...');
      webSocketService.connect(
        () => {
          console.log('WebSocket connected successfully.');
          webSocketService.subscribeToUserNotifications((notification) => {
            console.log('Received user notification:', notification);
            if (notification.type === 'JOINED_TO_CHAT') {
              const payload = notification.payload as JoinedToChatPayload;
              const newChat: UserChatView = {
                id: payload.chat_id,
                name: payload.chat_name,
                type: payload.chat_type,
                photoUrl: payload.chat_photoUrl,
                role: payload.role,
              };
              // Call the latest version of the function via the ref
              addNewChatRef.current(newChat);
            }
          });
        },
        (err) => {
          console.error('WebSocket connection error:', err);
          setError(err.message || 'Failed to connect to WebSocket.');
        }
      );
    }

    // Only disconnect if auth is lost, not on component unmount
    return () => {
      if (!isAuthenticated && webSocketService.isConnected()) {
        console.log('Disconnecting WebSocket due to authentication loss.');
        webSocketService.disconnect();
      }
    };
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-primary text-2xl font-montserrat">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // You might want to redirect to login here
    return null;
  }

  return (
    <Layout>
      <div className="flex h-full">
        <ChatList />
        <ChatWindow />
      </div>
      {error && <div className="absolute bottom-4 right-4 bg-red-500 text-white p-4 rounded">{error}</div>}
    </Layout>
  );
}