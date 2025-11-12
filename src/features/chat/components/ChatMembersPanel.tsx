import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import * as chatApi from '../../../api/chat';
import type { ChatMember, ChatRole } from '../../../types';
import AddMemberModal from './AddMemberModal';
import TransferOwnershipModal from './TransferOwnershipModal';

const roleColors = {
  OWNER: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-500' },
  ADMIN: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500' },
  MODERATOR: { bg: 'bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-500' },
  MEMBER: { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-500' },
  VIEWER: { bg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-500' },
};

export default function ChatMembersPanel() {
  const { selectedChat, setSelectedChat } = useChat();
  const { getUsername } = useAuth();
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<ChatRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isTransferOwnershipModalOpen, setIsTransferOwnershipModalOpen] = useState(false);

  const currentUsername = getUsername();
  const isGroupChat = selectedChat?.type === 'GROUP' || selectedChat?.type === 'COURSE_CHAT' || selectedChat?.type === 'MAIN_COURSE_CHAT';
  const isCourseChat = selectedChat?.courseId !== null && selectedChat?.courseId !== undefined;
  const isAdmin = selectedChat?.role === 'ADMIN' || selectedChat?.role === 'OWNER';
  const isOwner = selectedChat?.role === 'OWNER';

  useEffect(() => {
    if (selectedChat?.id && isGroupChat) {
      fetchMembers();
    }
  }, [selectedChat?.id, isGroupChat]);

  const fetchMembers = async () => {
    if (!selectedChat?.id) return;
    
    setIsLoading(true);
    try {
      const membersList = await chatApi.getChatMembers(selectedChat.id);
      setMembers(membersList);
      setError(null);
      } catch (err) {
      setError('Помилка при завантаженні членів');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (username: string) => {
    if (!selectedChat?.id) return;
    
    if (!window.confirm(`Видалити ${username} з чату?`)) return;

    try {
      await chatApi.removeChatMember(selectedChat.id, username);
      setMembers(prev => prev.filter(m => m.username !== username));
      setError(null);
      setSuccess(`${username} було видалено`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Помилка при видаленні члена');
      console.error(err);
    }
  };

  const handleUpdateRole = async (username: string) => {
    if (!selectedChat?.id || !newRole) return;

    try {
      await chatApi.updateChatMemberRole(selectedChat.id, username, { role: newRole });
      setMembers(prev =>
        prev.map(m => m.username === username ? { ...m, role: newRole } : m)
      );
      setEditingMember(null);
      setError(null);
      setSuccess(`Роль оновлена на ${newRole}`);
      setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
      setError('Помилка при оновленні ролі члена');
      console.error(err);
      }
      };

  const handleLeaveChat = async () => {
    if (!selectedChat?.id) return;

    if (!window.confirm('Покинути цей чат?')) return;

    try {
      await chatApi.leaveChat(selectedChat.id);
      setSelectedChat(null);
    } catch (err) {
      setError('Помилка при виході з чату');
      console.error(err);
    }
  };

  const handleMemberAdded = () => {
    fetchMembers();
  };

  const handleOwnershipTransferred = () => {
    fetchMembers();
  };

  if (!isGroupChat) {
    return null;
  }

  const getRoleColor = (role: ChatRole) => roleColors[role] || roleColors.MEMBER;
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { OWNER: 0, ADMIN: 1, MODERATOR: 2, MEMBER: 3, VIEWER: 4 };
    return (roleOrder[a.role] ?? 5) - (roleOrder[b.role] ?? 5);
  });

  return (
    <>
      <div className="w-80 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3a6 6 0 016-6h6a6 6 0 016 6h-12zm0 0a6 6 0 016-6h-6a6 6 0 00-6 6m12 0h-12" />
                </svg>
                Члени
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{members.length} {members.length === 1 ? 'член' : 'членів'}</p>
            </div>
            {isAdmin && !isCourseChat && (
              <button onClick={() => setIsAddMemberModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <span className="text-lg mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-2">
              <span className="text-lg mt-0.5">✓</span>
              <span>{success}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Завантаження членів...</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {sortedMembers.map(member => {
                const colors = getRoleColor(member.role);
                const isCurrentUser = member.username === currentUsername;
                
                return (
                  <div key={member.username} className="group">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      {/* Avatar */}
                      <div className={`w-10 h-10 ${colors.badge} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {member.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-semibold text-primary">(Ви)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {member.role === 'OWNER' && '👑'}
                            {member.role === 'ADMIN' && '⚙️'}
                            {member.role === 'MODERATOR' && '📋'}
                            {member.role === 'MEMBER' && '👤'}
                            {member.role === 'VIEWER' && '👁️'}
                            {' '}{member.role}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {isAdmin && !isCurrentUser && !isCourseChat && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingMember === member.username ? (
                            <>
                              <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as ChatRole)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="MEMBER">Член</option>
                                <option value="MODERATOR">Модератор</option>
                                <option value="ADMIN">Адміністратор</option>
                              </select>
                              <button
                                onClick={() => handleUpdateRole(member.username)}
                                className="text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-md transition-colors font-medium"
                                title="Зберегти"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingMember(null)}
                                className="text-xs bg-gray-400 hover:bg-gray-500 text-white px-2.5 py-1 rounded-md transition-colors font-medium"
                                title="Скасувати"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingMember(member.username);
                                  setNewRole(member.role);
                                }}
                                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded-md transition-colors font-medium"
                                title="Edit role"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.username)}
                                className="text-xs bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-md transition-colors font-medium"
                                title="Remove from chat"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          {isOwner && !isCourseChat && (
            <button
              onClick={() => setIsTransferOwnershipModalOpen(true)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              Передати право власності
            </button>
          )}
          {!isCourseChat && (
            <button
              onClick={handleLeaveChat}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Покинути чат
            </button>
          )}
          {isCourseChat && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs text-center">
              Члени керуються реєстрацією на курс
            </div>
          )}
        </div>
      </div>
      {selectedChat && (
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          chatId={selectedChat.id}
          onMemberAdded={handleMemberAdded}
        />
      )}
      {selectedChat && (
        <TransferOwnershipModal
          isOpen={isTransferOwnershipModalOpen}
          onClose={() => setIsTransferOwnershipModalOpen(false)}
          chatId={selectedChat.id}
          members={members}
          onOwnershipTransferred={handleOwnershipTransferred}
        />
      )}
    </>
  );
}
