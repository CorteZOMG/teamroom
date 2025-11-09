import { createContext, useContext, useState, type ReactNode, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { UserChatView, ChatMessage, UserMessage, Reaction, ChatDetails } from '../../../types';
import * as chatApi from '../../../api/chat';

// Add tempId to ChatMessage for optimistic UI
export type TempChatMessage = ChatMessage & { tempId?: string };

interface ChatContextType {
  chats: UserChatView[];
  setChats: Dispatch<SetStateAction<UserChatView[]>>;
  selectedChat: ChatDetails | null;
  isChatLoading: boolean;
  setSelectedChat: (chat: UserChatView | null) => Promise<void>;
  addNewChat: (chat: UserChatView) => Promise<void>;
  messages: TempChatMessage[];
  setMessages: Dispatch<SetStateAction<TempChatMessage[]>>;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (message: ChatMessage) => void;
  markMessageAsDeleted: (messageId: number, deletedAt: string) => void;
  addOptimisticMessage: (message: Omit<UserMessage, 'id' | 'sentAt' | 'type'>) => string;
  typingUsers: string[];
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
  reactions: Map<number, Reaction[]>;
  setReactions: (reactions: Map<number, Reaction[]>) => void;
    addReaction: (reaction: Reaction) => void;
    loadReactions: (messages: ChatMessage[]) => void;
  }
  
  const ChatContext = createContext<ChatContextType | undefined>(undefined);
  
  export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
      throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
  };
  
  export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [chats, setChats] = useState<UserChatView[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatDetails | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [messages, setMessages] = useState<TempChatMessage[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [reactions, setReactions] = useState<Map<number, Reaction[]>>(new Map());
  
    const handleSetSelectedChat = useCallback(async (chat: UserChatView | null) => {
      console.log('Attempting to select chat:', chat);
      if (chat === null || typeof chat.id === 'undefined') {
        setSelectedChat(null);
        return;
      }
      
      setIsChatLoading(true);
      try {
        console.log(`Fetching details for chat ID: ${chat.id}`);
        const chatDetails = await chatApi.getChatDetails(chat.id);
        console.log('Successfully fetched chat details:', chatDetails);
        setSelectedChat(chatDetails);
      } catch (error) {
        console.error("Failed to fetch chat details:", error);
        setSelectedChat(null); // Reset on error
      } finally {
        setIsChatLoading(false);
        console.log('Finished chat selection process.');
      }
    }, []);
  
    const addNewChat = useCallback(async (newChat: UserChatView) => {
      console.log('Adding new chat to context:', newChat);
      const chatExists = chats.some(chat => chat.id === newChat.id);
      
      if (chatExists) {
        console.log('Chat already exists. Selecting it.');
      } else {
        console.log('Chat is new. Adding to chat list.');
        setChats(prevChats => [newChat, ...prevChats]);
      }
      
      await handleSetSelectedChat(newChat);
    }, [chats, handleSetSelectedChat]);
  
    const addMessage = useCallback((message: ChatMessage) => {
      setMessages((prevMessages) => {
          // Replace optimistic message if it exists
          const optimisticIndex = prevMessages.findIndex(m => m.tempId && m.id === -1);
          if (optimisticIndex !== -1) {
              const newMessages = [...prevMessages];
              newMessages[optimisticIndex] = message;
              return newMessages;
          }
          // Or just add the new message
          if (!prevMessages.some(m => m.id === message.id)) {
            return [...prevMessages, message];
          }
          return prevMessages;
      });
    }, []);
  
    const updateMessage = useCallback((message: ChatMessage) => {
      setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    }, []);
  
    const markMessageAsDeleted = useCallback((messageId: number, deletedAt: string) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted', editedAt: deletedAt }
            : msg
        )
      );
    }, []);
  
    const addOptimisticMessage = useCallback((message: Omit<UserMessage, 'id' | 'sentAt' | 'type'>) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: TempChatMessage = {
          ...message,
          id: -1,
          sentAt: new Date().toISOString(),
          type: 'USER_MESSAGE',
          reactions: [],
          tempId,
      };
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      return tempId;
    }, []);
  
    const addTypingUser = useCallback((username: string) => {
      setTypingUsers((prev) => [...new Set([...prev, username])]);
    }, []);
  
    const removeTypingUser = useCallback((username: string) => {
      setTypingUsers((prev) => prev.filter((user) => user !== username));
    }, []);
  
    const addReaction = useCallback((reaction: Reaction) => {
      console.log('ChatContext: adding reaction', reaction);
      setReactions(prevReactions => {
        const newReactions = new Map(prevReactions);
        const messageReactions = newReactions.get(reaction.messageId) || [];
        
        const existingReactionIndex = messageReactions.findIndex(r => r.username === reaction.username);
        
        if (existingReactionIndex !== -1) {
          messageReactions[existingReactionIndex] = reaction;
        } else {
          messageReactions.push(reaction);
        }
        
        newReactions.set(reaction.messageId, messageReactions);
        console.log('ChatContext: new reactions map', newReactions);
        return newReactions;
      });
    }, []);
  
    const loadReactions = useCallback((messagesToLoad: ChatMessage[]) => {
      console.log('ChatContext: loading reactions from fetched messages');
      setReactions(prevReactions => {
        const newReactions = new Map(prevReactions);
        messagesToLoad.forEach(message => {
          if (message.reactions && message.reactions.length > 0) {
            newReactions.set(message.id, message.reactions);
          }
        });
        console.log('ChatContext: new reactions map after load', newReactions);
        return newReactions;
      });
    }, []);
  
    const value = {
      chats,
      setChats,
      selectedChat,
      isChatLoading,
      setSelectedChat: handleSetSelectedChat,
      addNewChat,
      messages,
      setMessages,
      addMessage,
      updateMessage,
      markMessageAsDeleted,
      addOptimisticMessage,
      typingUsers,
      addTypingUser,
      removeTypingUser,
      reactions,
      setReactions,
      addReaction,
      loadReactions,
    };  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};