import { useState, useEffect } from 'react';
import type { ChatMessage, UserJoinedLeftContent, MaterialContent, AssignmentContent, Reaction } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../context/ChatContext';
import RelatedEntityCard from './RelatedEntityCard';
import ReactionPicker from './ReactionPicker';
import webSocketService from '../../../services/websocket';
import * as chatApi from '../../../api/chat';
import { getProfileByUsername } from '../../../api/client';

interface ConferenceContent {
  conferenceSubject: string;
}

// ... (SystemMessage and ReactionsDisplay components remain the same)

const SystemMessage = ({ message }: { message: ChatMessage }) => {
    let content = message.content || '';
    let icon = '';
    let bgColor = 'bg-blue-50';
    let textColor = 'text-blue-700';
    let borderColor = 'border-blue-200';

    try {
        const parsedContent = JSON.parse(content);
        switch (message.type) {
            case 'USER_JOINED_TO_CHAT':
                content = `${(parsedContent as UserJoinedLeftContent).username} приєднався до чату`;
                icon = '👋';
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
                borderColor = 'border-green-200';
                break;
            case 'USER_LEFT_FROM_CHAT':
                content = `${(parsedContent as UserJoinedLeftContent).username} покинув чат`;
                icon = '👋';
                bgColor = 'bg-yellow-50';
                textColor = 'text-yellow-700';
                borderColor = 'border-yellow-200';
                break;
            case 'COURSE_OPENED':
                content = 'Курс був відкритий';
                icon = '🎓';
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
                borderColor = 'border-green-200';
                break;
            case 'COURSE_CLOSED':
                content = 'Курс був закритий';
                icon = '🔒';
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                borderColor = 'border-red-200';
                break;
            case 'MATERIAL_CREATED':
                content = `Новий матеріал: ${(parsedContent as MaterialContent).materialTopic}`;
                icon = '📚';
                bgColor = 'bg-blue-50';
                textColor = 'text-blue-700';
                borderColor = 'border-blue-200';
                break;
            case 'MATERIAL_UPDATED':
                content = `Матеріал оновлено: ${(parsedContent as MaterialContent).materialTopic}`;
                icon = '✏️';
                bgColor = 'bg-blue-50';
                textColor = 'text-blue-700';
                borderColor = 'border-blue-200';
                break;
            case 'MATERIAL_DELETED':
                content = `Матеріал видалено: ${(parsedContent as MaterialContent).materialTopic}`;
                icon = '🗑️';
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                borderColor = 'border-red-200';
                break;
            case 'ASSIGNMENT_CREATED':
                content = `Нове завдання: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                icon = '📝';
                bgColor = 'bg-purple-50';
                textColor = 'text-purple-700';
                borderColor = 'border-purple-200';
                break;
            case 'ASSIGNMENT_UPDATED':
                content = `Завдання оновлено: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                icon = '✏️';
                bgColor = 'bg-purple-50';
                textColor = 'text-purple-700';
                borderColor = 'border-purple-200';
                break;
            case 'ASSIGNMENT_DELETED':
                content = `Завдання видалено: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                icon = '🗑️';
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                borderColor = 'border-red-200';
                break;
            case 'ASSIGNMENT_DEADLINE_IN_24HR':
                content = `Завдання повинно бути виконано за 24 години: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                icon = '⏰';
                bgColor = 'bg-orange-50';
                textColor = 'text-orange-700';
                borderColor = 'border-orange-200';
                break;
            case 'ASSIGNMENT_DEADLINE_ENDED':
                content = `Терміновість завдання закінчилася: ${(parsedContent as AssignmentContent).assignmentTitle}`;
                icon = '⏱️';
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                borderColor = 'border-red-200';
                break;
            case 'CONFERENCE_STARTED':
                content = `Конференція розпочалася: ${(parsedContent as ConferenceContent).conferenceSubject}`;
                icon = '🎥';
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
                borderColor = 'border-green-200';
                break;
            case 'CONFERENCE_ENDED':
                content = `Конференція закінчилася: ${(parsedContent as ConferenceContent).conferenceSubject}`;
                icon = '📹';
                bgColor = 'bg-gray-50';
                textColor = 'text-gray-700';
                borderColor = 'border-gray-200';
                break;
            default:
                break;
        }
    } catch (error) {
        // content is not a JSON string, so use it as is
    }

    return (
        <div className="flex justify-center my-4">
            <div className={`${bgColor} ${textColor} border ${borderColor} px-6 py-3 rounded-lg text-sm font-montserrat flex items-center gap-3 max-w-md`}>
                {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
                <span>{content}</span>
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
        if (window.confirm('Ви впевнені, що хочете видалити це повідомлення?')) {
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
                alert('Помилка при закріпленні повідомлення');
            }
        }
    };

    if (message.isDeleted) {
        return (
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className="rounded-lg px-3 py-2 my-1 text-sm text-gray-500 italic">
                    Це повідомлення було видалено
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
                                    <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors">Скасувати</button>
                                    <button onClick={handleEdit} className="text-xs px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors font-medium">Зберегти</button>
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
                        {new Date(message.sentAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                        {message.editedAt && <span className="italic ml-2">(відредаговано)</span>}
                    </p>
                </div>
            </div>

            {/* Action Buttons - constrained within parent */}
            {!isEditing && (
                <div className={`hidden group-hover:flex gap-1 ml-2 flex-shrink-0 ${isCurrentUser ? 'mr-2 order-first' : ''}`}>
                    <button
                        onClick={() => setShowReactionPicker(prev => !prev)}
                        className="p-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                        title="Додати реакцію"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                    <button
                        onClick={() => handlePinMessage()}
                        className="p-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                        title="Закріпити повідомлення"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </button>
                    {isCurrentUser && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                                title="Редагувати повідомлення"
                            >
                                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1.5 rounded-full bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 shadow-sm hover:shadow-md transition-all flex-shrink-0"
                                title="Видалити повідомлення"
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