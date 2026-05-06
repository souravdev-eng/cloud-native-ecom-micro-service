import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { userServiceApi } from '../api/baseUrl';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: any | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);

  const checkAuth = async () => {
    try {
      const response = await userServiceApi.get('/currentuser');
      if (response.status === 200 && response.data?.currentUser) {
        setIsAuthenticated(true);
        setUser(response.data.currentUser);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await userServiceApi.post('/signout');
    } catch (error) {
      // Ignore errors on logout
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
