// src/pages/LandingPage.tsx
import React from 'react';
import { ArrowRightIcon, AcademicCapIcon, BriefcaseIcon, LightBulbIcon, UserGroupIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text-DEFAULT overflow-x-hidden">
      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Hero Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-surface to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Navigate Your <span className="text-primary">Career Path</span>
            <br />
            with Unprecedented Clarity.
          </h1>
          <p className="mt-8 text-xl sm:text-2xl text-text-secondary max-w-3xl mx-auto">
            ASPIRO AI leverages cutting-edge artificial intelligence to provide personalized career guidance, helping you discover your potential and achieve your professional dreams.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-10 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg">
              Get Started
            </button>
            <button className="bg-surface hover:bg-surface/70 text-text-DEFAULT font-semibold py-4 px-10 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg border border-primary/50">
              Learn More <ArrowRightIcon className="inline h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-primary">Why ASPIRO AI?</h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              Unlock a suite of powerful tools designed to illuminate your career journey and empower your decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: <AcademicCapIcon className="h-12 w-12 text-primary mb-4" />,
                title: 'AI Resume Analyzer',
                description: 'Get instant, detailed feedback on your resume, tailored to specific roles or general improvement.',
              },
              {
                icon: <BriefcaseIcon className="h-12 w-12 text-primary mb-4" />,
                title: 'Career Path Explorer',
                description: 'Discover potential career paths based on your skills, interests, and market trends.',
              },
              {
                icon: <LightBulbIcon className="h-12 w-12 text-primary mb-4" />,
                title: 'Personalized Insights',
                description: 'Receive AI-driven suggestions and insights to navigate your career choices effectively.',
              },
              {
                icon: <UserGroupIcon className="h-12 w-12 text-primary mb-4" />,
                title: 'Market Trend Analysis',
                description: 'Stay ahead with up-to-date information on industry demands and skill requirements.',
              },
              {
                icon: <ChatBubbleLeftRightIcon className="h-12 w-12 text-primary mb-4" />,
                title: 'AI Career Assistant',
                description: 'Your personal AI mentor to answer career questions and provide guidance 24/7.',
              },
              {
                icon: <ShieldCheckIcon className="h-12 w-12 text-primary mb-4" />,
                title: 'Secure & Confidential',
                description: 'Your data is protected with industry-standard security, ensuring privacy and trust.',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-surface p-8 rounded-xl shadow-2xl hover:shadow-primary/30 transition-shadow duration-300 flex flex-col items-center text-center transform hover:-translate-y-1">
                {feature.icon}
                <h3 className="text-2xl font-semibold mb-3 text-text-DEFAULT">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-surface to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-primary">Who is ASPIRO AI For?</h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              Whether you're starting out, seeking change, or aiming higher, ASPIRO AI is your trusted partner.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                name: 'The Graduate',
                image: 'https://images.unsplash.com/photo-1577896851231-70f14406eab8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3JhZHVhdGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
                description: "Stepping into the professional world? Get guidance on crafting the perfect resume and finding entry-level opportunities that match your degree.",
              },
              {
                name: 'The Career Changer',
                image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FyZWVyJTIwY2hhbmdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
                description: "Looking for a fresh start? Analyze your transferable skills and explore new industries where you can thrive.",
              },
              {
                name: 'The Ambitious Professional',
                image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmVzc2lvbmFsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
                description: "Aiming for that promotion or leadership role? Optimize your career trajectory and identify skills to reach the next level.",
              },
            ].map((persona) => (
              <div key={persona.name} className="bg-surface rounded-xl shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <img src={persona.image} alt={persona.name} className="w-full h-64 object-cover" />
                <div className="p-8">
                  <h3 className="text-2xl font-semibold mb-3 text-text-DEFAULT">{persona.name}</h3>
                  <p className="text-text-secondary leading-relaxed">{persona.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Placeholder - Can be expanded later */}
      <footer className="py-12 bg-surface text-center">
        <p className="text-text-secondary">&copy; {new Date().getFullYear()} ASPIRO AI. All rights reserved.</p>
        <p className="text-text-secondary mt-2">Crafting the future of careers, one aspiration at a time.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
