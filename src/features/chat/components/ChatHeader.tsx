import { useChat } from '../context/ChatContext';
import type { ChatMember } from '../../../types';
import { useEffect, useState } from 'react';
import * as chatApi from '../../../api/chat';

export default function ChatHeader() {
    const { selectedChat } = useChat();
    const [members, setMembers] = useState<ChatMember[]>([]);

    useEffect(() => {
        if (selectedChat?.id && selectedChat.type !== 'PRIVATE') {
            chatApi.getChatMembers(selectedChat.id).then(setMembers);
        } else {
            setMembers([]);
        }
    }, [selectedChat]);

    if (!selectedChat) {
        return null;
    }

    const memberCount = selectedChat.type === 'PRIVATE' ? 2 : members.length;

    return (
        <div className="p-4 border-b flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {selectedChat.photoUrl ? (
                    <img
                        src={selectedChat.photoUrl}
                        alt={selectedChat.name || 'Chat'}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <span className="text-gray-600 font-bold">
                        {(selectedChat.name || '?').charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <div>
                <h2 className="text-xl font-bold">{selectedChat.name || 'Chat'}</h2>
                <p className="text-sm text-gray-500">{memberCount} members</p>
            </div>
        </div>
    );
}