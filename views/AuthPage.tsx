
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { LocalStore } from '../services/localStore';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // KYC State
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        setLoadingStatus('Authenticating...');
        await signInWithEmailAndPassword(auth, email, password);
        // Navigation handled by App.tsx listener, but we want to force direction potentially
      } else {
        // Sign Up Validation
        if (!idFront || !idBack || !selfie) {
          throw new Error("Mandatory: Upload ID Front, Back, and Selfie to verify identity.");
        }
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");

        setLoadingStatus('Creating Account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;

        setLoadingStatus('Securing Documents...');
        const [frontUrl, backUrl, selfieUrl] = await Promise.all([
          uploadToCloudinary(idFront),
          uploadToCloudinary(idBack),
          uploadToCloudinary(selfie)
        ]);

        setLoadingStatus('Verifying Identity...');
        const newProfile: UserProfile = {
          uid: user.uid,
          fullName,
          email,
          phone,
          idFrontUrl: frontUrl,
          idBackUrl: backUrl,
          selfieUrl: selfieUrl,
          verificationStatus: 'verified', // Auto-verify on upload for this flow
          createdAt: Date.now(),
        };

        try {
          await setDoc(doc(db, 'users', user.uid), newProfile);
        } catch (dbErr) {
          console.warn("Database unavailable, saving locally.");
          LocalStore.saveProfile(newProfile);
        }

        // Redirect directly to packages to match the desired flow
        navigate('/packages');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed.");
      setLoading(false);
    }
  };

  const UploadBox: React.FC<{ 
    label: string, 
    onChange: (f: File | null) => void,
    preview: File | null,
    icon: string
  }> = ({ label, onChange, preview, icon }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Update internal preview URL when file changes
    React.useEffect(() => {
        if (preview) {
            const url = URL.createObjectURL(preview);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [preview]);

    return (
        <div className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${preview ? 'border-safaricom-green bg-green-50' : 'border-slate-200 hover:border-safaricom-green hover:bg-slate-50'}`}>
        <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer z-20"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        {previewUrl ? (
            <>
                <div className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-40 transition-opacity" style={{ backgroundImage: `url(${previewUrl})` }}></div>
                <div className="absolute inset-0 bg-green-900/10 z-0"></div>
                <div className="relative z-10 flex items-center space-x-2 text-safaricom-green bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                    <i className="fa-solid fa-check-circle"></i>
                    <span className="text-[10px] font-bold uppercase truncate max-w-[80px]">{preview?.name}</span>
                </div>
            </>
        ) : (
            <div className="text-center text-slate-400 group-hover:text-safaricom-green transition-colors">
                <i className={`fa-solid ${icon} text-lg mb-2`}></i>
                <p className="text-[9px] font-bold uppercase tracking-wider">{label}</p>
            </div>
        )}
        </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-fade-in-up">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create & Verify'}
            </h2>
            <p className="text-xs font-medium text-slate-400">
              {isLogin ? 'Login to manage your boost.' : 'One-step account creation and KYC verification.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-xs font-bold flex items-center gap-2 border border-red-100">
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Legal Name</label>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-safaricom-green focus:ring-4 focus:ring-safaricom-green/10 transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-safaricom-green focus:ring-4 focus:ring-safaricom-green/10 transition-all"
                      placeholder="07XX..."
                    />
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 mb-4">
                     <div className="w-1 h-4 bg-safaricom-green rounded-full"></div>
                     <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Identity Uploads</h3>
                   </div>
                   <div className="grid grid-cols-2 gap-3 mb-3">
                      <UploadBox label="ID Front" icon="fa-id-card" preview={idFront} onChange={setIdFront} />
                      <UploadBox label="ID Back" icon="fa-rotate" preview={idBack} onChange={setIdBack} />
                   </div>
                   <UploadBox label="Live Selfie" icon="fa-camera" preview={selfie} onChange={setSelfie} />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-safaricom-green focus:ring-4 focus:ring-safaricom-green/10 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-safaricom-green focus:ring-4 focus:ring-safaricom-green/10 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full safaricom-btn text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-safaricom-green/20 mt-4 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  <span>{loadingStatus}</span>
                </>
              ) : (
                <span>{isLogin ? 'Access Dashboard' : 'Create & Verify'}</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setIdFront(null);
                setIdBack(null);
                setSelfie(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-safaricom-green transition-colors"
            >
              {isLogin ? "Need a boost? Create Account" : "Already boosted? Login Here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
