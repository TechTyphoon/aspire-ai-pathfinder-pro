// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import apiClient from '../api'; // Import the configured axios instance
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

// Props for navigation, to be passed from App.tsx or a router later
interface LoginPageProps {
  onNavigateToRegister: () => void;
  // onLoginSuccess is implicitly handled by AuthContext updating state, App.tsx will react
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth(); // Get login function from AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await apiClient.post('/login', { // Use apiClient and relative path
        email,
        password,
      });

      if (response.status === 200 && response.data.user_id) {
        login(response.data.user_id);
      } else {
        setError('Login failed. Please check your credentials.');
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
