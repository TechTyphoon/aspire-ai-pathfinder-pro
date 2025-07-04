// src/pages/LoginPage.tsx
/**
 * LoginPage component for user authentication.
 *
 * Features:
 * - Email and password input fields.
 * - Calls the backend '/api/login' endpoint using the configured `apiClient`.
 * - Uses `AuthContext` to update global authentication state upon successful login.
 * - Displays error messages from the API or for general failures.
 * - Provides a navigation link to the registration page.
 */
import React, { useState, FormEvent } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

/**
 * Props for the LoginPage component.
 * @interface LoginPageProps
 * @property {() => void} onNavigateToRegister - Callback function to navigate to the registration page.
 */
interface LoginPageProps {
  onNavigateToRegister: () => void;
}

/**
 * LoginPage functional component.
 * @param {LoginPageProps} props - The props for the component.
 */
const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth(); // Access the login function from AuthContext

  /**
   * Handles the form submission for user login.
   * Prevents default form submission, clears previous errors,
   * and makes an API call to the login endpoint.
   * On success, calls the `login` function from `AuthContext` with user ID and token.
   * On failure, sets an error message to be displayed.
   * @param {FormEvent} e - The form submission event.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      const response = await apiClient.post('/login', { // Use apiClient and relative path
        email,
        password,
      });

      // Backend returns user_id (int) and access_token (string)
      if (response.status === 200 && response.data.user_id && response.data.access_token) {
        // AuthContext login expects userId as string, token as string.
        login(String(response.data.user_id), response.data.access_token);
      } else {
        setError('Login failed. Please check your credentials or server response.');
      }
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      if (error.isAxiosError && error.response) {
        setError(error.response.data.error || 'Invalid email or password.');
      } else {
        setError('An unexpected error occurred during login.');
      }
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a href="/" className="text-5xl font-bold text-primary inline-block mb-3">
            ASPIRO AI
          </a>
          <h2 className="text-3xl font-semibold text-text-DEFAULT">Welcome Back</h2>
          <p className="text-text-secondary mt-2">Sign in to access your personalized career dashboard.</p>
        </div>

        <form
          className="bg-surface shadow-2xl rounded-xl px-8 pt-10 pb-12 mb-4"
          onSubmit={handleSubmit}
        >
          {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4 text-sm">{error}</div>}

          <div className="mb-6">
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              className="shadow-inner appearance-none border border-background rounded-lg w-full py-3 px-4 text-text-DEFAULT bg-background/30 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-baseline">
              <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-sm text-primary hover:text-primary-light transition-colors duration-200">
                Forgot Password?
              </a>
            </div>
            <input
              className="shadow-inner appearance-none border border-background rounded-lg w-full py-3 px-4 text-text-DEFAULT bg-background/30 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70"
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-primary/50"
              type="submit"
            >
              Sign In
            </button>
          </div>

          <p className="text-center text-text-secondary text-sm mt-10">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-primary hover:text-primary-light transition-colors duration-200 underline"
            >
              Sign Up
            </button>
          </p>
        </form>

        <p className="text-center text-text-secondary text-xs mt-6">
          &copy;{new Date().getFullYear()} ASPIRO AI. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
