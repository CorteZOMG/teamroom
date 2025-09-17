// Profile types
export interface ProfileCreationRequest {
  firstName: string;
  lastName?: string;
  biography?: string;
  photoUrl?: string;
}

export interface ProfileCreationResponse {
  message: string;
}

export interface ProfileResponse {
  firstName: string;
  lastName: string;
  biography: string;
  photoUrl: string;
}

// UI-specific profile types
export interface ProfileData {
  firstName: string;
  lastName: string;
  biography: string;
}

export interface SelectedFile {
  file: File | null;
  preview: string;
}
