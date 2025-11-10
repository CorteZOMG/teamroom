import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import * as chatApi from '../../../api/chat';

export default function ChatSettings() {
  const { selectedChat, setSelectedChat } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [chatName, setChatName] = useState(selectedChat?.name || '');
  const [photoUrl, setPhotoUrl] = useState(selectedChat?.photoUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [transferUsername, setTransferUsername] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [clearForBoth, setClearForBoth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!selectedChat) {
    return null;
  }

  const isOwner = selectedChat.role === 'OWNER';
  const isAdmin = selectedChat.role === 'ADMIN' || isOwner;
  const isPrivateChat = selectedChat.type === 'PRIVATE';
  const isGroupChat = selectedChat.type === 'GROUP' || selectedChat.type === 'COURSE_CHAT';

  const handleUpdateChat = async () => {
    if (!selectedChat.id) return;

    try {
      await chatApi.updateChat(selectedChat.id, {
        name: chatName,
        photoUrl: photoUrl,
      });
      setSelectedChat(null);
      setTimeout(() => setSelectedChat(null), 0);
      setIsEditing(false);
      setSuccess('Chat updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update chat');
      console.error(err);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedChat.id || !transferUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!window.confirm(`Transfer ownership to ${transferUsername}?`)) return;

    setIsTransferring(true);
    try {
      await chatApi.transferChatOwnership(selectedChat.id, {
        newOwnerUsername: transferUsername,
      });
      setTransferUsername('');
      setSuccess('Ownership transferred successfully');
      setIsOpen(false);
      setTimeout(() => setSuccess(null), 3000);
      // Refresh chat to update role
      await chatApi.getChatDetails(selectedChat.id);
      setSelectedChat(null);
      setTimeout(() => setSelectedChat(null), 0);
    } catch (err) {
      setError('Failed to transfer ownership');
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat.id) return;

    if (!window.confirm('Delete this chat? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await chatApi.deleteChat(selectedChat.id);
      setSelectedChat(null);
    } catch (err) {
      setError('Failed to delete chat');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearChat = async () => {
    if (!selectedChat.id || !isPrivateChat) return;

    if (!window.confirm('Clear chat history? This cannot be undone.')) return;

    setIsClearingChat(true);
    try {
      await chatApi.clearPrivateChat(selectedChat.id, clearForBoth);
      setSuccess('Chat cleared successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to clear chat');
      console.error(err);
    } finally {
      setIsClearingChat(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100"
        title="Chat settings"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 p-4 space-y-4 max-h-96 overflow-y-auto">
          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 p-2 rounded text-sm">{success}</div>}

          {/* Edit chat info */}
          {isAdmin && isGroupChat && (
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-2">Chat Info</h4>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 text-sm"
                >
                  Edit Chat
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Chat name"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Photo URL"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateChat}
                      className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transfer ownership */}
          {isOwner && isGroupChat && (
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-2">Transfer Ownership</h4>
              <input
                type="text"
                placeholder="Username"
                value={transferUsername}
                onChange={(e) => setTransferUsername(e.target.value)}
                className="w-full p-2 border rounded text-sm mb-2"
              />
              <button
                onClick={handleTransferOwnership}
                disabled={isTransferring}
                className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 text-sm disabled:bg-gray-400"
              >
                {isTransferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          )}

          {/* Clear private chat */}
          {isPrivateChat && (
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-2">Clear Chat</h4>
              <label className="flex items-center text-sm mb-2">
                <input
                  type="checkbox"
                  checked={clearForBoth}
                  onChange={(e) => setClearForBoth(e.target.checked)}
                  className="mr-2"
                />
                Clear for both participants
              </label>
              <button
                onClick={handleClearChat}
                disabled={isClearingChat}
                className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600 text-sm disabled:bg-gray-400"
              >
                {isClearingChat ? 'Clearing...' : 'Clear History'}
              </button>
            </div>
          )}

          {/* Delete chat */}
          {isOwner && (
            <div>
              <button
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 text-sm disabled:bg-gray-400"
              >
                {isDeleting ? 'Deleting...' : 'Delete Chat'}
              </button>
            </div>
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-gray-600 p-2 rounded hover:bg-gray-100 text-sm"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
