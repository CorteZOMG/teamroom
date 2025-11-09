import { apiFetch } from './client';
import type {
  UserChatView,
  CreateGroupChatRequest,
  ChatDetails,
  UpdateChatRequest,
  PatchChatRequest,
  ChatMember,
  UpdateMemberRoleRequest,
  TransferOwnershipRequest,
  PinMessageRequest,
  CreatePrivateChatRequest,
  CreateCourseChatRequest,
  ChatRole,
} from '../types/chat';
import type { ChatMessage, PinnedMessage } from '../types/message';

// GET /api/chats
export async function getChats(): Promise<UserChatView[]> {
  return apiFetch<UserChatView[]>('/api/chats');
}

// POST /api/chats
export async function createGroupChat(data: CreateGroupChatRequest): Promise<{ chatId: number }> {
  return apiFetch<{ chatId: number }>('/api/chats', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// GET /api/chats/{chatId}
export async function getChatDetails(chatId: number): Promise<ChatDetails> {
  return apiFetch<ChatDetails>(`/api/chats/${chatId}`);
}

// PUT /api/chats/{chatId}
export async function updateChat(chatId: number, data: UpdateChatRequest): Promise<ChatDetails> {
  return apiFetch<ChatDetails>(`/api/chats/${chatId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// PATCH /api/chats/{chatId}
export async function partiallyUpdateChat(chatId: number, data: PatchChatRequest): Promise<ChatDetails> {
  return apiFetch<ChatDetails>(`/api/chats/${chatId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// DELETE /api/chats/{chatId}
export async function deleteChat(chatId: number): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}`, {
    method: 'DELETE',
  });
}

// GET /api/chats/{chatId}/members
export async function getChatMembers(chatId: number): Promise<ChatMember[]> {
  return apiFetch<ChatMember[]>(`/api/chats/${chatId}/members`);
}

// POST /api/chats/{chatId}/members
export async function addChatMember(chatId: number, data: { username: string; role: ChatRole }): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT /api/chats/{chatId}/members/{username}
export async function updateChatMemberRole(chatId: number, username: string, data: UpdateMemberRoleRequest): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}/members/${username}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE /api/chats/{chatId}/members/{username}
export async function removeChatMember(chatId: number, username: string): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}/members/${username}`, {
    method: 'DELETE',
  });
}

// DELETE /api/chats/{chatId}/members/me
export async function leaveChat(chatId: number): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}/members/me`, {
    method: 'DELETE',
  });
}

// POST /api/chats/{chatId}/transfer-ownership
export async function transferChatOwnership(chatId: number, data: TransferOwnershipRequest): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}/transfer-ownership`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// GET /api/chats/{chatId}/messages
export async function getMessages(chatId: number, params: { limitBefore: number; messageId?: number; limitAfter?: number }): Promise<ChatMessage[]> {
    const query = new URLSearchParams({
        limitBefore: String(params.limitBefore),
        ...(params.messageId && { messageId: String(params.messageId) }),
        ...(params.limitAfter && { limitAfter: String(params.limitAfter) }),
    }).toString();
    return apiFetch<ChatMessage[]>(`/api/chats/${chatId}/messages?${query}`);
}

// GET /api/chats/{chatId}/messages/{messageId}
export async function getMessage(chatId: number, messageId: number): Promise<ChatMessage> {
    return apiFetch<ChatMessage>(`/api/chats/${chatId}/messages/${messageId}`);
}

// GET /api/chats/{chatId}/messages/last
export async function getLastMessage(chatId: number): Promise<ChatMessage> {
    return apiFetch<ChatMessage>(`/api/chats/${chatId}/messages/last`);
}

// GET /api/chats/{chatId}/pinned
export async function getPinnedMessages(chatId: number): Promise<PinnedMessage[]> {
  return apiFetch<PinnedMessage[]>(`/api/chats/${chatId}/pinned`);
}

// POST /api/chats/{chatId}/pinned
export async function pinMessage(chatId: number, data: PinMessageRequest): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}/pinned`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// DELETE /api/chats/{chatId}/pinned/{messageId}
export async function unpinMessage(chatId: number, messageId: number): Promise<void> {
  return apiFetch<void>(`/api/chats/${chatId}/pinned/${messageId}`, {
    method: 'DELETE',
  });
}

// POST /api/chats/private
export async function createPrivateChat(data: CreatePrivateChatRequest): Promise<{ chatId: number }> {
    return apiFetch<{ chatId: number }>('/api/chats/private', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// DELETE /api/chats/private/{chatId}/clear
export async function clearPrivateChat(chatId: number, clearForBoth: boolean): Promise<void> {
    return apiFetch<void>(`/api/chats/private/${chatId}/clear?clearForBoth=${clearForBoth}`, {
        method: 'DELETE',
    });
}

// GET /api/course/{id}/chats
export async function getCourseChats(courseId: number): Promise<UserChatView[]> {
    return apiFetch<UserChatView[]>(`/api/course/${courseId}/chats`);
}

// POST /api/course/{id}/chats
export async function createCourseChat(courseId: number, data: CreateCourseChatRequest): Promise<{ chatId: number }> {
    return apiFetch<{ chatId: number }>(`/api/course/${courseId}/chats`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}