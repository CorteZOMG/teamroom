import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import webSocketService from '../services/websocket';
import type { Room, ChatMessage, UserBroadcast, TopicBroadcast } from '../types';

export default function Messenger() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Get current username from JWT token
  const getCurrentUsername = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT payload:', payload);
        console.log('Username from JWT:', payload.sub);
        return payload.sub; // 'sub' is the username in JWT
      }
    } catch (error) {
      console.error('Error parsing JWT token:', error);
    }
    return null;
  };
  
  // Debug messages state changes (only log when messages change significantly)
  useEffect(() => {
    if (messages.length > 0) {
      console.log('Messages updated:', messages.length, 'messages');
    }
  }, [messages.length]);
  
  // Test message rendering - add a test message when component mounts
  // useEffect(() => {
  //   if (selectedRoom && messages.length === 0) {
  //     console.log('Adding test message for debugging');
  //     const testMessage: ChatMessage = {
  //       id: 'test-1',
  //       roomId: selectedRoom.roomId || selectedRoom.id || 'test',
  //       sender: 'Test User',
  //       content: 'This is a test message to verify rendering works',
  //       type: 'CHAT',
  //       timestamp: new Date().toISOString()
  //     };
  //     setMessages([testMessage]);
  //   }
  // }, [selectedRoom, messages.length]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [roomMembers, setRoomMembers] = useState<Map<string | number, number>>(new Map());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, authLoading]);

  // WebSocket connection and message handling
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      connectWebSocket();
    }

    return () => {
      if (isConnected) {
        webSocketService.disconnect();
      }
    };
  }, [isAuthenticated, authLoading]);

  // Fallback: Retry getting initial data if no rooms are loaded after connection
  useEffect(() => {
    if (isConnected && rooms.length === 0) {
      const timeoutId = setTimeout(() => {
        console.log('No rooms loaded after 3 seconds, retrying initial data request...');
        webSocketService.getInitialData();
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, rooms.length]);

  // Debug: Log messages changes
  useEffect(() => {
    console.log('Messages state changed:', messages.length, 'messages');
    if (messages.length > 0) {
      console.log('Current messages:', messages);
    }
  }, [messages]);

  const connectWebSocket = useCallback(() => {
    console.log('Attempting to connect to WebSocket...');
    console.log('WebSocket service state before connect:', {
      isConnected: webSocketService.isConnected()
    });
    
    webSocketService.connect(
      () => {
        console.log('WebSocket connected successfully');
        console.log('WebSocket service state after connect:', {
          isConnected: webSocketService.isConnected()
        });
        setIsConnected(true);
        setError(null);
        
        // Subscribe to user broadcasts
        console.log('Subscribing to user broadcasts...');
        webSocketService.subscribeToUserBroadcasts(handleUserBroadcast);
        
        // Get initial data with delay to ensure connection is stable
        setTimeout(() => {
          console.log('Requesting initial data after delay...');
          webSocketService.getInitialData();
          
          // Set a timeout to detect if initial data is taking too long
          setTimeout(() => {
            if (rooms.length === 0) {
              console.warn('Initial data timeout - no rooms received after 10 seconds');
              console.log('Current rooms state:', rooms);
              console.log('WebSocket connection status:', webSocketService.isConnected());
            }
          }, 10000);
        }, 200);
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        setError('Failed to connect to chat server');
        setIsConnected(false);
      }
    );
  }, []);

  const handleUserBroadcast = useCallback((broadcast: UserBroadcast) => {
    console.log('User broadcast:', broadcast.type, broadcast.payload);
    
    switch (broadcast.type) {
      case 'ROOM_CREATED':
        console.log('Room created:', broadcast.payload);
        // Normalize room data - ensure both id and roomId are set
        const normalizedRoom = {
          ...broadcast.payload,
          id: broadcast.payload.roomId || broadcast.payload.id,
          roomId: broadcast.payload.roomId || broadcast.payload.id
        };
        setRooms(prev => [...prev, normalizedRoom]);
        break;
      case 'USER_JOINED':
        console.log('User joined:', broadcast.payload);
        // Update room member count
        const joinedRoomId = broadcast.payload.roomId;
        if (joinedRoomId) {
          setRoomMembers(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(joinedRoomId) || 0;
            newMap.set(joinedRoomId, currentCount + 1);
            console.log(`Room ${joinedRoomId} member count updated to:`, currentCount + 1);
            return newMap;
          });
          
          // Update the room in the rooms list
          setRooms(prev => prev.map(room => {
            const roomId = room.roomId || room.id;
            if (roomId === joinedRoomId) {
              const currentCount = roomMembers.get(joinedRoomId) || 0;
              return {
                ...room,
                memberCount: currentCount + 1
              };
            }
            return room;
          }));
        }
        break;
      case 'CHAT_MESSAGE':
        // Handle both initial messages and real-time messages
        // Check if this message is for the currently selected room
        const messageRoomId = broadcast.payload.roomId;
        const currentRoomId = selectedRoom ? (selectedRoom.roomId || selectedRoom.id) : null;
        
        // If no room is selected, or if this message is for the selected room
        if (!selectedRoom || messageRoomId === currentRoomId) {
          // Map backend message structure to frontend structure
          const mappedMessage = {
            id: broadcast.payload.id || `${Date.now()}-${Math.random()}`,
            roomId: broadcast.payload.roomId,
            sender: broadcast.payload.senderUsername || broadcast.payload.sender,
            content: broadcast.payload.content,
            type: broadcast.payload.type || 'CHAT',
            timestamp: broadcast.payload.timestamp || new Date().toISOString()
          };
          setMessages(prev => [...prev, mappedMessage]);
        }
        break;
      case 'INITIAL_DATA':
        // Handle initial data response
        if (broadcast.payload && broadcast.payload.rooms) {
          // Normalize all rooms to ensure both id and roomId are set
          const normalizedRooms = broadcast.payload.rooms.map((room: any) => ({
            ...room,
            id: room.roomId || room.id,
            roomId: room.roomId || room.id
          }));
          setRooms(normalizedRooms);
          console.log('Initial data loaded:', normalizedRooms.length, 'rooms');
        }
        break;
      default:
        console.log('Unhandled broadcast type:', broadcast.type);
    }
  }, [selectedRoom]);

  const handleTopicBroadcast = useCallback((broadcast: TopicBroadcast) => {
    console.log('Topic broadcast received:', broadcast);
    console.log('Broadcast type:', broadcast.type);
    console.log('Broadcast payload:', broadcast.payload);
    
    switch (broadcast.type) {
      case 'MESSAGE_RECEIVED':
        console.log('New real-time message received:', broadcast.payload);
        setMessages(prev => [...prev, broadcast.payload]);
        break;
      case 'CHAT_MESSAGE':
        // Handle messages that come through room topic subscriptions
        console.log('Chat message via topic:', broadcast.payload);
        // Map backend message structure to frontend structure
        const mappedTopicMessage = {
          id: broadcast.payload.id || `${Date.now()}-${Math.random()}`,
          roomId: broadcast.payload.roomId,
          sender: broadcast.payload.senderUsername || broadcast.payload.sender,
          content: broadcast.payload.content,
          type: broadcast.payload.type || 'CHAT',
          timestamp: broadcast.payload.timestamp || new Date().toISOString()
        };
        console.log('Adding mapped topic message:', mappedTopicMessage);
        setMessages(prev => {
          const newMessages = [...prev, mappedTopicMessage];
          console.log('Updated messages array from topic:', newMessages);
          return newMessages;
        });
        break;
      case 'ROOM_MESSAGES':
        // Handle initial room messages
        console.log('Room messages received:', broadcast.payload);
        setMessagesLoading(false);
        
        // Clear loading timeout
        if (selectedRoom && (selectedRoom as any).loadingTimeoutId) {
          clearTimeout((selectedRoom as any).loadingTimeoutId);
          (selectedRoom as any).loadingTimeoutId = null;
        }
        
        let messagesToSet: ChatMessage[] = [];
        if (Array.isArray(broadcast.payload)) {
          messagesToSet = broadcast.payload;
        } else if (broadcast.payload.messages && Array.isArray(broadcast.payload.messages)) {
          messagesToSet = broadcast.payload.messages;
        }
        
        // Map backend message structure to frontend structure
        const mappedMessages = messagesToSet.map(msg => ({
          id: msg.id || `${Date.now()}-${Math.random()}`,
          roomId: msg.roomId,
          sender: msg.senderUsername || msg.sender,
          content: msg.content,
          type: msg.type || 'CHAT',
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        
        console.log('Setting mapped initial messages:', mappedMessages);
        setMessages(mappedMessages);
        console.log('Messages state should now be:', mappedMessages);
        break;
      case 'USER_JOINED':
        console.log('User joined room:', broadcast.payload);
        // Handle user joined event - could update room member count
        break;
      case 'USER_LEFT':
        console.log('User left room:', broadcast.payload);
        // Handle user left event - could update room member count
        break;
      default:
        console.log('Unhandled topic broadcast type:', broadcast.type);
    }
  }, [selectedRoom]);

  // Room selection handler
  const handleRoomSelect = useCallback((room: Room) => {
    console.log('Selecting room:', room.roomName);
    setSelectedRoom(room);
    setMessages([]);
    setMessagesLoading(true);
    
    // Get the room ID (prefer roomId from backend, fallback to id)
    const roomId = room.roomId || room.id;
    
    // Unsubscribe from previous room
    if (selectedRoom) {
      const prevRoomId = selectedRoom.roomId || selectedRoom.id;
      if (prevRoomId) {
        webSocketService.unsubscribeFromRoom(prevRoomId);
      }
    }
    
    // Subscribe to new room
    if (roomId) {
      if (!webSocketService.isConnected()) {
        console.error('WebSocket not connected, cannot get room data');
        setMessagesLoading(false);
        return;
      }
      
      console.log('Subscribing to room and requesting data for roomId:', roomId);
      webSocketService.subscribeToRoom(roomId, handleTopicBroadcast);
      
      // Get room members and messages
      console.log('Requesting room members for roomId:', roomId);
      webSocketService.getRoomMembers({ roomId: roomId });
      
      console.log('Requesting room messages for roomId:', roomId);
      webSocketService.getRoomMessages({ roomId: roomId });
    } else {
      console.error('No room ID available for room:', room);
      setMessagesLoading(false);
    }
    
    // Set timeout to stop loading after 30 seconds (increased for debugging)
    const timeoutId = setTimeout(() => {
      console.log('Message loading timeout - stopping loading state after 30 seconds');
      console.log('Debug info at timeout:', {
        isConnected: isConnected,
        selectedRoom: selectedRoom,
        roomId: roomId,
        messagesLoading: messagesLoading
      });
      setMessagesLoading(false);
    }, 30000);
    
    // Store timeout ID to clear it if messages load successfully
    (room as any).loadingTimeoutId = timeoutId;
  }, [selectedRoom, handleTopicBroadcast]);

  // Send message handler
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedRoom) {
      return;
    }

    const roomId = selectedRoom.roomId || selectedRoom.id;
    if (!roomId) {
      console.error('No room ID available for sending message');
      return;
    }
    
    const message: ChatMessage = {
      roomId: roomId,
      sender: 'User', // TODO: Get from auth context
      content: newMessage.trim(),
      type: 'CHAT',
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', message);
    webSocketService.sendMessage(message);
    setNewMessage('');
  }, [newMessage, selectedRoom]);

  // Create room handler
  const handleCreateRoom = useCallback((roomName: string, photoUrl?: string) => {
    if (!roomName.trim()) {
      return;
    }

    webSocketService.createRoom({
      roomName: roomName.trim(),
      photoUrl: photoUrl || ''
    });
  }, []);


  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-primary text-2xl font-montserrat">Завантаження...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Simple room creation handler for the UI
  const handleCreateRoomClick = () => {
    const roomName = prompt('Enter room name:');
    if (roomName) {
      handleCreateRoom(roomName);
    }
  };

  return (
    <Layout>
      <div className="flex h-full bg-white">
        {/* Rooms sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 font-montserrat">
                  Повідомлення
                </h1>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              {error && (
                <div className="text-xs text-red-600 mt-1">
                  {error}
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateRoomClick}
                  className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors"
                  title="Create room"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Пошук кімнат..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* Rooms list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1" data-testid="rooms-list">
              {rooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="font-montserrat">Немає кімнат</p>
                  <p className="text-sm mt-1">Створіть кімнату або приєднайтесь до існуючої</p>
                </div>
              ) : (
                rooms.map((room, index) => {
                  const roomId = room.roomId || room.id;
                  const selectedRoomId = selectedRoom?.roomId || selectedRoom?.id;
                  return (
                    <div
                      key={`room-${roomId || `temp-${index}`}`}
                      onClick={() => handleRoomSelect(room)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-colors
                        ${selectedRoomId === roomId 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-gray-100'
                        }
                      `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {room.photoUrl ? (
                          <img 
                            src={room.photoUrl} 
                            alt={room.roomName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-bold">
                            {room.roomName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate font-montserrat">
                          {room.roomName}
                        </h3>
                        {room.lastMessage && (
                          <p className="text-sm opacity-75 truncate">
                            {room.lastMessage.content}
                          </p>
                        )}
                      </div>
                      <span className="text-xs opacity-60">
                        {room.memberCount || roomMembers.get(room.roomId || room.id || '') || 0} учасників
                      </span>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {selectedRoom.photoUrl ? (
                        <img 
                          src={selectedRoom.photoUrl} 
                          alt={selectedRoom.roomName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-bold">
                          {selectedRoom.roomName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 font-montserrat">
                        {selectedRoom.roomName}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedRoom.memberCount || roomMembers.get(selectedRoom.roomId || selectedRoom.id || '') || 0} учасників
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                
                {messagesLoading ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="font-montserrat">Завантаження повідомлень...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="font-montserrat">Немає повідомлень</p>
                    <p className="text-sm mt-1">Почніть розмову!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      // System messages (JOIN type) - centered, gray/purple
                      if (message.type === 'JOIN') {
                        return (
                          <div key={message.id || `msg-${index}`} className="flex justify-center">
                            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-montserrat">
                              {message.content}
                            </div>
                          </div>
                        );
                      }
                      
                      // Regular chat messages - check if it's from current user
                      const currentUsername = getCurrentUsername();
                      const isCurrentUser = message.sender === currentUsername;
                      console.log('Message sender:', message.sender, 'Current user:', currentUsername, 'Is current user:', isCurrentUser);
                      
                      return (
                        <div key={message.id || `msg-${index}`} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCurrentUser 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                              <span className="text-xs font-bold">
                                {message.sender.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Message content */}
                            <div className="flex-1">
                              <div className={`rounded-lg px-3 py-2 ${
                                isCurrentUser 
                                  ? 'bg-primary text-white' 
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                {!isCurrentUser && (
                                  <p className="text-xs font-medium opacity-75 mb-1">
                                    {message.sender}
                                  </p>
                                )}
                                <p className={`text-sm font-montserrat ${
                                  isCurrentUser ? 'text-white' : 'text-gray-800'
                                }`}>
                                  {message.content}
                                </p>
                              </div>
                              {message.timestamp && (
                                <p className={`text-xs mt-1 ${
                                  isCurrentUser ? 'text-right text-gray-500' : 'text-left text-gray-500'
                                }`}>
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                    placeholder="Напишіть повідомлення..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-montserrat"
                  />
                  <button
                    onClick={(e) => handleSendMessage(e)}
                    disabled={!newMessage.trim() || !isConnected}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-montserrat"
                  >
                    Надіслати
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-bold mb-2 font-montserrat">
                  Оберіть кімнату
                </h2>
                <p className="font-montserrat">
                  Виберіть кімнату зі списку, щоб почати розмову
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
