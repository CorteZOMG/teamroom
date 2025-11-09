import { useState, useEffect, useCallback } from 'react';
import * as userApi from '../../../api/user';
import * as chatApi from '../../../api/chat';
import type { UserSearchResult } from '../../../types';

interface CreateChatModalProps {
  isOpen: boolean;
  mode: 'private' | 'group' | null;
  onClose: () => void;
}

// Simple debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: number;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = window.setTimeout(() => resolve(func(...args)), waitFor);
        });
}

const UserSearchInput = ({ onSelectUser }: { onSelectUser: (user: UserSearchResult) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (query.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const results = await userApi.searchUsers(query);
                setSearchResults(results);
                setError(null);
            } catch (err) {
                setError('Failed to search for users.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    return (
        <div>
            <input
                type="text"
                placeholder="Search for users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="mt-2 max-h-40 overflow-y-auto">
                {isLoading && <p className="text-sm text-gray-500">Searching...</p>}
                {searchResults.map(user => (
                    <div 
                        key={user.username} 
                        className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                            onSelectUser(user);
                            setSearchQuery('');
                            setSearchResults([]);
                        }}
                    >
                        <div className="flex-shrink-0">
                            {user.profile?.photoUrl ? (
                                <img src={user.profile.photoUrl} alt={user.username} className="w-8 h-8 rounded-full mr-3 object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full mr-3 bg-gray-300 flex items-center justify-center">
                                    <span className="font-bold text-gray-600">
                                        {((user.profile?.firstName || user.username) || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span>{user.profile?.firstName || user.username} {user.profile?.lastName}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PrivateChatCreator = ({ onClose }: { onClose: () => void }) => {
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreatePrivateChat = async (user: UserSearchResult) => {
        setIsCreating(true);
        setError(null);
        console.log(`Creating private chat with ${user.username}`);
        try {
            await chatApi.createPrivateChat({ username: user.username });
            console.log('Successfully requested private chat creation.');
            // The websocket notification will handle adding the chat to the list
            onClose();
        } catch (err) {
            setError('Failed to create chat. The user may not exist or a chat already exists.');
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-600 mb-2">Find a user to start a one-on-one conversation.</p>
            {error && <p className="text-red-500 text-sm my-2">{error}</p>}
            <UserSearchInput onSelectUser={handleCreatePrivateChat} />
            {isCreating && <p className="text-sm text-gray-500 mt-2">Creating chat...</p>}
        </div>
    );
};

const GroupChatCreator = ({ onClose }: { onClose: () => void }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSelectUser = (user: UserSearchResult) => {
        if (!selectedMembers.find(m => m.username === user.username)) {
            setSelectedMembers(prev => [...prev, user]);
        }
    };

    const handleRemoveMember = (username: string) => {
        setSelectedMembers(prev => prev.filter(m => m.username !== username));
    };

    const handleCreateGroupChat = async () => {
        if (!groupName.trim()) {
            setError('Group name is required.');
            return;
        }
        if (selectedMembers.length === 0) {
            setError('You must add at least one member.');
            return;
        }
        
        setIsCreating(true);
        setError(null);
        console.log(`Creating group chat "${groupName}"`);

        try {
            const memberUsernames = selectedMembers.map(m => m.username);
            await chatApi.createGroupChat({ name: groupName, memberUsernames });
            console.log('Successfully requested group chat creation.');
            
            // The websocket notification will handle adding the chat to the list
            onClose();
        } catch (err) {
            setError('Failed to create group chat.');
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isCreating}
            />
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Add Members</h3>
                <UserSearchInput onSelectUser={handleSelectUser} />
            </div>
            {selectedMembers.length > 0 && (
                <div className="border rounded-lg p-2 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Members</h4>
                    {selectedMembers.map(member => (
                        <div key={member.username} className="flex items-center justify-between bg-gray-100 p-1 rounded">
                            <span className="text-sm">{member.username}</span>
                            <button onClick={() => handleRemoveMember(member.username)} className="text-red-500 hover:text-red-700" disabled={isCreating}>
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button 
                onClick={handleCreateGroupChat}
                className="w-full bg-primary text-white p-2 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400"
                disabled={isCreating}
            >
                {isCreating ? 'Creating...' : 'Create Group'}
            </button>
        </div>
    );
};


export default function CreateChatModal({ isOpen, mode, onClose }: CreateChatModalProps) {

  if (!isOpen || !mode) {
    return null;
  }

  const title = mode === 'private' ? 'New Message' : 'Create Group Chat';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="p-4">
          {mode === 'private' ? (
            <PrivateChatCreator onClose={onClose} />
          ) : (
            <GroupChatCreator onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
