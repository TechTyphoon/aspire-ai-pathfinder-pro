// src/pages/RegisterPage.tsx
/**
 * RegisterPage component for new user registration.
 *
 * Features:
 * - Email, password, and confirm password input fields.
 * - Client-side validation for password match and minimum length.
 * - Calls the backend '/api/register' endpoint using `apiClient`.
 * - Displays success or error messages based on API response.
 * - Navigates to the login page upon successful registration after a short delay.
 */
import React, { useState, FormEvent } from 'react';
import apiClient from '../api';
import { AxiosError } from 'axios';

/**
 * Props for the RegisterPage component.
 * @interface RegisterPageProps
 * @property {() => void} onNavigateToLogin - Callback function to navigate to the login page.
 */
interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

/**
 * RegisterPage functional component.
 * @param {RegisterPageProps} props - The props for the component.
 */
const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Handles the form submission for user registration.
   * Performs client-side validation, then makes an API call to '/api/register'.
   * Updates UI with success or error messages.
   * Redirects to login page on successful registration.
   * @param {FormEvent} e - The form submission event.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setSuccessMessage(null); // Clear previous success messages

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) { // Basic password length validation
        setError("Password must be at least 6 characters long.");
        return;
    }

    try {
      const response = await apiClient.post('/register', { // Use apiClient and relative path
        email,
        password,
      });

      if (response.status === 201) {
        setSuccessMessage('Registration successful! Please log in.');
        setTimeout(() => {
          onNavigateToLogin();
        }, 2000);
      }
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>; // Type assertion
      if (error.isAxiosError && error.response) {
        setError(error.response.data.error || 'Registration failed. Please try again.');
      } else {
        setError('An unexpected error occurred during registration.');
      }
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a href="/" className="text-5xl font-bold text-primary inline-block mb-3">
            ASPIRO AI
          </a>
          <h2 className="text-3xl font-semibold text-text-DEFAULT">Create Your Account</h2>
          <p className="text-text-secondary mt-2">Join us to start planning your career path.</p>
        </div>

        <form
          className="bg-surface shadow-2xl rounded-xl px-8 pt-10 pb-12 mb-4"
          onSubmit={handleSubmit}
        >
          {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4 text-sm">{error}</div>}
          {successMessage && <div className="bg-green-500/20 text-green-300 p-3 rounded-md mb-4 text-sm">{successMessage}</div>}

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

          <div className="mb-6">
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow-inner appearance-none border border-background rounded-lg w-full py-3 px-4 text-text-DEFAULT bg-background/30 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70"
              id="password"
              type="password"
              placeholder="•••••••••••• (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              className="shadow-inner appearance-none border border-background rounded-lg w-full py-3 px-4 text-text-DEFAULT bg-background/30 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70"
              id="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-primary/50"
              type="submit"
            >
              Create Account
            </button>
          </div>

          <p className="text-center text-text-secondary text-sm mt-10">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-primary hover:text-primary-light transition-colors duration-200 underline"
            >
              Sign In
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

export default RegisterPage;
