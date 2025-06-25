// src/App.tsx
import React from 'react';
import Header from './components/layout/Header';
import LandingPage from './pages/LandingPage';
// import LoginPage from './pages/LoginPage';
// import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <>
      <Header />
      {/*
        To view other pages, comment out LandingPage and uncomment the desired page.
        Make sure to also manage the Header visibility if a page shouldn't have it
        (e.g., LoginPage might not need the main app Header).
        For now, Header is displayed on all pages.
      */}
      <LandingPage />
      {/* <LoginPage /> */}
      {/* <DashboardPage /> */}
    </>
  );
}

export default App;
