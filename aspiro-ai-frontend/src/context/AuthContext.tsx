// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define the shape of the authentication state
interface AuthState {
  userId: number | null;
  isLoggedIn: boolean;
  isLoading: boolean; // To handle initial loading of auth state from localStorage
}

// Define the shape of the context value
interface AuthContextType extends AuthState {
  login: (userId: number) => void;
  logout: () => void;
}

// Create the context with a default undefined value initially
// This helps catch cases where the context is used outside a provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    isLoggedIn: false,
    isLoading: true, // Start with loading true
  });

  // Effect to load auth state from localStorage on initial mount
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('aspiroUser');
      if (storedUserId) {
        setAuthState({
          userId: parseInt(storedUserId, 10),
          isLoggedIn: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (userId: number) => {
    localStorage.setItem('aspiroUser', userId.toString());
    setAuthState({ userId, isLoggedIn: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('aspiroUser');
    setAuthState({ userId: null, isLoggedIn: false, isLoading: false });
  };

  // Provide the auth state and functions to children components
  // Do not render children until loading is complete to avoid flicker or premature access
  if (authState.isLoading) {
    // Optionally return a loading spinner or null
    return <div className="min-h-screen flex items-center justify-center bg-background text-text-DEFAULT">Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
