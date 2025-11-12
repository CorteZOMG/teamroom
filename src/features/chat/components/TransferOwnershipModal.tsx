import { useState } from 'react';
import * as chatApi from '../../../api/chat';
import type { ChatMember } from '../../../types';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: number;
  members: ChatMember[];
  onOwnershipTransferred: () => void;
}

export default function TransferOwnershipModal({ isOpen, onClose, chatId, members, onOwnershipTransferred }: TransferOwnershipModalProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransferOwnership = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      await chatApi.transferChatOwnership(chatId, { newOwnerUsername: selectedUser });
      onOwnershipTransferred();
      onClose();
    } catch (err) {
      setError('Помилка при передачі права власності.');
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
          <h2 className="text-lg font-bold">Передача прав власності</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <p>Виберіть нового власника для цього чату:</p>
            <div className="space-y-2">
              {members
                .filter((member) => member.role !== 'OWNER')
                .map((member) => (
                  <div
                    key={member.username}
                    onClick={() => setSelectedUser(member.username)}
                    className={`p-2 rounded-md cursor-pointer ${
                      selectedUser === member.username ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    {member.username}
                  </div>
                ))}
            </div>
            {selectedUser && (
              <button onClick={handleTransferOwnership} className="p-2 bg-primary text-white rounded-md" disabled={isLoading}>
                {isLoading ? 'Передача...' : `Передати права власності ${selectedUser}`}
              </button>
            )}
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
