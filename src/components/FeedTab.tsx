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
      // Automatically select the main chat on load
      if (main) {
        setSelectedChat(main);
      }
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

  // Always show the chat interface since main chat is auto-selected
  if (selectedChat) {
    return <ChatWindow />;
  }

  // Show error if main chat failed to load
  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
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
