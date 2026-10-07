import type { LoginResponseData, User } from '../types/auth';
import { staticDb } from '../mock/staticData';

export class AuthService {
  static async login(username: string, _password?: string): Promise<LoginResponseData> {
    // Artificial small delay for smooth realistic UX
    await new Promise((r) => setTimeout(r, 120));

    const user = staticDb.getUser(username);
    if (!user) {
      // Default fallback if unknown username is entered
      throw new Error('Invalid credentials. Use "owner" or "developer".');
    }

    const mockToken = `mock_jwt_token_${user.role.toLowerCase()}_${Date.now()}`;
    return {
      user,
      token: mockToken,
    };
  }

  static async me(): Promise<{ user: User }> {
    const token = localStorage.getItem('my_library_token');
    if (!token) {
      throw new Error('Unauthorized: No active token');
    }

    // Check if token indicates developer or owner
    let targetUsername = 'owner';
    if (token.includes('developer')) {
      targetUsername = 'developer';
    }

    const user = staticDb.getUser(targetUsername);
    if (!user) {
      throw new Error('User not found');
    }

    return { user };
  }

  static async logout(): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }
}
