import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { SafeUser, Role } from '../types/index.js';

export interface UpdateOwnerProfileInput {
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
  username?: string;
  profilePhotoUrl?: string | null;
}

export class ProfileService {
  static async getProfile(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found.');

    return {
      id: user.id,
      username: user.username,
      role: user.role as Role,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      profilePhotoUrl: user.profilePhotoUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static async updateProfile(userId: string, input: UpdateOwnerProfileInput): Promise<SafeUser> {
    // If username is changing, ensure uniqueness
    if (input.username) {
      const existing = await prisma.user.findUnique({
        where: { username: input.username },
      });
      if (existing && existing.id !== userId) {
        throw new Error('Username is already taken by another user.');
      }
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.mobile !== undefined) updateData.mobile = input.mobile;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.username !== undefined) updateData.username = input.username;
    if (input.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = input.profilePhotoUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      username: user.username,
      role: user.role as Role,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      profilePhotoUrl: user.profilePhotoUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const isMatch = await comparePassword(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new Error('Current password is incorrect.');
    }

    const newHash = await hashPassword(newPass);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }
}
