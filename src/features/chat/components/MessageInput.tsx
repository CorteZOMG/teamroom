import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import webSocketService from '../../../services/websocket';
import AttachCourseContentModal from './AttachCourseContentModal';
import type { RelatedEntity } from '../../../types';

export default function MessageInput() {
    const { selectedChat, addOptimisticMessage } = useChat();
    const { getUsername } = useAuth();
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [relatedEntities, setRelatedEntities] = useState<RelatedEntity[]>([]);
    const typingTimeoutRef = useRef<number | null>(null);

    const handleSendMessage = () => {
        if (message.trim() && selectedChat) {
            const username = getUsername();
            if (!username) return;

            const optimisticMessage = {
                chatId: selectedChat.id,
                username,
                content: message.trim(),
                replyToMessageId: null,
                relatedEntities: relatedEntities,
                media: [],
                editedAt: null,
                isDeleted: false,
                reactions: [],
            };

            addOptimisticMessage(optimisticMessage);
            
            const messagePayload: any = { content: message.trim() };
            if (relatedEntities.length > 0) {
                messagePayload.relatedEntities = relatedEntities;
            }
            
            webSocketService.sendMessage(selectedChat.id, messagePayload);
            setMessage('');
            setRelatedEntities([]);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            webSocketService.stopTyping(selectedChat.id);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);

        if (selectedChat) {
            if (!typingTimeoutRef.current) {
                webSocketService.startTyping(selectedChat.id);
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = window.setTimeout(() => {
                webSocketService.stopTyping(selectedChat.id);
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };
    
    useEffect(() => {
        console.log('MessageInput: selectedChat updated', selectedChat);
    }, [selectedChat]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const isCourseChat = selectedChat?.courseId !== null && selectedChat?.courseId !== undefined;

    return (
        <div className="p-4 border-t">
            {/* Attached Entities Display */}
            {relatedEntities.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {relatedEntities.map((entity) => (
                        <div
                            key={`${entity.relatedEntityType}-${entity.relatedEntityId}`}
                            className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2"
                        >
                            <span className="text-sm text-gray-700">
                                {entity.relatedEntityType === 'ASSIGNMENT' ? '📋' : '📚'}{' '}
                                {entity.relatedEntityType}
                            </span>
                            <button
                                onClick={() =>
                                    setRelatedEntities((prev) =>
                                        prev.filter(
                                            (e) =>
                                                !(
                                                    e.relatedEntityType === entity.relatedEntityType &&
                                                    e.relatedEntityId === entity.relatedEntityId
                                                )
                                        )
                                    )
                                }
                                className="text-gray-500 hover:text-gray-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2">
                {isCourseChat && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors"
                        title="Attach course content"
                    >
                        📎
                    </button>
                )}
                <input
                    type="text"
                    placeholder="Type a message..."
                    className={`flex-1 p-2 border rounded-l-md ${!isCourseChat ? 'rounded-l-md' : ''}`}
                    value={message}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                    onClick={handleSendMessage}
                    className="bg-primary text-white px-3 py-2 rounded-r-md hover:bg-primary-dark transition-colors"
                >
                    Send
                </button>
            </div>

            {isCourseChat && selectedChat?.courseId && (
                <AttachCourseContentModal
                    isOpen={isModalOpen}
                    courseId={selectedChat.courseId}
                    onClose={() => setIsModalOpen(false)}
                    onAttach={(entities) => {
                        setRelatedEntities((prev) => [...prev, ...entities]);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}