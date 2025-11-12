import { useState, useEffect } from 'react';
import { getCourseChats, createCourseChat } from '../api/chat';
import type { UserChatView } from '../types/chat';
import ChatWindow from '../features/chat/components/ChatWindow';
import { ChatProvider, useChat } from '../features/chat/context/ChatContext';

interface CourseChatsTabProps {
  courseId: number;
  userRole?: string;
}

function CourseChatsContent({ courseId, userRole }: CourseChatsTabProps) {
  const { selectedChat, setSelectedChat } = useChat();
  const [chats, setChats] = useState<UserChatView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chatName, setChatName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const canCreateChat = userRole === 'OWNER' || userRole === 'PROFESSOR';

  useEffect(() => {
    loadChats();
  }, [courseId]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const courseChats = await getCourseChats(courseId);
      setChats(courseChats);
    } catch (err) {
      console.error('Error loading course chats:', err);
      setError('Failed to load course chats');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName.trim()) {
      setError('Chat name is required');
      return;
    }

    try {
      setIsCreating(true);
      await createCourseChat(courseId, { name: chatName });
      setChatName('');
      setShowCreateModal(false);
      await loadChats();
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create chat');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectChat = async (chat: UserChatView) => {
    try {
      await setSelectedChat(chat);
    } catch (err) {
      console.error('Error loading chat details:', err);
      setError('Failed to load chat');
    }
  };

  const handleChatClose = async () => {
    await setSelectedChat(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading chats...</div>;
  }

  // If a chat is selected, show the chat interface
  if (selectedChat) {
    return (
      <div className="flex h-full flex-col">
        <button
          onClick={handleChatClose}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 font-montserrat flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Повернутися до чатів
        </button>
        <ChatWindow />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 font-montserrat">Чати курсу</h2>
        {canCreateChat && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-montserrat"
          >
            + Новий чат
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {chats.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p className="font-montserrat">Поки що немає чатів</p>
          {canCreateChat && <p className="text-sm mt-2">Створіть перший чат для цього курсу</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {chat.photoUrl ? (
                    <img
                      src={chat.photoUrl}
                      alt={chat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {(chat.name || 'C').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="font-semibold text-gray-900 truncate font-montserrat">
                     {chat.name || 'Unnamed Chat'}
                   </h3>
                  <p className="text-xs text-gray-500">
                    {chat.type === 'MAIN_COURSE_CHAT' ? 'Main Chat' : 'Chat'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 font-montserrat">
              Створити новий чат
            </h3>
            <form onSubmit={handleCreateChat}>
              <input
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Назва чату"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary font-montserrat"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setChatName('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-montserrat"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors font-montserrat"
                >
                  {isCreating ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseChatsTab(props: CourseChatsTabProps) {
  return (
    <ChatProvider>
      <CourseChatsContent {...props} />
    </ChatProvider>
  );
}
