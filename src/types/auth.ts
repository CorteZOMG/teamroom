// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
  username: string;
}

export interface RegisterResponse {
  message: string;
  username: string;
}
