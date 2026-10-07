import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '../types/auth';
import { Role } from '../types/auth';
import { AuthService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
}

const TOKEN_KEY = 'my_library_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state by verifying token with backend /auth/me
  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { user: verifiedUser } = await AuthService.me();
        if (isMounted) {
          setUser(verifiedUser);
          setToken(storedToken);
        }
      } catch {
        // Token expired or invalid
        if (isMounted) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await AuthService.login(username, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await AuthService.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: Role): boolean => {
      return user?.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
