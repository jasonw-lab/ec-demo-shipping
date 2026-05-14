import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  login as loginApi,
  logout as logoutApi,
  refreshToken as refreshTokenApi,
  getCurrentUser,
  getAccessToken,
  User
} from 'services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedUser = getCurrentUser();
      const token = getAccessToken();

      if (storedUser && token) {
        setUser(storedUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await loginApi(username, password);

      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.errorMessage || 'ログインに失敗しました'
      };
    } catch (error) {
      return {
        success: false,
        error: 'ログイン中にエラーが発生しました'
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await refreshTokenApi();
      return response.success;
    } catch {
      return false;
    }
  }, []);

  const hasRole = useCallback((role: string) => {
    return user?.roles.includes(role) ?? false;
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.some(p =>
      p === permission ||
      p === '*' ||
      (p.endsWith(':*') && permission.startsWith(p.slice(0, -1)))
    );
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected Route component
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredRole, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (requiredRole && !hasRole(requiredRole)) {
        navigate('/', { replace: true });
      }
      if (requiredPermission && !hasPermission(requiredPermission)) {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, requiredPermission, hasRole, hasPermission, navigate]);

  if (isLoading) {
    return null; // or loading spinner
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}

export default AuthContext;
