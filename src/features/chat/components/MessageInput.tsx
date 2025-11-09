import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import webSocketService from '../../../services/websocket';

export default function MessageInput() {
    const { selectedChat, addOptimisticMessage } = useChat();
    const { getUsername } = useAuth();
    const [message, setMessage] = useState('');
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
                relatedEntities: [],
                media: [],
                editedAt: null,
                isDeleted: false,
                reactions: [],
            };

            addOptimisticMessage(optimisticMessage);
            webSocketService.sendMessage(selectedChat.id, { content: message.trim() });
            setMessage('');
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

    return (
        <div className="p-4 border-t">
            <div className="flex items-center">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full p-2 border rounded-l-md"
                    value={message}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                    onClick={handleSendMessage}
                    className="bg-primary text-white p-2 rounded-r-md"
                >
                    Send
                </button>
            </div>
        </div>
    );
}