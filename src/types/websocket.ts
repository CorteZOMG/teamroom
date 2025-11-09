import type { ChatMessage, Reaction } from './message';
import type { ChatRole, ChatType } from './chat';

// --- Inbound (from server) ---

// General broadcast structure
export interface WebSocketBroadcast<T, P> {
  type: T;
  payload: P;
}

// Notifications via /user/queue/notifications
export type UserNotificationType =
  | 'JOINED_TO_CHAT'
  | 'REMOVED_FROM_CHAT'
  | 'ROLE_CHANGED_IN_CHAT'
  | 'CHAT_UPDATED'
  | 'CHAT_DELETED';

export interface JoinedToChatPayload {
  chat_id: number;
  chat_name: string;
  chat_type: ChatType;
  chat_photoUrl: string;
  role: ChatRole;
  joined_at: string;
}

export interface RemovedFromChatPayload {
  chat_id: number;
  chat_name: string;
  chat_type: ChatType;
  chat_photoUrl: string;
}

export interface RoleChangedInChatPayload {
  chat_id: number;
  chat_name: string;
  chat_type: ChatType;
  chat_photoUrl: string;
  old_role: ChatRole;
  new_role: ChatRole;
}

export interface ChatUpdatedPayload {
    chat_id: number;
    chat_name: string;
    chat_type: ChatType;
    chat_photoUrl: string;
}

export interface ChatDeletedPayload {
    chat_id: number;
    chat_name: string;
    chat_type: ChatType;
    chat_photoUrl: string;
}

export type UserNotification =
  | WebSocketBroadcast<'JOINED_TO_CHAT', JoinedToChatPayload>
  | WebSocketBroadcast<'REMOVED_FROM_CHAT', RemovedFromChatPayload>
  | WebSocketBroadcast<'ROLE_CHANGED_IN_CHAT', RoleChangedInChatPayload>
  | WebSocketBroadcast<'CHAT_UPDATED', ChatUpdatedPayload>
  | WebSocketBroadcast<'CHAT_DELETED', ChatDeletedPayload>;


// Messages via /topic/chats/{chatId}
export type ChatBroadcastType =
  | 'USER_MESSAGE'
  | 'SYSTEM_MESSAGE' // This is a new type for system messages
  | 'REACTION_UPDATE'
  | 'MESSAGE_UPDATE'
  | 'MESSAGE_DELETED'
  | 'START_TYPING'
  | 'STOP_TYPING'
  | 'READ_LAST_MESSAGE';

export type ReactionUpdatePayload = Reaction;

export type MessageUpdatePayload = ChatMessage;

export interface MessageDeletedPayload {
  messageId: number;
  deletedAt: string;
}

export interface TypingPayload {
  username: string;
}

export interface ReadLastMessagePayload {
  username: string;
  lastReadMessageId: number;
  lastReadAt: string;
}

export type ChatBroadcast =
  | WebSocketBroadcast<'USER_MESSAGE', ChatMessage>
  | WebSocketBroadcast<'SYSTEM_MESSAGE', ChatMessage>
  | WebSocketBroadcast<'REACTION_UPDATE', ReactionUpdatePayload>
  | WebSocketBroadcast<'MESSAGE_UPDATE', MessageUpdatePayload>
  | WebSocketBroadcast<'MESSAGE_DELETED', MessageDeletedPayload>
  | WebSocketBroadcast<'START_TYPING', TypingPayload>
  | WebSocketBroadcast<'STOP_TYPING', TypingPayload>
  | WebSocketBroadcast<'READ_LAST_MESSAGE', ReadLastMessagePayload>;


// --- Outbound (to server) ---

export interface SendMessageRequest {
  content: string;
  replyToMessageId?: number | null;
  relatedEntities?: {
    relatedEntityType: 'ASSIGNMENT' | 'MATERIAL';
    relatedEntityId: number;
  }[];
  media?: {
    fileUrl: string;
    fileName?: string | null;
    fileType?: string | null;
    fileSizeBytes?: number | null;
  }[];
}

export interface ReactRequest {
  messageId: number;
  emoji: string;
}

export interface EditMessageRequest {
  messageId: number;
  content: string;
  relatedEntities?: {
    relatedEntityType: 'ASSIGNMENT' | 'MATERIAL';
    relatedEntityId: number;
  }[];
  media?: {
    fileUrl: string;
    fileName?: string | null;
    fileType?: string | null;
    fileSizeBytes?: number | null;
  }[];
}

export interface DeleteMessageRequest {
  messageId: number;
}

export interface ReadMessageRequest {
  lastReadMessageId: number;
}
