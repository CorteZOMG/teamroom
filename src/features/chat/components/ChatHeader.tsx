import { useChat } from '../context/ChatContext';
import type { ChatMember } from '../../../types';
import { useEffect, useState } from 'react';
import * as chatApi from '../../../api/chat';
import { getThumbnailLink } from '../../../api/cloudStorage';
import ChatSettings from './ChatSettings';
import PinnedMessages from './PinnedMessages';

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
    const isGroupChat = selectedChat.type === 'GROUP' || selectedChat.type === 'COURSE_CHAT' || selectedChat.type === 'MAIN_COURSE_CHAT';

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {/* Chat Avatar */}
                    <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-md overflow-hidden ring-2 ring-white">
                            {selectedChat.photoUrl ? (
                                <img
                                    src={selectedChat.photoUrl.includes('pcloud.link') ? getThumbnailLink(selectedChat.photoUrl) : selectedChat.photoUrl}
                                    alt={selectedChat.name || 'Chat'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-bold text-lg">
                                    {(selectedChat.name || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        {isGroupChat && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                            {selectedChat.name || 'Chat'}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">
                            {isGroupChat ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    Private chat
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                    <PinnedMessages />
                    <ChatSettings />
                </div>
            </div>
        </div>
    );
}