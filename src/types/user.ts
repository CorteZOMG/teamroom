// Types for user-related API responses

export interface UserSearchProfile {
    firstName: string;
    lastName: string | null;
    biography: string | null;
    photoUrl: string | null;
}

export interface UserSearchResult {
    username: string;
    email: string;
    profile: UserSearchProfile;
}

export interface UserSearchResponse {
    users: UserSearchResult[];
}
