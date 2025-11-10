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
        className="p-2 rounded-full hover:bg-gray-100 relative"
        title="Pinned messages"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {pinnedMessages.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {pinnedMessages.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Pinned Messages ({pinnedMessages.length})</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-2">{error}</div>}

          {isLoading ? (
            <div className="text-center text-gray-500 py-4">Loading pinned messages...</div>
          ) : pinnedMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No pinned messages</div>
          ) : (
            <div className="space-y-2">
              {pinnedMessages.map(msg => (
                <div
                  key={msg.messageId}
                  className="p-3 bg-gray-50 rounded border border-gray-200 group hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-medium text-gray-500">
                      {msg.username}
                    </p>
                    <button
                      onClick={() => handleUnpinMessage(msg.messageId)}
                      className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Unpin
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.sentAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
