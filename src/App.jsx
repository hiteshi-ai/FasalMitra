import { useState, useEffect, useCallback } from 'react';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import HomePage from './pages/Home/HomePage';
import FarmerPortal from './pages/Farmer/FarmerPortal';
import ExpertPortal from './pages/Expert/ExpertPortal';
import FarmerLogin from './pages/Auth/FarmerLogin';
import FarmerSignup from './pages/Auth/FarmerSignup';
import ExpertLogin from './pages/Auth/ExpertLogin';
import { authService } from './services/authService';
import { useLanguage } from './i18n';
import './App.css';

const PATH_MAP = {
  home: '/',
  farmer: '/farmer',
  expert: '/expert',
  login: '/login',
  signup: '/signup',
  'expert-login': '/expert-login'
};

function resolvePageFromPath(pathname) {
  const cleanPath = (pathname || '').toLowerCase();
  if (cleanPath === '/farmer') {
    return authService.isFarmerAuthenticated() ? 'farmer' : 'login';
  }
  if (cleanPath === '/expert') {
    return authService.isExpertAuthenticated() ? 'expert' : 'expert-login';
  }
  if (cleanPath === '/signup') return 'signup';
  if (cleanPath === '/login') return 'login';
  if (cleanPath === '/expert-login') return 'expert-login';
  return 'home';
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return resolvePageFromPath(window.location.pathname);
  });

  const [farmerSession, setFarmerSession] = useState(() => authService.getFarmerSession());
  const [expertSession, setExpertSession] = useState(() => authService.getExpertSession());
  const [authFlashMessage, setAuthFlashMessage] = useState(null);

  // Centralized Navigation and Route Guard
  const handleNavigate = useCallback((targetPage, options = {}) => {
    let resolvedPage = targetPage;

    // Enforce authentication guards
    if (targetPage === 'farmer') {
      if (!authService.isFarmerAuthenticated()) {
        resolvedPage = 'login';
      }
    } else if (targetPage === 'expert') {
      if (!authService.isExpertAuthenticated()) {
        resolvedPage = 'expert-login';
      }
    }

    if (options.message) {
      setAuthFlashMessage(options.message);
    } else {
      setAuthFlashMessage(null);
    }

    setCurrentPage(resolvedPage);

    // Sync browser URL bar
    const newPath = PATH_MAP[resolvedPage] || '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const page = resolvePageFromPath(window.location.pathname);
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync state if initial page redirected
  useEffect(() => {
    const initialExpectedPath = PATH_MAP[currentPage] || '/';
    if (window.location.pathname !== initialExpectedPath) {
      window.history.replaceState(null, '', initialExpectedPath);
    }
  }, [currentPage]);

  // Auth Action Handlers
  const handleFarmerLoginSuccess = (session) => {
    setFarmerSession(session);
    setAuthFlashMessage(null);
    handleNavigate('farmer');
  };

  const handleFarmerSignupSuccess = (message) => {
    handleNavigate('login', { message });
  };

  const { t } = useLanguage();

  const handleFarmerLogout = () => {
    authService.logoutFarmer();
    setFarmerSession(null);
    handleNavigate('login', { message: t('auth.loggedOutSuccess') });
  };

  const handleExpertLoginSuccess = (session) => {
    setExpertSession(session);
    setAuthFlashMessage(null);
    handleNavigate('expert');
  };

  const handleExpertLogout = () => {
    authService.logoutExpert();
    setExpertSession(null);
    handleNavigate('expert-login', { message: t('auth.expertSessionClosed') });
  };

  return (
    <div className="app-container">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        farmerSession={farmerSession}
        expertSession={expertSession}
        onFarmerLogout={handleFarmerLogout}
        onExpertLogout={handleExpertLogout}
      />

      <main className="main-content">
        {currentPage === 'home' && (
          <HomePage onNavigate={handleNavigate} />
        )}

        {currentPage === 'farmer' && (
          <FarmerPortal
            onNavigate={handleNavigate}
            farmerSession={farmerSession}
            onFarmerLogout={handleFarmerLogout}
          />
        )}

        {currentPage === 'expert' && (
          <ExpertPortal
            onNavigate={handleNavigate}
            onExpertLogout={handleExpertLogout}
          />
        )}

        {currentPage === 'login' && (
          <FarmerLogin
            onNavigate={handleNavigate}
            onLoginSuccess={handleFarmerLoginSuccess}
            initialMessage={authFlashMessage}
          />
        )}

        {currentPage === 'signup' && (
          <FarmerSignup
            onNavigate={handleNavigate}
            onSignupSuccess={handleFarmerSignupSuccess}
          />
        )}

        {currentPage === 'expert-login' && (
          <ExpertLogin
            onNavigate={handleNavigate}
            onLoginSuccess={handleExpertLoginSuccess}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
