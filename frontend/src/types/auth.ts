export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  apiKeys: {
    google?: string;
    openai?: string;
    midjourney?: string;
    anthropic?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  apiKeys: {
    google?: string;
    openai?: string;
    midjourney?: string;
    anthropic?: string;
  };
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
}
