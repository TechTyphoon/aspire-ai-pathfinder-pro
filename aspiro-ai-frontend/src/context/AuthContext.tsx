// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define the shape of the authentication state
interface AuthState {
  userId: string | null; // Changed to string to align with JWT identity if needed, or keep number if only for display
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean; // To handle initial loading of auth state from localStorage
}

// Define the shape of the context value
interface AuthContextType extends Omit<AuthState, 'token'> { // Exclude token from direct context exposure if preferred
  login: (userId: string, token: string) => void; // userId can be string or number based on API response
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
    token: null,
    isLoggedIn: false,
    isLoading: true, // Start with loading true
  });

  // Effect to load auth state from localStorage on initial mount
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('aspiroUserId'); // Changed key for clarity
      const storedToken = localStorage.getItem('aspiroAuthToken');

      if (storedUserId && storedToken) {
        setAuthState({
          userId: storedUserId, // Keep as string, or parse if you strictly need number
          token: storedToken,
          isLoggedIn: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false, userId: null, token: null, isLoggedIn: false }));
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setAuthState(prev => ({ ...prev, isLoading: false, userId: null, token: null, isLoggedIn: false }));
    }
  }, []);

  const login = (userId: string, token: string) => { // userId from API might be number, convert if necessary
    localStorage.setItem('aspiroUserId', userId.toString()); // Store userId as string
    localStorage.setItem('aspiroAuthToken', token);
    setAuthState({ userId: userId.toString(), token, isLoggedIn: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('aspiroUserId');
    localStorage.removeItem('aspiroAuthToken');
    setAuthState({ userId: null, token: null, isLoggedIn: false, isLoading: false });
  };

  // Provide the auth state and functions to children components
  // Do not render children until loading is complete to avoid flicker or premature access
  if (authState.isLoading) {
    // Optionally return a loading spinner or null
    return <div className="min-h-screen flex items-center justify-center bg-background text-text-DEFAULT">Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{
      userId: authState.userId,
      isLoggedIn: authState.isLoggedIn,
      isLoading: authState.isLoading,
      login,
      logout
    }}>
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
