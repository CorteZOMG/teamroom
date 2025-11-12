import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { AuroraBackground } from '../../../components/ui/aurora-background';
import * as chatApi from '../../../api/chat';
import webSocketService from '../../../services/websocket';
import ChatHeader from './ChatHeader';
import Message from './Message';
import MessageInput from './MessageInput';
import ChatMembersPanel from './ChatMembersPanel';
import PinnedMessageBanner from './PinnedMessageBanner';

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
    const { getUsername } = useAuth();
    
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [scrollPosition, setScrollPosition] = useState(0);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const isFetchingMessages = useRef(false);
    const lastScrollTop = useRef(0);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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
                        if (broadcast.payload.username !== getUsername()) {
                            addTypingUser(broadcast.payload.username);
                        }
                        break;
                    case 'STOP_TYPING':
                        if (broadcast.payload.username !== getUsername()) {
                            removeTypingUser(broadcast.payload.username);
                        }
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
            setMessages([]);
        }
    }, [selectedChat?.id, addMessage, updateMessage, markMessageAsDeleted, addTypingUser, removeTypingUser, setMessages, addReaction, loadReactions]);

    const handleScroll = () => {
        if (messageContainerRef.current) {
            const { scrollTop } = messageContainerRef.current;
            setScrollPosition(scrollTop);
            
            if (scrollTop < lastScrollTop.current && scrollTop === 0 && hasMore && selectedChat?.id) {
                const firstMessageId = messages[0]?.id;
                if (firstMessageId) {
                    fetchMessages(selectedChat.id, firstMessageId);
                }
            }
            lastScrollTop.current = scrollTop;
        }
    };

    const scrollToMessage = (messageId: number) => {
        const messageElement = messageRefs.current.get(messageId);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-message');
            setTimeout(() => {
                messageElement.classList.remove('highlight-message');
            }, 2000);
        }
    };

    if (isChatLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <div className="text-lg font-montserrat text-gray-600">Завантаження чату...</div>
                </div>
            </div>
        );
    }

    if (!selectedChat) {
        return (
            <AuroraBackground className="flex-1 flex items-center justify-center overflow-hidden">
                <div className="text-center relative z-10">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-2xl font-bold mb-2 font-montserrat text-gray-800">
                        Виберіть чат
                    </h2>
                    <p className="font-montserrat text-gray-500">
                        Виберіть чат зі списку, щоб розпочати спілкування.
                    </p>
                </div>
            </AuroraBackground>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Hide header for Main Course Chat (Feed) to take full space */}
            {selectedChat?.type !== 'MAIN_COURSE_CHAT' && (
                <ChatHeader />
            )}
            <div className="flex flex-1 overflow-hidden gap-4 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4">
                <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
                    {/* Pinned Message Banner */}
                    {selectedChat?.id && (
                        <PinnedMessageBanner 
                            chatId={selectedChat.id} 
                            onMessageClick={scrollToMessage}
                            scrollPosition={scrollPosition}
                        />
                    )}
                    
                    {/* Messages Container */}
                    <div 
                        ref={messageContainerRef} 
                        onScroll={handleScroll} 
                        className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-3"
                    >
                        {isLoading && messages.length === 0 && (
                            <div className="flex justify-center py-8">
                                <div className="text-gray-500 text-sm">Завантаження повідомлень...</div>
                            </div>
                        )}
                        {messages.length === 0 && !isLoading && (
                            <div className="flex justify-center items-center h-full text-gray-400">
                                <div className="text-center">
                                    <div className="text-3xl mb-2">👋</div>
                                    <p className="text-sm">Поки немає повідомлень. Розпочніть розмову!</p>
                                </div>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div 
                                key={msg.tempId || msg.id} 
                                ref={(el) => {
                                    if (el && msg.id) {
                                        messageRefs.current.set(msg.id, el);
                                    }
                                }}
                            >
                                <Message message={msg} />
                            </div>
                        ))}
                    </div>

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div className="px-6 py-2 border-t border-gray-100">
                            <p className="text-gray-500 text-xs font-medium">
                                <span className="inline-flex items-center gap-1">
                                    <span>{typingUsers.join(', ')} {typingUsers.length > 1 ? 'пишуть' : 'пише'}</span>
                                    <span className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                    </span>
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Message Input */}
                    <MessageInput />
                </div>

                {/* Members Panel - Hidden for Main Course Chat (Feed) */}
                {selectedChat?.type !== 'MAIN_COURSE_CHAT' && (
                    <ChatMembersPanel />
                )}
            </div>
        </div>
    );
}