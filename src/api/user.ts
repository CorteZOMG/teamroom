import { apiFetch } from './client';
import type { UserSearchResult, UserSearchResponse } from '../types';

/**
 * Searches for users by a partial username match.
 * @param partialUsername The partial username to search for.
 * @returns A promise that resolves to an array of users matching the search query.
 */
export async function searchUsers(partialUsername: string): Promise<UserSearchResult[]> {
  if (!partialUsername.trim()) {
    return Promise.resolve([]);
  }
  
  const query = new URLSearchParams({ partialUsername }).toString();
  const response = await apiFetch<UserSearchResponse>(`/api/user/search?${query}`);
  
  return response.users || [];
}
