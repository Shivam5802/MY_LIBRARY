import type { OwnerDashboardStats, User } from '../types/auth';
import { staticDb } from '../mock/staticData';

export interface UpdateProfilePayload {
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
  username?: string;
  profilePhotoUrl?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export class DashboardService {
  static async getOwnerDashboardStats(): Promise<OwnerDashboardStats> {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getOwnerDashboardStats();
  }
}

export class ProfileService {
  static async getProfile(): Promise<User> {
    await new Promise((r) => setTimeout(r, 40));
    const user = staticDb.getUser('owner');
    if (!user) throw new Error('Owner profile not found');
    return user;
  }

  static async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    await new Promise((r) => setTimeout(r, 100));
    const user = staticDb.getUser('owner');
    if (!user) throw new Error('Owner profile not found');
    return staticDb.updateUser(user.id, payload);
  }

  static async changePassword(_payload: ChangePasswordPayload): Promise<{ message: string }> {
    await new Promise((r) => setTimeout(r, 100));
    return { message: 'Password updated successfully' };
  }
}
