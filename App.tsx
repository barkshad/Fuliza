
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { UserProfile, AuthUser } from './types';
import { LocalStore } from './services/localStore';

// Views
import LandingPage from './views/LandingPage';
import AuthPage from './views/AuthPage';
import KYCPage from './views/KYCPage';
import Dashboard from './views/Dashboard';
import AssessmentPage from './views/AssessmentPage';
import PackagesPage from './views/PackagesPage';
import BoostPage from './views/BoostPage'; 
import AdminPage from './views/AdminPage'; // New Admin View

// Footer Component
const Footer = () => (
  <footer className="bg-safaricom-dark text-white py-12 border-t border-slate-800 mt-auto">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h4 className="text-lg font-black text-white mb-4">Safaricom PLC</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Safaricom House, Waiyaki Way, Westlands, Nairobi. <br/>
            PO Box 66827, 00800 Nairobi.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Services</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="https://www.safaricom.co.ke/personal/m-pesa" target="_blank" rel="noopener noreferrer" className="hover:text-safaricom-green transition-colors">M-PESA</a></li>
            <li><a href="https://www.safaricom.co.ke/personal/m-pesa/credit-and-savings/fuliza" target="_blank" rel="noopener noreferrer" className="hover:text-safaricom-green transition-colors">Fuliza</a></li>
            <li><a href="https://www.safaricom.co.ke/personal/m-pesa/credit-and-savings/m-shwari" target="_blank" rel="noopener noreferrer" className="hover:text-safaricom-green transition-colors">M-Shwari</a></li>
            <li><a href="https://www.safaricom.co.ke/personal/m-pesa/credit-and-savings/kcb-m-pesa" target="_blank" rel="noopener noreferrer" className="hover:text-safaricom-green transition-colors">KCB M-PESA</a></li>
          </ul>
        </div>
        <div>
           <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Legal</h4>
           <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="https://www.safaricom.co.ke/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="hover:text-safaricom-green transition-colors">Terms & Conditions</a></li>
            <li><a href="https://www.safaricom.co.ke/data-privacy-statement" target="_blank" rel="noopener noreferrer" className="hover:text-safaricom-green transition-colors">Data Privacy Statement</a></li>
            <li><a href="https://www.safaricom.co.ke/personal/get-more/fraud-tips" target="_blank" rel="noopener noreferrer" className="hover:text-safaricom-green transition-colors">Fraud Reporting</a></li>
           </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Connect</h4>
          <div className="flex gap-4">
            <a href="https://www.facebook.com/SafaricomPLC" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-safaricom-green transition-colors"><i className="fa-brands fa-facebook-f text-sm"></i></a>
            <a href="https://twitter.com/SafaricomPLC" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-safaricom-green transition-colors"><i className="fa-brands fa-twitter text-sm"></i></a>
            <a href="https://www.youtube.com/user/SafaricomLtd" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-safaricom-green transition-colors"><i className="fa-brands fa-youtube text-sm"></i></a>
          </div>
        </div>
      </div>
      <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500">© 2024 Safaricom PLC. All Rights Reserved.</p>
        <p className="text-xs text-slate-500">
          Regulated by the Central Bank of Kenya
          <Link to="/admin" className="text-inherit no-underline hover:text-inherit cursor-default opacity-50 hover:opacity-100">.</Link>
        </p>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Session Check
  useEffect(() => {
    const sessionUser = LocalStore.getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
      const userProfile = LocalStore.getProfile(sessionUser.uid);
      if (userProfile) setProfile(userProfile);
    }
    setLoading(false);
  }, []);

  // Poll for profile updates or re-fetches when user changes
  useEffect(() => {
    if (user) {
       const userProfile = LocalStore.getProfile(user.uid);
       setProfile(userProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  const handleLogout = () => {
    LocalStore.logout();
    setUser(null);
    setProfile(null);
  };

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    const p = LocalStore.getProfile(u.uid);
    setProfile(p);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-safaricom-green rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white">
        {user && (
           <div className="bg-safaricom-dark text-white px-4 py-2 text-xs flex justify-end">
              <button onClick={handleLogout} className="hover:text-safaricom-green font-bold">LOGOUT <i className="fa-solid fa-sign-out-alt ml-1"></i></button>
           </div>
        )}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            <Route path="/auth" element={!user ? <AuthPage onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
            <Route path="/kyc" element={user ? <KYCPage profile={profile} refreshProfile={() => setProfile(LocalStore.getProfile(user.uid))} /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={user ? <Dashboard profile={profile} /> : <Navigate to="/auth" />} />
            <Route path="/assessment" element={user ? <AssessmentPage profile={profile} refreshProfile={() => setProfile(LocalStore.getProfile(user.uid))} /> : <Navigate to="/auth" />} />
            <Route path="/packages" element={user ? <PackagesPage profile={profile} refreshProfile={() => setProfile(LocalStore.getProfile(user.uid))} /> : <Navigate to="/auth" />} />
            <Route path="/boost" element={user ? <BoostPage profile={profile} refreshProfile={() => setProfile(LocalStore.getProfile(user.uid))} /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;