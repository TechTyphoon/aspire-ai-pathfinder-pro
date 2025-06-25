// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#' },
    { name: 'Personas', href: '#' },
    { name: 'About', href: '#' },
  ];

  return (
    <header className="bg-surface/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="#" className="text-3xl font-bold text-primary">
              ASPIRO AI
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-text-secondary hover:text-primary transition-colors duration-300 text-lg font-medium"
              >
                {link.name}
              </a>
            ))}
            <button className="ml-6 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              Sign In
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
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
          'md:hidden fixed inset-x-0 top-20 bg-surface/95 backdrop-blur-lg shadow-xl transition-transform duration-300 ease-in-out',
          {
            'transform translate-y-0 opacity-100': isMobileMenuOpen,
            'transform -translate-y-full opacity-0': !isMobileMenuOpen,
          }
        )}
        style={{ clipPath: isMobileMenuOpen ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)'}} // Smooth animation for height
      >
        {isMobileMenuOpen && (
          <div className="px-4 pt-6 pb-8 space-y-5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-text-secondary hover:text-primary transition-colors duration-300 text-xl font-medium py-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)} // Close menu on link click
              >
                {link.name}
              </a>
            ))}
            <button className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
