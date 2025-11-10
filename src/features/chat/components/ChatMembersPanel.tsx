import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import * as chatApi from '../../../api/chat';
import type { ChatMember, ChatRole } from '../../../types';

export default function ChatMembersPanel() {
  const { selectedChat, setSelectedChat } = useChat();
  const { getUsername } = useAuth();
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<ChatRole>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const currentUsername = getUsername();
  const isGroupChat = selectedChat?.type === 'GROUP' || selectedChat?.type === 'COURSE_CHAT';
  const isAdmin = selectedChat?.role === 'ADMIN' || selectedChat?.role === 'OWNER';

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
      setError('Failed to load members');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (username: string) => {
    if (!selectedChat?.id) return;
    
    if (!window.confirm(`Remove ${username} from chat?`)) return;

    try {
      await chatApi.removeChatMember(selectedChat.id, username);
      setMembers(prev => prev.filter(m => m.username !== username));
      setError(null);
    } catch (err) {
      setError('Failed to remove member');
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
    } catch (err) {
      setError('Failed to update member role');
      console.error(err);
    }
  };

  const handleLeaveChat = async () => {
    if (!selectedChat?.id) return;

    if (!window.confirm('Leave this chat?')) return;

    try {
      await chatApi.leaveChat(selectedChat.id);
      setSelectedChat(null);
    } catch (err) {
      setError('Failed to leave chat');
      console.error(err);
    }
  };

  if (!isGroupChat) {
    return null;
  }

  return (
    <div className="border-l border-gray-200 w-80 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg">Members ({members.length})</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}

          {isLoading ? (
            <div className="text-center text-gray-500">Loading members...</div>
          ) : (
            members.map(member => (
              <div key={member.username} className="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                <div className="flex-1">
                  <p className="font-medium text-sm">{member.username}</p>
                  <p className="text-xs text-gray-500">
                    {editingMember === member.username ? (
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as ChatRole)}
                        className="text-xs p-1 border rounded"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span>{member.role}</span>
                    )}
                  </p>
                </div>

                {isAdmin && member.username !== currentUsername && (
                  <div className="flex space-x-1">
                    {editingMember === member.username ? (
                      <>
                        <button
                          onClick={() => handleUpdateRole(member.username)}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMember(null)}
                          className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingMember(member.username);
                            setNewRole(member.role);
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.username)}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          <div className="pt-4 border-t">
            <button
              onClick={handleLeaveChat}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 text-sm font-medium"
            >
              Leave Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
