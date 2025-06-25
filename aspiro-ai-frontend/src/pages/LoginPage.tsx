// src/pages/LoginPage.tsx
import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // Optional: for a back button

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface flex flex-col justify-center items-center p-4">
      {/* Optional: Back to home link or header can be added here if needed */}
      {/* <a href="/" className="absolute top-8 left-8 text-primary hover:text-primary-light flex items-center">
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Home
      </a> */}

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
          onSubmit={(e) => e.preventDefault()} // Prevent actual submission
        >
          <div className="mb-6">
            <label className="block text-text-secondary text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              className="shadow-inner appearance-none border border-background rounded-lg w-full py-3 px-4 text-text-DEFAULT bg-background/30 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-text-secondary/70"
              id="email"
              type="email"
              placeholder="you@example.com"
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
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-primary/50"
              type="button" // No submit logic
            >
              Sign In
            </button>
          </div>

          <p className="text-center text-text-secondary text-sm mt-10">
            Don't have an account?{' '}
            <a href="#" className="font-bold text-primary hover:text-primary-light transition-colors duration-200">
              Sign Up
            </a>
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
