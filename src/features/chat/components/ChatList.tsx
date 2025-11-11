import { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import * as chatApi from '../../../api/chat';
import { getThumbnailLink } from '../../../api/cloudStorage';
import CreateChatModal from './CreateChatModal';

export default function ChatList() {
  const { chats, setChats, setSelectedChat, selectedChat } = useChat();
  const [modalMode, setModalMode] = useState<'private' | 'group' | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        console.log('Fetching initial chat list...');
        const fetchedChats = await chatApi.getChats();
        console.log('Fetched chats:', fetchedChats);
        setChats(fetchedChats);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };

    fetchChats();
  }, [setChats]);

  return (
    <>
      <div className="w-full md:w-80 border-r border-gray-200 flex-col flex">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 font-montserrat">
            Messages
          </h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setModalMode('group')}
              className="p-2 rounded-full hover:bg-gray-100"
              title="New Group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button 
              onClick={() => setModalMode('private')}
              className="p-2 rounded-full hover:bg-gray-100"
              title="New Message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="font-montserrat">No chats yet. Start a new conversation!</p>
              </div>
            ) : (
              chats.filter(chat => chat && typeof chat.id !== 'undefined').map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedChat?.id === chat.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                       {chat.photoUrl ? (
                         <img
                           src={chat.photoUrl.includes('pcloud.link') ? getThumbnailLink(chat.photoUrl) : chat.photoUrl}
                           alt={chat.name || 'Chat'}
                           className="w-full h-full rounded-full object-cover"
                         />
                       ) : (
                         <span className="text-gray-600 font-bold">
                           {((chat.name || 'C')).charAt(0).toUpperCase()}
                         </span>
                       )}
                     </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate font-montserrat">
                        {chat.name || 'Chat'}
                      </h3>
                      {/* Last message can be added here later */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <CreateChatModal 
        isOpen={modalMode !== null} 
        mode={modalMode}
        onClose={() => setModalMode(null)} 
      />
    </>
  );
}