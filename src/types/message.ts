

export type MessageType =
  | 'USER_MESSAGE'
  | 'SYSTEM_MESSAGE'
  | 'USER_JOINED_TO_CHAT'
  | 'USER_LEFT_FROM_CHAT'
  | 'COURSE_OPENED'
  | 'COURSE_CLOSED'
  | 'MATERIAL_CREATED'
  | 'MATERIAL_UPDATED'
  | 'MATERIAL_DELETED'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_UPDATED'
  | 'ASSIGNMENT_DELETED'
  | 'ASSIGNMENT_DEADLINE_IN_24HR'
  | 'ASSIGNMENT_DEADLINE_ENDED'
  | 'CONFERENCE_STARTED'
  | 'CONFERENCE_ENDED';

export type RelatedEntityType = 'ASSIGNMENT' | 'MATERIAL' | 'CONFERENCE';

export interface RelatedEntity {
  relatedEntityType: RelatedEntityType;
  relatedEntityId: number;
}

export interface Media {
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  fileSizeBytes: number | null;
}

export interface Reaction {
  messageId: number;
  username: string;
  emoji: string;
  reactionTime: string;
}

export interface BaseMessage {
  id: number;
  chatId: number;
  type: MessageType;
  sentAt: string;
  editedAt: string | null;
  isDeleted: boolean;
  reactions: Reaction[];
  replyToMessageId: number | null;
  relatedEntities: RelatedEntity[];
  media: Media[];
}

export interface UserMessage extends BaseMessage {
  type: 'USER_MESSAGE';
  username: string;
  content: string;
}

export interface SystemMessage extends BaseMessage {
  username: null;
  content: string | null; // Can be a stringified JSON with extra info
}

export type ChatMessage = UserMessage | SystemMessage;

// --- Payloads for content in System Messages ---

export interface UserJoinedLeftContent {
  username: string;
}

export interface MaterialContent {
  materialTopic: string;
}

export interface AssignmentContent {
  assignmentTitle: string;
}

// From GET /api/chats/{chatId}/pinned
export interface PinnedMessage {
    id: number;
    chatId: number;
    username: string | null;
    content: string | null;
    type: MessageType;
    sentAt: string;
}