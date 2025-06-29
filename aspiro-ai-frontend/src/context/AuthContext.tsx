// src/context/AuthContext.tsx
/**
 * Authentication Context for managing user login state and JWT tokens.
 *
 * Provides an `AuthProvider` component to wrap the application and a `useAuth` hook
 * for components to access authentication state (userId, isLoggedIn, isLoading)
 * and functions (login, logout).
 *
 * JWT tokens are stored in localStorage and automatically managed by this context
 * and the `apiClient` interceptor.
 */
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

/**
 * Defines the shape of the internal authentication state managed by the provider.
 * @interface AuthState
 * @property {string | null} userId - The ID of the authenticated user. Stored as a string.
 * @property {string | null} token - The JWT authentication token.
 * @property {boolean} isLoggedIn - True if the user is currently logged in.
 * @property {boolean} isLoading - True while initially loading auth state from localStorage.
 */
interface AuthState {
  userId: string | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

/**
 * Defines the shape of the value provided by the AuthContext.
 * Note: `token` is intentionally omitted from direct context exposure to components;
 * its management is handled internally and by `api.ts`.
 * @interface AuthContextType
 * @extends Omit<AuthState, 'token'>
 * @property {(userId: string, token: string) => void} login - Function to log in the user.
 * @property {() => void} logout - Function to log out the user.
 */
interface AuthContextType extends Omit<AuthState, 'token'> {
  login: (userId: string, token: string) => void;
  logout: () => void;
}

/**
 * React Context for authentication.
 * Initialized with `undefined` to ensure it's used within an `AuthProvider`.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for the {@link AuthProvider} component.
 * @interface AuthProviderProps
 * @property {ReactNode} children - The child components that will have access to this context.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and functions to its children components.
 * Manages user ID and JWT token in localStorage and React state.
 * Handles initial loading of authentication status from localStorage.
 *
 * @component AuthProvider
 * @param {AuthProviderProps} props - Props for the component.
 * @returns {React.FC<AuthProviderProps>}
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    token: null,
    isLoggedIn: false,
    isLoading: true, // Start with loading true to check localStorage
  });

  /**
   * Effect hook to load authentication state (userId and token) from localStorage
   * when the component mounts. Updates `authState` accordingly.
   */
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('aspiroUserId');
      const storedToken = localStorage.getItem('aspiroAuthToken');

      if (storedUserId && storedToken) {
        setAuthState({
          userId: storedUserId,
          token: storedToken,
          isLoggedIn: true,
          isLoading: false,
        });
      } else {
        // No stored session, or incomplete session data
        setAuthState(prev => ({ ...prev, isLoading: false, userId: null, token: null, isLoggedIn: false }));
      }
    } catch (error) {
      // Handle potential errors from localStorage access (e.g., in restricted environments)
      console.error("Error reading authentication state from localStorage:", error);
      setAuthState(prev => ({ ...prev, isLoading: false, userId: null, token: null, isLoggedIn: false }));
    }
  }, []); // Empty dependency array ensures this runs only on mount

  /**
   * Logs in the user by storing their ID and JWT token in localStorage and updating the auth state.
   * @function login
   * @param {string} userId - The user's ID (typically from the API login response, converted to string).
   * @param {string} token - The JWT access token.
   */
  const login = (userId: string, token: string) => {
    localStorage.setItem('aspiroUserId', userId.toString());
    localStorage.setItem('aspiroAuthToken', token);
    setAuthState({ userId: userId.toString(), token, isLoggedIn: true, isLoading: false });
  };

  /**
   * Logs out the user by removing their ID and JWT token from localStorage and resetting the auth state.
   * @function logout
   */
  const logout = () => {
    localStorage.removeItem('aspiroUserId');
    localStorage.removeItem('aspiroAuthToken');
    setAuthState({ userId: null, token: null, isLoggedIn: false, isLoading: false });
  };

  // While loading initial auth state, display a loading message or spinner.
  // This prevents rendering parts of the app that depend on auth state prematurely.
  if (authState.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-text-DEFAULT">Loading authentication...</div>;
  }

  // Provide the public parts of authState and the login/logout functions to children.
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

/**
 * Custom hook for easy consumption of the AuthContext.
 * Provides access to `userId`, `isLoggedIn`, `isLoading`, `login()`, and `logout()`.
 * Throws an error if used outside of an `AuthProvider`.
 *
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If used outside of an AuthProvider.
 * @example
 * const { isLoggedIn, login, logout } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
