import { useState, useEffect } from 'react';
import { getCourseChats } from '../api/chat';
import type { UserChatView } from '../types/chat';
import ChatWindow from '../features/chat/components/ChatWindow';
import { ChatProvider, useChat } from '../features/chat/context/ChatContext';

interface FeedTabProps {
  courseId: number;
}

function FeedTabContent({ courseId }: FeedTabProps) {
  const { selectedChat, setSelectedChat } = useChat();
  const [mainChat, setMainChat] = useState<UserChatView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMainChat();
  }, [courseId]);

  const loadMainChat = async () => {
    try {
      setLoading(true);
      const courseChats = await getCourseChats(courseId);
      // Find the main course chat
      const main = courseChats.find(chat => chat.type === 'MAIN_COURSE_CHAT');
      setMainChat(main || null);
    } catch (err) {
      console.error('Error loading main course chat:', err);
      setError('Failed to load course feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading feed...</div>;
  }

  if (!mainChat) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="font-montserrat">Main course chat not found</p>
      </div>
    );
  }

  // If a chat is selected, show the chat interface
  if (selectedChat) {
    return (
      <div className="flex h-full flex-col">
        <button
          onClick={() => setSelectedChat(null)}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 font-montserrat flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </button>
        <ChatWindow />
      </div>
    );
  }

  // Show main chat when feed tab is opened
  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <div
        onClick={() => setSelectedChat(mainChat)}
        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer hover:border-primary mb-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {mainChat.photoUrl ? (
              <img
                src={mainChat.photoUrl}
                alt={mainChat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {(mainChat.name || 'C').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate font-montserrat text-lg">
              {mainChat.name || 'Main Chat'}
            </h3>
            <p className="text-sm text-gray-500">
              Click to open course feed and system messages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedTab(props: FeedTabProps) {
  return (
    <ChatProvider>
      <FeedTabContent {...props} />
    </ChatProvider>
  );
}
