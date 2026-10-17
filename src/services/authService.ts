

export interface User {
  email: string;
  businessName: string;
  businessSlug: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

const MOCK_USERS_KEY = 'neudi-mock-users';
const SESSION_KEY = 'neudi-session';

interface MockUser {
  email: string;
  password: string;
  businessName: string;
  businessSlug: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  businessName: string;
}

export type AuthError = 'INVALID_CREDENTIALS' | 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'NETWORK_ERROR';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function getMockUsers(): MockUser[] {
  try {
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMockUsers(users: MockUser[]): void {
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch {}
}

function setSession(user: User): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {}
}

function getSession(): User | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export const authService = {
  async register(data: RegisterData): Promise<{ user: User } | { error: AuthError }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (data.password.length < 6) {
      return { error: 'WEAK_PASSWORD' };
    }

    const users = getMockUsers();
    const emailExists = users.some((u) => u.email === data.email);
    if (emailExists) {
      return { error: 'EMAIL_EXISTS' };
    }

    const slug = generateSlug(data.businessName);
    const mockUser: MockUser = {
      email: data.email,
      password: data.password, // In production this would be hashed
      businessName: data.businessName,
      businessSlug: slug,
    };

    saveMockUsers([...users, mockUser]);

    const user: User = {
      email: data.email,
      businessName: data.businessName,
      businessSlug: slug,
    };

    setSession(user);
    return { user };
  },

  async login(credentials: LoginCredentials): Promise<{ user: User } | { error: AuthError }> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getMockUsers();
    const found = users.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!found) {
      return { error: 'INVALID_CREDENTIALS' };
    }

    const user: User = {
      email: found.email,
      businessName: found.businessName,
      businessSlug: found.businessSlug,
    };

    setSession(user);
    return { user };
  },

  async loginDemo(): Promise<{ user: User }> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const user: User = {
      email: 'demo@neudi.test',
      businessName: 'Peluquería Juan',
      businessSlug: 'peluqueria-juan',
    };

    setSession(user);
    return { user };
  },

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    clearSession();
  },

  getCurrentUser(): User | null {
    return getSession();
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
