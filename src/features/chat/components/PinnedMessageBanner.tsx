import { useEffect, useState } from 'react';
import { X, Pin } from 'lucide-react';
import type { PinnedMessage } from '../../../types/message';
import * as chatApi from '../../../api/chat';

interface PinnedMessageBannerProps {
    chatId: number;
    onMessageClick: (messageId: number) => void;
    scrollPosition: number;
}

export default function PinnedMessageBanner({ chatId, onMessageClick }: PinnedMessageBannerProps) {
    const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
    const [currentPinIndex, setCurrentPinIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchPinnedMessages();
    }, [chatId]);

    const fetchPinnedMessages = async () => {
        setIsLoading(true);
        try {
            const messages = await chatApi.getPinnedMessages(chatId);
            setPinnedMessages(messages.sort((a, b) => 
                new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime()
            ));
        } catch (error) {
            console.error('Failed to fetch pinned messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnpin = async (messageId: number) => {
        try {
            await chatApi.unpinMessage(chatId, messageId);
            setPinnedMessages(prev => prev.filter(msg => msg.messageId !== messageId));
        } catch (error) {
            console.error('Failed to unpin message:', error);
        }
    };

    if (isLoading || pinnedMessages.length === 0) {
        return null;
    }

    const currentPin = pinnedMessages[currentPinIndex];

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <Pin className="w-4 h-4 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-700">
                            Закріплено {currentPin.pinnedByUsername}
                        </span>
                        {pinnedMessages.length > 1 && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                {currentPinIndex + 1} з {pinnedMessages.length}
                            </span>
                        )}
                    </div>
                    
                    <button
                        onClick={() => onMessageClick(currentPin.messageId)}
                        className="text-sm text-gray-800 hover:text-blue-700 transition-colors text-left w-full truncate"
                    >
                        {currentPin.isDeleted ? (
                            <span className="italic text-gray-500">Це повідомлення було видалено</span>
                        ) : (
                            currentPin.messageContent
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {pinnedMessages.length > 1 && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPinIndex((prev) => 
                                    prev > 0 ? prev - 1 : pinnedMessages.length - 1
                                )}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="Попереднє закріплене повідомлення"
                            >
                                <span className="text-blue-600 text-xs">←</span>
                            </button>
                            <button
                                onClick={() => setCurrentPinIndex((prev) => 
                                    prev < pinnedMessages.length - 1 ? prev + 1 : 0
                                )}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="Наступне закріплене повідомлення"
                            >
                                <span className="text-blue-600 text-xs">→</span>
                            </button>
                        </div>
                    )}
                    
                    <button
                        onClick={() => handleUnpin(currentPin.messageId)}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                        title="Відкріпити повідомлення"
                    >
                        <X className="w-4 h-4 text-blue-600" />
                    </button>
                </div>
            </div>
        </div>
    );
}
