// src/App.tsx
import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './context/AuthContext';

// Define types for the pages to manage navigation state
type UnauthenticatedPage = 'landing' | 'login' | 'register';

function App() {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  // Current page state for unauthenticated users
  const [currentPage, setCurrentPage] = useState<UnauthenticatedPage>('landing');

  // Effect to reset to landing page if user logs out
  useEffect(() => {
    if (!isLoggedIn && !isAuthLoading) {
      setCurrentPage('landing'); // Default to landing when logged out and auth is resolved
    }
  }, [isLoggedIn, isAuthLoading]);


  // Navigation handlers
  const navigateToLogin = () => setCurrentPage('login');
  const navigateToRegister = () => setCurrentPage('register');
  const navigateToLanding = () => setCurrentPage('landing');
  const navigateToDashboard = () => {
    // This function is primarily for the Header's Dashboard link.
    // Actual rendering of DashboardPage is controlled by isLoggedIn.
    // If called when not logged in, it might ideally redirect to login,
    // but for now, we assume App.tsx's main logic handles it.
    if (!isLoggedIn) {
      navigateToLogin();
    } // If logged in, App will render DashboardPage anyway.
  };


  // If auth state is still loading from localStorage, show a global loader
  // This prevents rendering pages before auth status is confirmed
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-DEFAULT text-xl">
        Initializing Aspiro AI...
      </div>
    );
  }

  return (
    <>
      <Header
        onNavigateToLogin={navigateToLogin}
        onNavigateToDashboard={navigateToDashboard}
        onNavigateToLanding={navigateToLanding}
      />

      {isLoggedIn ? (
        <DashboardPage />
      ) : (
        <>
          {currentPage === 'landing' && <LandingPage onNavigateToLogin={navigateToLogin} onNavigateToRegister={navigateToRegister} />}
          {currentPage === 'login' && <LoginPage onNavigateToRegister={navigateToRegister} />}
          {currentPage === 'register' && <RegisterPage onNavigateToLogin={navigateToLogin} />}
        </>
      )}
    </>
  );
}

export default App;
