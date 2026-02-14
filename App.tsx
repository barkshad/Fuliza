
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import { LocalStore } from './services/localStore';

// Views
import LandingPage from './views/LandingPage';
import AuthPage from './views/AuthPage';
import KYCPage from './views/KYCPage';
import Dashboard from './views/Dashboard';
import AssessmentPage from './views/AssessmentPage';
import PackagesPage from './views/PackagesPage';
import BoostPage from './views/BoostPage'; // Import the BoostPage component

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
        <p className="text-xs text-slate-500">Regulated by the Central Bank of Kenya.</p>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const unsubDoc = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          } else {
            // Fallback to local store if Firestore fails/is slow
            const local = LocalStore.getProfile(currentUser.uid);
            if (local) setProfile(local);
          }
          setLoading(false);
        }, (error) => {
           console.warn("Firestore sync error", error);
           const local = LocalStore.getProfile(currentUser.uid);
           if (local) setProfile(local);
           setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
            <Route path="/kyc" element={user ? <KYCPage profile={profile} /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={user ? <Dashboard profile={profile} /> : <Navigate to="/auth" />} />
            <Route path="/assessment" element={user ? <AssessmentPage profile={profile} /> : <Navigate to="/auth" />} />
            <Route path="/packages" element={user ? <PackagesPage profile={profile} /> : <Navigate to="/auth" />} />
            <Route path="/boost" element={user ? <BoostPage profile={profile} /> : <Navigate to="/auth" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
