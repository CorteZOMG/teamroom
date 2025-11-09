import { useState } from 'react';
import type { ChatMessage, UserJoinedLeftContent, MaterialContent, AssignmentContent, Reaction } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../context/ChatContext';
import RelatedEntityCard from './RelatedEntityCard';
import ReactionPicker from './ReactionPicker';
import webSocketService from '../../../services/websocket';

// ... (SystemMessage and ReactionsDisplay components remain the same)

const SystemMessage = ({ message }: { message: ChatMessage }) => {
    let content = message.content || '';
    try {
        const parsedContent = JSON.parse(content);
        switch (message.type) {
            case 'USER_JOINED_TO_CHAT':
                content = `${(parsedContent as UserJoinedLeftContent).username} joined the chat`;
                break;
            case 'USER_LEFT_FROM_CHAT':
                content = `${(parsedContent as UserJoinedLeftContent).username} left the chat`;
                break;
            case 'COURSE_OPENED':
                content = 'The course has been opened';
                break;
            case 'COURSE_CLOSED':
                content = 'The course has been closed';
                break;
            case 'MATERIAL_CREATED':
                content = `New material created: ${(parsedContent as MaterialContent).materialTopic}`;
                break;
            case 'MATERIAL_UPDATED':
                content = `Material updated: ${(parsedContent as MaterialContent).materialTopic}`;
                break;
            case 'MATERIAL_DELETED':
                content = `Material deleted: ${(parsedContent as MaterialContent).materialTopic}`;
                break;
            case 'ASSIGNMENT_CREATED':
                content = `New assignment: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                break;
            case 'ASSIGNMENT_UPDATED':
                content = `Assignment updated: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                break;
            case 'ASSIGNMENT_DELETED':
                content = `Assignment deleted: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                break;
            case 'ASSIGNMENT_DEADLINE_IN_24HR':
                content = `Assignment deadline in 24 hours: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                break;
            case 'ASSIGNMENT_DEADLINE_ENDED':
                content = `Assignment deadline has ended: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                break;
            default:
                break;
        }
    } catch (error) {
        // content is not a JSON string, so use it as is
    }

    return (
        <div className="flex justify-center">
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-montserrat my-2">
                {content}
            </div>
        </div>
    );
};

const ReactionsDisplay = ({ reactions }: { reactions: Reaction[] }) => {
    if (!reactions || reactions.length === 0) {
        return null;
    }

    const groupedReactions = reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="flex space-x-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, count]) => (
                <div key={emoji} className="flex items-center bg-gray-200 rounded-full px-2 py-0.5">
                    <span className="text-sm">{emoji}</span>
                    <span className="text-xs text-gray-600 ml-1">{count}</span>
                </div>
            ))}
        </div>
    );
};

export default function Message({ message }: { message: ChatMessage }) {
    const { getUsername } = useAuth();
    const { selectedChat, reactions } = useChat();
    const currentUsername = getUsername();
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content || '');

    if (message.type !== 'USER_MESSAGE') {
        return <SystemMessage message={message} />;
    }

    const isCurrentUser = message.username === currentUsername;
    const courseId = selectedChat?.courseId;
    const messageReactions = reactions.get(message.id) || [];

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            if (selectedChat) {
                webSocketService.deleteMessage(selectedChat.id, { messageId: message.id });
            }
        }
    };

    const handleEdit = () => {
        if (selectedChat && editedContent.trim()) {
            webSocketService.editMessage(selectedChat.id, { messageId: message.id, content: editedContent.trim() });
            setIsEditing(false);
        }
    };

    if (message.isDeleted) {
        return (
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className="rounded-lg px-3 py-2 my-1 text-sm text-gray-500 italic">
                    This message was deleted
                </div>
            </div>
        );
    }

    return (
        <div className={`group relative flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md my-1 overflow-hidden ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCurrentUser ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
                }`}>
                    <span className="text-xs font-bold">{(message.username || 'U').charAt(0).toUpperCase()}</span>
                </div>

                <div className="flex-1">
                    <div className={`relative rounded-lg px-3 py-2 ${
                        isCurrentUser ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                        {!isCurrentUser && (
                            <p className="text-xs font-medium opacity-75 mb-1">{message.username}</p>
                        )}
                        
                        {isEditing ? (
                            <div>
                                <textarea 
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full p-2 border rounded text-black"
                                />
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 rounded bg-gray-300">Cancel</button>
                                    <button onClick={handleEdit} className="text-xs px-2 py-1 rounded bg-primary text-white">Save</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-montserrat break-words">{message.content}</p>
                        )}
                        
                        {courseId && message.relatedEntities && message.relatedEntities.length > 0 && (
                            <div className="mt-2">
                                {message.relatedEntities.map(entity => (
                                    <RelatedEntityCard key={`${entity.relatedEntityType}-${entity.relatedEntityId}`} entity={entity} courseId={courseId} />
                                ))}
                            </div>
                        )}
                        <ReactionsDisplay reactions={messageReactions} />
                    </div>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-500`}>
                        {new Date(message.sentAt).toLocaleTimeString()}
                        {message.editedAt && <span className="italic ml-1">(edited)</span>}
                    </p>
                </div>
            </div>
            
            {!isEditing && (
                <div className={`absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} p-2 flex opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button onClick={() => setShowReactionPicker(prev => !prev)} className="p-1 rounded-full hover:bg-gray-200">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    {isCurrentUser && (
                        <>
                            <button onClick={() => setIsEditing(true)} className="p-1 rounded-full hover:bg-gray-200">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 5.232z" /></svg>
                            </button>
                            <button onClick={handleDelete} className="p-1 rounded-full hover:bg-gray-200">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                    {showReactionPicker && (
                        <ReactionPicker messageId={message.id} onClose={() => setShowReactionPicker(false)} />
                    )}
                </div>
            )}
        </div>
    );
}