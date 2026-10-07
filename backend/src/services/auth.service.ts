import { prisma } from '../config/prisma.js';
import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { Role, SafeUser, LoginResponseData } from '../types/index.js';

export class AuthService {
  static async login(username: string, password: string): Promise<LoginResponseData | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const safeUser: SafeUser = {
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

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role as Role,
    });

    return {
      user: safeUser,
      token,
    };
  }

  static async getCurrentUser(userId: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

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
}
