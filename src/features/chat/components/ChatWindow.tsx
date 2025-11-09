import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import * as chatApi from '../../../api/chat';
import webSocketService from '../../../services/websocket';
import ChatHeader from './ChatHeader';
import Message from './Message';
import MessageInput from './MessageInput';

export default function ChatWindow() {
            const { 
                selectedChat, 
                isChatLoading,
                messages, 
                setMessages, 
                addMessage, 
                updateMessage, 
                markMessageAsDeleted, 
                typingUsers, 
                addTypingUser, 
                removeTypingUser, 
                addReaction,
                loadReactions,
            } = useChat();
            
            const [isLoading, setIsLoading] = useState(false);
            const [hasMore, setHasMore] = useState(true);
            const messageContainerRef = useRef<HTMLDivElement>(null);
            const isFetchingMessages = useRef(false);
            const lastScrollTop = useRef(0);
        
            const fetchMessages = async (chatId: number, messageId?: number) => {
                if (isFetchingMessages.current) return;
                
                isFetchingMessages.current = true;
                setIsLoading(true);
                try {
                    const fetchedMessages = await chatApi.getMessages(chatId, { limitBefore: 50, messageId });
                    
                    loadReactions(fetchedMessages);
        
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMessages = fetchedMessages.filter(m => !existingIds.has(m.id));
                        return [...newMessages, ...prev];
                    });
        
                    if (fetchedMessages.length === 0) {
                        setHasMore(false);
                    }
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                } finally {
                    setIsLoading(false);
                    isFetchingMessages.current = false;
                }
            };
        
            useEffect(() => {
                if (selectedChat?.id) {
                    setHasMore(true);
                    setMessages([]);
                    fetchMessages(selectedChat.id);
        
                    const handleBroadcast = (broadcast: any) => {
                        console.log('Received chat broadcast:', broadcast);
                        switch (broadcast.type) {
                            case 'USER_MESSAGE':
                            case 'SYSTEM_MESSAGE':
                                addMessage(broadcast.payload);
                                break;
                            case 'MESSAGE_UPDATE':
                                updateMessage(broadcast.payload);
                                break;
                            case 'MESSAGE_DELETED':
                                markMessageAsDeleted(broadcast.payload.messageId, broadcast.payload.deletedAt);
                                break;
                            case 'START_TYPING':
                                addTypingUser(broadcast.payload.username);
                                break;
                            case 'STOP_TYPING':
                                removeTypingUser(broadcast.payload.username);
                                break;
                            case 'REACTION_UPDATE':
                                addReaction(broadcast.payload);
                                break;
                        }
                    };
        
                    webSocketService.subscribeToChat(selectedChat.id, handleBroadcast);
        
                    return () => {
                        if (selectedChat?.id) {
                            webSocketService.unsubscribeFromChat(selectedChat.id);
                        }
                    };
                } else {
                    setMessages([]); // Clear messages if no chat is selected
                }
            }, [selectedChat?.id, addMessage, updateMessage, markMessageAsDeleted, addTypingUser, removeTypingUser, setMessages, addReaction, loadReactions]);        
            const handleScroll = () => {
                if (messageContainerRef.current) {
                    const { scrollTop } = messageContainerRef.current;
                    // Fetch only when scrolling up
                    if (scrollTop < lastScrollTop.current && scrollTop === 0 && hasMore && selectedChat?.id) {
                        const firstMessageId = messages[0]?.id;
                        if (firstMessageId) {
                            fetchMessages(selectedChat.id, firstMessageId);
                        }
                    }
                    lastScrollTop.current = scrollTop;
                }
            };        if (isChatLoading) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-xl font-montserrat">Loading chat...</div>
                </div>
            );
        }
    
        if (!selectedChat) {
            return (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-xl font-bold mb-2 font-montserrat">
                      Select a chat
                    </h2>
                    <p className="font-montserrat">
                      Choose a chat from the list to start messaging.
                    </p>
                  </div>
                </div>
            );
        }
        
            return (
                <div className="flex-1 flex flex-col overflow-x-hidden">
                    <ChatHeader />
                    <div ref={messageContainerRef} onScroll={handleScroll} className="flex-1 p-4 overflow-y-auto">
                        {isLoading && messages.length === 0 && <div className="text-center">Loading messages...</div>}
                        {messages.map(msg => (
                            <Message key={msg.tempId || msg.id} message={msg} />
                        ))}
                    </div>
                    <div className="h-6 px-4">
                        {typingUsers.length > 0 && (
                            <p className="text-gray-500 text-sm">
                                {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
                            </p>
                        )}
                    </div>
                    <MessageInput />
                </div>
            );    }