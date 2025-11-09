import webSocketService from '../../../services/websocket';
import { useChat } from '../context/ChatContext';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  messageId: number;
  onClose: () => void;
}

export default function ReactionPicker({ messageId, onClose }: ReactionPickerProps) {
  const { selectedChat } = useChat();

  const handleEmojiClick = (emoji: string) => {
    if (selectedChat) {
      console.log(`Sending reaction: ${emoji} to message ${messageId} in chat ${selectedChat.id}`);
      webSocketService.sendReaction(selectedChat.id, { messageId, emoji });
    }
    onClose();
  };

  return (
    <div className="absolute bottom-full mb-2 bg-white border rounded-full shadow-lg p-1 flex space-x-1">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className="text-xl p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}