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
        } catch (err: any) {
            const errorMsg = err?.message || 'Failed to clear chat';
            setError(`Error: ${errorMsg}`);
            console.error('Clear chat error:', err);
        } finally {
            setIsClearingChat(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-full hover:bg-gray-100 transition-colors"
                title="Chat settings"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Modal */}
                    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto border border-gray-100">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                </svg>
                                Chat Settings
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-3">
                                    <span className="text-lg">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-3">
                                    <span className="text-lg">✓</span>
                                    <span>{success}</span>
                                </div>
                            )}

                            {/* Edit Chat Info */}
                            {isAdmin && isGroupChat && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Chat Info
                                    </h4>

                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit Chat
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-700 block mb-1.5">Chat Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter chat name"
                                                    value={chatName}
                                                    onChange={(e) => setChatName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-700 block mb-1.5">Photo URL</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter photo URL"
                                                    value={photoUrl}
                                                    onChange={(e) => setPhotoUrl(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleUpdateChat}
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Divider */}
                            {isAdmin && isGroupChat && isOwner && (
                                <div className="border-t border-gray-200"></div>
                            )}

                            {/* Transfer Ownership */}
                            {isOwner && isGroupChat && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Transfer Ownership
                                    </h4>
                                    <input
                                        type="text"
                                        placeholder="Enter username"
                                        value={transferUsername}
                                        onChange={(e) => setTransferUsername(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <button
                                        onClick={handleTransferOwnership}
                                        disabled={isTransferring}
                                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {isTransferring ? 'Transferring...' : 'Transfer'}
                                    </button>
                                </div>
                            )}

                            {/* Divider */}
                            {isPrivateChat && (
                                <div className="border-t border-gray-200"></div>
                            )}

                            {/* Clear Private Chat */}
                            {isPrivateChat && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Clear Chat History
                                    </h4>
                                    <label className="flex items-center p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={clearForBoth}
                                            onChange={(e) => setClearForBoth(e.target.checked)}
                                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                                        />
                                        <span className="ml-3 text-sm text-gray-700 font-medium">Clear for both participants</span>
                                    </label>
                                    <button
                                        onClick={handleClearChat}
                                        disabled={isClearingChat}
                                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        {isClearingChat ? 'Clearing...' : 'Clear History'}
                                    </button>
                                </div>
                            )}

                            {/* Divider */}
                            {isOwner && (
                                <div className="border-t border-gray-200"></div>
                            )}

                            {/* Delete Chat */}
                            {isOwner && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Danger Zone
                                    </h4>
                                    <button
                                        onClick={handleDeleteChat}
                                        disabled={isDeleting}
                                        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        {isDeleting ? 'Deleting...' : 'Delete Chat'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
