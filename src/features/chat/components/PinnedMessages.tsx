import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import * as chatApi from '../../../api/chat';
import type { PinnedMessage } from '../../../types/message';

export default function PinnedMessages() {
    const { selectedChat } = useChat();
    const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedChat?.id && isOpen) {
            fetchPinnedMessages();
        }
    }, [selectedChat?.id, isOpen]);

    const fetchPinnedMessages = async () => {
        if (!selectedChat?.id) return;

        setIsLoading(true);
        try {
            const messages = await chatApi.getPinnedMessages(selectedChat.id);
            setPinnedMessages(messages);
            setError(null);
        } catch (err) {
            setError('Failed to load pinned messages');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnpinMessage = async (messageId: number) => {
        if (!selectedChat?.id) return;

        try {
            await chatApi.unpinMessage(selectedChat.id, messageId);
            setPinnedMessages(prev => prev.filter(m => m.messageId !== messageId));
            setError(null);
        } catch (err) {
            setError('Failed to unpin message');
            console.error(err);
        }
    };

    if (!selectedChat) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full hover:bg-gray-100 transition-colors relative"
                title="Pinned messages"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {pinnedMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">
                        {pinnedMessages.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Modal */}
                    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden border border-gray-100 flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0">
                            <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Pinned Messages
                            </h4>
                            <div className="flex items-center gap-2">
                                {pinnedMessages.length > 0 && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                                        {pinnedMessages.length}
                                    </span>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {error && (
                                <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <span className="text-lg mt-0.5">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                        <p className="text-gray-500 text-sm">Loading pinned messages...</p>
                                    </div>
                                </div>
                            ) : pinnedMessages.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center text-gray-400">
                                        <div className="text-3xl mb-2">📌</div>
                                        <p className="text-sm">No pinned messages yet</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 space-y-3">
                                    {pinnedMessages.map(msg => {
                                        const isValidDate = msg.pinnedAt && !isNaN(new Date(msg.pinnedAt).getTime());
                                        const formattedDate = isValidDate
                                            ? new Date(msg.pinnedAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })
                                            : 'Invalid date';

                                        return (
                                            <div
                                                key={msg.messageId}
                                                className="group p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-amber-400 transition-all shadow-sm hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17.906 1.403c.264 0 .489.188.531.437l.993 6.695h6.062c.264 0 .489.188.531.437.041.25-.104.489-.334.552l-4.919 1.755 1.816 5.555c.084.264-.021.552-.261.718-.241.166-.573.145-.79-.052l-5.118-4.285-5.118 4.285c-.218.197-.549.218-.79.052-.24-.166-.345-.454-.262-.718l1.816-5.555-4.919-1.755c-.23-.063-.375-.302-.334-.552.042-.249.267-.437.531-.437h6.062l.993-6.695c.042-.249.267-.437.531-.437z" />
                                                        </svg>
                                                        <p className="text-xs font-semibold text-amber-700 truncate" title={msg.pinnedByUsername || 'Unknown user'}>
                                                            {msg.pinnedByUsername || 'Unknown user'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnpinMessage(msg.messageId)}
                                                        className="text-xs text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-md transition-colors font-medium opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                        title="Unpin message"
                                                    >
                                                        Unpin
                                                    </button>
                                                </div>
                                                {msg.isDeleted && (
                                                    <p className="text-sm text-gray-500 italic mb-2">(This message was deleted)</p>
                                                )}
                                                <p className="text-sm text-gray-700 break-words leading-relaxed mb-2">
                                                    {msg.messageContent || '(No content)'}
                                                </p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {formattedDate}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
