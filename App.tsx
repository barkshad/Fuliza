
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

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-safaricom-green rounded-3xl flex items-center justify-center shadow-2xl shadow-safaricom-green/30 mb-6 transform -rotate-3">
        <span className="text-white font-black text-5xl italic">F</span>
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
        Fuliza<span className="text-safaricom-green">.app</span>
      </h1>
      <div className="flex items-center space-x-2 opacity-60 mt-2">
         <div className="w-2 h-2 rounded-full bg-[#D9232D] animate-bounce" style={{ animationDelay: '0s' }}></div>
         <div className="w-2 h-2 rounded-full bg-safaricom-green animate-bounce" style={{ animationDelay: '0.2s' }}></div>
         <div className="w-2 h-2 rounded-full bg-black animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  </div>
);

interface ProtectedRouteProps {
  children?: React.ReactNode;
  user: User | null;
  loading: boolean;
}

const ProtectedRoute = ({ children, user, loading }: ProtectedRouteProps) => {
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Profile Listener with Local Fallback
  useEffect(() => {
    if (user) {
      setLoading(true);
      
      // 1. Try Local Storage first for instant UI
      const localProfile = LocalStore.getProfile(user.uid);
      if (localProfile) {
        setProfile(localProfile);
      }

      // 2. Try Firestore
      const docRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            LocalStore.saveProfile(data); // Sync DB to Local
          } else {
            // Document doesn't exist in DB (new user or error?)
            // If we have local profile, we keep it, otherwise null
            if (!localProfile) setProfile(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Profile sync error, relying on local backup:", error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-safaricom-green rounded-xl flex items-center justify-center shadow-lg shadow-safaricom-green/20 transition-transform group-hover:rotate-3">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-xl font-bold text-safaricom-dark tracking-tight">Fuliza</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to="/packages" className="hidden md:flex items-center text-sm font-bold text-gray-500 hover:text-safaricom-green transition-colors">
                    Upgrade
                  </Link>
                  <button 
                    onClick={() => auth.signOut()} 
                    className="w-8 h-8 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-full md:rounded-xl bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 font-bold text-xs transition-all flex items-center justify-center"
                  >
                    <i className="fa-solid fa-power-off md:mr-2"></i>
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link to="/auth" className="text-sm font-bold text-safaricom-green hover:underline">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Routes */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            <Route path="/auth" element={
              loading ? <LoadingScreen /> : (user ? <Navigate to="/packages" /> : <AuthPage />)
            } />
            <Route path="/kyc" element={
              <ProtectedRoute user={user} loading={loading}>
                <KYCPage profile={profile} />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute user={user} loading={loading}>
                <Dashboard profile={profile} />
              </ProtectedRoute>
            } />
            <Route path="/assessment" element={
              <ProtectedRoute user={user} loading={loading}>
                <AssessmentPage profile={profile} />
              </ProtectedRoute>
            } />
            <Route path="/packages" element={
              <ProtectedRoute user={user} loading={loading}>
                <PackagesPage profile={profile} />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="py-8 text-center text-[10px] text-gray-400 border-t border-gray-100">
          <p>© {new Date().getFullYear()} Fuliza Independent Credit Systems. Not affiliated with Safaricom PLC.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
