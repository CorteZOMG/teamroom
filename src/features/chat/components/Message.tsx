import { useState, useEffect } from 'react';
import type { ChatMessage, UserJoinedLeftContent, MaterialContent, AssignmentContent, Reaction } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../context/ChatContext';
import RelatedEntityCard from './RelatedEntityCard';
import ReactionPicker from './ReactionPicker';
import webSocketService from '../../../services/websocket';
import * as chatApi from '../../../api/chat';
import { getProfileByUsername } from '../../../api/client';

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
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        if (message.username && message.type === 'USER_MESSAGE' && !isCurrentUser) {
            getProfileByUsername(message.username)
                .then(setUserProfile)
                .catch(error => console.error('Failed to load user profile:', error));
        }
    }, [message.username, message.type]);

    const isCurrentUser = message.type === 'USER_MESSAGE' && message.username === currentUsername;

    if (message.type !== 'USER_MESSAGE') {
        return <SystemMessage message={message} />;
    }
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

    const handlePinMessage = async () => {
        if (selectedChat) {
            try {
                // Use the non-WebSocket API for pinning since it's a management action
                await chatApi.pinMessage(selectedChat.id, { messageId: message.id });
            } catch (error) {
                console.error('Failed to pin message:', error);
                alert('Failed to pin message');
            }
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
        <div className={`group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} my-2 relative gap-1`}>
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md overflow-visible ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs overflow-hidden ${isCurrentUser ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
                        }`}
                >
                    {userProfile?.photoUrl && !isCurrentUser ? (
                        <img
                            src={userProfile.photoUrl}
                            alt={message.username || ''}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span>{(message.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                </div>

                {/* Message Content */}
                <div className="flex-1">
                    <div className={`relative rounded-xl px-4 py-2.5 shadow-sm ${isCurrentUser ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                        {!isCurrentUser && (
                            <p className="text-xs font-semibold opacity-70 mb-1">{message.username}</p>
                        )}

                        {isEditing ? (
                            <div>
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full p-2 border rounded text-black text-sm"
                                />
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors">Cancel</button>
                                    <button onClick={handleEdit} className="text-xs px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors font-medium">Save</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-montserrat break-words leading-relaxed">{message.content}</p>
                        )}

                        {courseId && message.relatedEntities && message.relatedEntities.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {message.relatedEntities.map(entity => (
                                    <RelatedEntityCard key={`${entity.relatedEntityType}-${entity.relatedEntityId}`} entity={entity} courseId={courseId} />
                                ))}
                            </div>
                        )}
                        {messageReactions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-opacity-30 border-current">
                                <ReactionsDisplay reactions={messageReactions} />
                            </div>
                        )}
                    </div>
                    <p className={`text-xs mt-1.5 ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-500 font-medium`}>
                        {new Date(message.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {message.editedAt && <span className="italic ml-2">(edited)</span>}
                    </p>
                </div>
            </div>

            {/* Action Buttons - constrained within parent */}
            {!isEditing && (
                <div className={`hidden group-hover:flex gap-1 ml-2 flex-shrink-0 ${isCurrentUser ? 'mr-2 order-first' : ''}`}>
                    <button
                        onClick={() => setShowReactionPicker(prev => !prev)}
                        className="p-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                        title="Add reaction"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button
                        onClick={() => handlePinMessage()}
                        className="p-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                        title="Pin message"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </button>
                    {isCurrentUser && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                                title="Edit message"
                            >
                                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1.5 rounded-full bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                                title="Delete message"
                            >
                                <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </>
                    )}
                </div>
            )}
            {showReactionPicker && (
                <div className="absolute top-0 right-0 z-10">
                    <ReactionPicker messageId={message.id} onClose={() => setShowReactionPicker(false)} />
                </div>
            )}
        </div>
    );
}