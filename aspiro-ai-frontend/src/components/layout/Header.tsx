// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

interface NavLink {
  name: string;
  href?: string; // Href is optional if it's a button like Sign Out
  action?: () => void; // Action for buttons like Sign Out or navigating
  authRequired?: boolean; // Link specific to authenticated users
  hideWhenAuth?: boolean; // Link to hide when authenticated (e.g. Sign In)
}

interface HeaderProps {
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToLanding: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigateToLogin, onNavigateToDashboard, onNavigateToLanding }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggedIn, logout, userId } = useAuth(); // Get auth state and functions

  const commonLinks: NavLink[] = [
    { name: 'Features', action: onNavigateToLanding }, // Assuming these navigate to sections on landing page or separate pages
    { name: 'Personas', action: onNavigateToLanding },
    { name: 'About', action: onNavigateToLanding },
  ];

  const authSpecificLinks: NavLink[] = [
    { name: 'Dashboard', action: onNavigateToDashboard, authRequired: true },
    { name: 'Sign In', action: onNavigateToLogin, hideWhenAuth: true },
    // Sign Out is handled as a button separately for styling
  ];

  const allNavLinks = [...commonLinks, ...authSpecificLinks];

  const handleSignOut = () => {
    logout();
    setIsMobileMenuOpen(false);
    onNavigateToLanding(); // Navigate to landing page after logout
  };

  const renderNavLink = (link: NavLink, isMobile: boolean = false) => {
    if (link.authRequired && !isLoggedIn) return null;
    if (link.hideWhenAuth && isLoggedIn) return null;

    const className = isMobile
      ? "block text-text-secondary hover:text-primary transition-colors duration-300 text-xl font-medium py-3 text-center"
      : "text-text-secondary hover:text-primary transition-colors duration-300 text-lg font-medium";

    return (
      <button
        key={link.name}
        onClick={() => {
          if (link.action) link.action();
          if (isMobile) setIsMobileMenuOpen(false);
        }}
        className={className}
      >
        {link.name}
      </button>
    );
  };


  return (
    <header className="bg-surface/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={onNavigateToLanding} className="text-3xl font-bold text-primary">
              ASPIRO AI
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {allNavLinks.map(link => renderNavLink(link))}
            {isLoggedIn && (
              <>
                <span className="text-text-secondary text-sm flex items-center">
                  <UserCircleIcon className="h-6 w-6 mr-1 text-primary/80" /> User: {userId}
                </span>
                <button
                  onClick={handleSignOut}
                  className="ml-6 bg-accent hover:bg-pink-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Sign Out
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {isLoggedIn && <UserCircleIcon className="h-7 w-7 mr-3 text-primary" />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-secondary hover:text-primary focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-8 w-8" />
              ) : (
                <Bars3Icon className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={clsx(
          'md:hidden fixed inset-x-0 top-20 bg-surface/95 backdrop-blur-lg shadow-xl transition-transform duration-300 ease-in-out overflow-y-auto max-h-[calc(100vh-5rem)]', // Added overflow and max-height
          {
            'transform translate-y-0 opacity-100': isMobileMenuOpen,
            'transform -translate-y-full opacity-0 pointer-events-none': !isMobileMenuOpen, // Added pointer-events-none
          }
        )}
        // Using clipPath for height animation might be complex with dynamic content,
        // rely on transform and opacity for open/close effect.
      >
        { /* Render div only when menu is open to ensure content height is calculated correctly for animation */ }
        {isMobileMenuOpen && (
            <div className="px-4 pt-6 pb-8 space-y-5">
            {allNavLinks.map(link => renderNavLink(link, true))}
            {isLoggedIn ? (
                <button
                onClick={handleSignOut}
                className="w-full mt-4 bg-accent hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Sign Out (User: {userId})
                </button>
            ) : (
                <button
                onClick={() => { onNavigateToLogin(); setIsMobileMenuOpen(false); }}
                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                Sign In
                </button>
            )}
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
