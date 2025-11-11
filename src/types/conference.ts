
export type ConferenceStatus = 'ACTIVE' | 'ENDED';
export type ConferenceRole = 'MODERATOR' | 'MEMBER' | 'VIEWER';

export interface ConferenceParticipant {
  username: string;
  role: ConferenceRole;
  joinedAt: string;
  leftAt?: string;
}

export interface Conference {
  id: number;
  subject: string;
  roomName: string;
  status: ConferenceStatus;
  createdAt: string;
  endedAt?: string;
  participants: ConferenceParticipant[];
}

export interface CreateConferenceResponse {
  jwt: string;
  roomName: string;
  subject: string;
  role: ConferenceRole;
}

export type JoinConferenceResponse = CreateConferenceResponse;
