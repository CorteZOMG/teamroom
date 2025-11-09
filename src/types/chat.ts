export type ChatType = 'PRIVATE' | 'GROUP' | 'COURSE_CHAT' | 'MAIN_COURSE_CHAT';

export type ChatRole = 'VIEWER' | 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER';

export interface ChatMember {
  username: string;
  role: ChatRole;
  joinedAt: string;
}

export interface BaseChat {
  id: number;
  type: ChatType;
  photoUrl?: string;
}

export interface PrivateChat extends BaseChat {
  type: 'PRIVATE';
  name: string; // Name of the interlocutor
}

export interface GroupChat extends BaseChat {
  type: 'GROUP' | 'COURSE_CHAT' | 'MAIN_COURSE_CHAT';
  name: string;
  members: ChatMember[];
  owner: string; // username of the owner
}

export interface CourseChat extends GroupChat {
  type: 'COURSE_CHAT' | 'MAIN_COURSE_CHAT';
  courseId: number;
}

export type Chat = PrivateChat | GroupChat | CourseChat;

// Type for user's perspective on a chat from GET /api/chats
export interface UserChatView {
  id: number;
  name: string;
  type: ChatType;
  photoUrl?: string;
  role: ChatRole;
  lastReadMessageId?: number;
}

// From GET /api/chats/{chatId}
export interface ChatDetails extends UserChatView {
    members?: ChatMember[];
    courseId?: number;
}

// From POST /api/chats (group chat)
export interface CreateGroupChatRequest {
    name: string;
    photoUrl?: string;
    memberUsernames: string[];
}

// From POST /api/chats/private
export interface CreatePrivateChatRequest {
    username: string;
}

// From PUT /api/chats/{chatId}
export interface UpdateChatRequest {
    name: string;
    photoUrl: string;
}

// From PATCH /api/chats/{chatId}
export interface PatchChatRequest {
    name?: string;
    photoUrl?: string;
}

// From PUT /api/chats/{chatId}/members/{username}
export interface UpdateMemberRoleRequest {
    role: ChatRole;
}

// From POST /api/chats/{chatId}/transfer-ownership
export interface TransferOwnershipRequest {
    newOwnerUsername: string;
}

// From POST /api/chats/{chatId}/pinned
export interface PinMessageRequest {
    messageId: number;
}

// From POST /api/course/{id}/chats
export interface CreateCourseChatRequest {
    name: string;
    photoUrl?: string;
}