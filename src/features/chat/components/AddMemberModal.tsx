import { useState } from 'react';
import * as userApi from '../../../api/user';
import * as chatApi from '../../../api/chat';
import type { UserSearchResult, ChatRole } from '../../../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: number;
  onMemberAdded: () => void;
}

export default function AddMemberModal({ isOpen, onClose, chatId, onMemberAdded }: AddMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<ChatRole>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setIsLoading(true);
    try {
      const results = await userApi.searchUsers(searchTerm);
      setSearchResults(results);
      setError(null);
    } catch (err) {
      setError('Failed to search for users.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      await chatApi.addChatMember(chatId, { username: selectedUser.username, role });
      onMemberAdded();
      onClose();
    } catch (err) {
      setError('Failed to add member.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold">Add New Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter username"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <button onClick={handleSearch} className="p-2 bg-primary text-white rounded-md">
                Search
              </button>
            </div>
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.username}
                  onClick={() => setSelectedUser(user)}
                  className={`p-2 rounded-md cursor-pointer ${
                    selectedUser?.username === user.username ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  {user.username}
                </div>
              ))}
            </div>
            {selectedUser && (
              <div className="flex gap-2 items-center">
                <select value={role} onChange={(e) => setRole(e.target.value as ChatRole)} className="p-2 border border-gray-300 rounded-md">
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button onClick={handleAddMember} className="p-2 bg-primary text-white rounded-md">
                  Add {selectedUser.username}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
