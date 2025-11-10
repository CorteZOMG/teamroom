import { apiFetch } from './client';
import type { Conference, CreateConferenceResponse, JoinConferenceResponse } from '../types/conference';

/**
 * Fetches all conferences for a given course.
 * @param courseId - The ID of the course.
 * @returns A promise that resolves to an array of conferences.
 */
export async function getConferences(courseId: number): Promise<Conference[]> {
  // Corrected endpoint: /api/course/{courseId}/conferences
  return apiFetch<Conference[]>(`/api/course/${courseId}/conferences`);
}

/**
 * Creates a new conference for a course.
 * @param courseId - The ID of the course.
 * @param subject - The subject/title of the conference.
 * @returns A promise that resolves to the conference join details (jwt, roomName, role).
 */
export async function createConference(courseId: number, subject: string): Promise<CreateConferenceResponse> {
  // Corrected endpoint: /api/course/{courseId}/conferences
  return apiFetch<CreateConferenceResponse>(`/api/course/${courseId}/conferences`, {
    method: 'POST',
    body: JSON.stringify({ subject }),
  });
}

/**
 * Joins an existing conference.
 * @param courseId - The ID of the course where the conference exists.
 * @param conferenceId - The ID of the conference to join.
 * @returns A promise that resolves to the conference join details (jwt, roomName, role).
 */
export async function joinConference(courseId: number, conferenceId: number): Promise<JoinConferenceResponse> {
  // Corrected endpoint: /api/course/{courseId}/conferences/{conferenceId}
  return apiFetch<JoinConferenceResponse>(`/api/course/${courseId}/conferences/${conferenceId}`, {
    method: 'POST',
  });
}