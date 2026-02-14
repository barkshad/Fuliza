
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Application } from '../types';
import { LocalStore } from '../services/localStore';
import { LipanaService } from '../services/lipanaService';

interface Plan {
  id: string;
  name: string;
  badge: string;
  limit: number;
  fee: number;
  icon: string;
  iconColor: string;
  iconBg: string;
  borderColor: string;
}

const BoostPage: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'waiting' | 'success' | 'failed'>('idle');
  const [countDown, setCountDown] = useState(15);

  useEffect(() => {
    // 1. Get the target limit from Session (Calc) or Profile
    const stored = sessionStorage.getItem('fuliza_boost_data');
    let maxLimit = 3000; 

    if (stored) {
      const data = JSON.parse(stored);
      maxLimit = data.projected || 3000;
    } else if (profile?.eligibleLimit) {
        maxLimit = profile.eligibleLimit;
    }

    if (maxLimit < 1000) maxLimit = 1000;

    // 2. Generate Dynamic Tiers
    const goldLimit = maxLimit;
    const silverLimit = Math.floor((maxLimit * 0.75) / 100) * 100;
    const bronzeLimit = Math.floor((maxLimit * 0.50) / 100) * 100;

    const calculatedPlans: Plan[] = [
      {
        id: 'bronze',
        name: 'Bronze Upgrade',
        badge: 'BASIC',
        limit: bronzeLimit,
        fee: Math.ceil((bronzeLimit * 0.1) / 10) * 10, // 10% Fee
        icon: 'B',
        iconColor: 'text-[#B45309]',
        iconBg: 'bg-[#FFEDD5]',
        borderColor: 'border-orange-100'
      },
      {
        id: 'silver',
        name: 'Silver Upgrade',
        badge: 'PRO',
        limit: silverLimit,
        fee: Math.ceil((silverLimit * 0.1) / 10) * 10, // 10% Fee
        icon: 'S',
        iconColor: 'text-[#334155]',
        iconBg: 'bg-[#F1F5F9]',
        borderColor: 'border-slate-200'
      },
      {
        id: 'gold',
        name: 'Gold Upgrade',
        badge: 'MAX',
        limit: goldLimit,
        fee: Math.ceil((goldLimit * 0.1) / 10) * 10, // 10% Fee
        icon: 'G',
        iconColor: 'text-[#A16207]',
        iconBg: 'bg-[#FEF9C3]',
        borderColor: 'border-yellow-100'
      }
    ];
    setPlans(calculatedPlans);
  }, [profile]);

  // Payment Simulation Timer
  useEffect(() => {
    if (paymentStatus === 'waiting') {
      if (countDown > 0) {
        const timer = setTimeout(() => setCountDown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Automatically succeed for demo purposes after 15s
        finishPayment();
      }
    }
  }, [paymentStatus, countDown]);

  const finishPayment = async () => {
    setPaymentStatus('success');
    if (!profile) return;
    
    const plan = plans.find(p => p.id === selectedId);
    if (!plan) return;

    // Finalize DB updates
    const applicationData: any = {
      userId: profile.uid,
      selectedPackage: plan.name,
      requestedLimit: plan.limit,
      serviceFee: plan.fee,
      paymentStatus: 'success',
      applicationStatus: 'under_review', // Moves to review after payment
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'applications'), applicationData);
      await updateDoc(doc(db, 'users', profile.uid), { 
        verificationStatus: 'under_review',
        eligibleLimit: plan.limit 
      });
    } catch (e) {
      console.warn("DB offline, saving local");
      LocalStore.saveApplication({ ...applicationData, id: `local_${Date.now()}` } as Application);
      LocalStore.updateProfile(profile.uid, { verificationStatus: 'under_review' });
    }

    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  const handleUpgrade = async (plan: Plan) => {
    if (!profile) return;
    
    setSelectedId(plan.id);
    setPaymentStatus('processing');

    try {
      // Initiate STK Push
      // Using the direct STK push method as requested
      await LipanaService.initiateSTKPush(
        profile.phone,
        plan.fee,
        `FULIZA_${Date.now()}`
      );
      
      // Move to waiting state to prompt user to check phone
      setPaymentStatus('waiting');
      setCountDown(15);
      
    } catch (e) {
      console.error(e);
      setPaymentStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-10 relative">
      
      {/* Payment Overlay Modal */}
      {paymentStatus !== 'idle' && (
        <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl animate-fade-in-up relative overflow-hidden">
             
             {/* Decor */}
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-safaricom-green to-emerald-400"></div>

             {paymentStatus === 'processing' && (
               <>
                 <div className="w-20 h-20 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-circle-notch animate-spin text-2xl text-safaricom-green"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Initiating Request</h3>
                 <p className="text-sm text-slate-500">Sending M-Pesa prompt...</p>
               </>
             )}

             {paymentStatus === 'waiting' && (
               <>
                 <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <i className="fa-solid fa-mobile-screen-button text-3xl text-safaricom-green"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Check your phone</h3>
                 <p className="text-sm text-slate-500 mb-6 px-4">
                   A PIN prompt has been sent to <span className="font-bold text-slate-900">{profile?.phone}</span>. Please enter your M-PESA PIN to complete the transaction.
                 </p>
                 <div className="bg-slate-100 rounded-xl p-3 mb-6">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time Remaining</p>
                   <p className="text-2xl font-black text-slate-900">00:{countDown < 10 ? `0${countDown}` : countDown}</p>
                 </div>
                 <button onClick={finishPayment} className="text-xs font-bold text-safaricom-green hover:underline">
                   I have entered my PIN
                 </button>
               </>
             )}

             {paymentStatus === 'success' && (
               <>
                 <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-check text-3xl text-safaricom-green"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Payment Successful!</h3>
                 <p className="text-sm text-slate-500 mb-6">Your limit upgrade application has been submitted for final review.</p>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-safaricom-green animate-[width_2s_ease-in-out_infinite]" style={{width: '100%'}}></div>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Redirecting...</p>
               </>
             )}

             {paymentStatus === 'failed' && (
               <>
                 <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-xmark text-3xl text-red-500"></i>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Connection Failed</h3>
                 <p className="text-sm text-slate-500 mb-6">We couldn't reach your phone. Please ensure it is on and has service.</p>
                 <div className="flex gap-3">
                   <button onClick={() => setPaymentStatus('idle')} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                     Cancel
                   </button>
                   <button onClick={() => handleUpgrade(plans.find(p => p.id === selectedId)!)} className="flex-1 py-3 rounded-xl bg-safaricom-green text-white font-bold text-xs uppercase">
                     Retry
                   </button>
                 </div>
               </>
             )}

          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-50 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-safaricom-green rounded-xl flex items-center justify-center shadow-lg shadow-safaricom-green/20">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="text-lg font-black tracking-tight text-slate-800">
            Fuliza <span className="text-safaricom-green">Limit Plus</span>
          </span>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 animate-fade-in-up">
        
        {/* Info Box - Blue */}
        <div className="bg-[#EFF6FF] rounded-2xl p-5 mb-8 flex gap-4 items-start shadow-sm border border-blue-100/50">
          <div className="bg-blue-100 p-2 rounded-full shrink-0 text-blue-600 mt-0.5 animate-pulse">
             <i className="fa-solid fa-spinner text-sm"></i>
          </div>
          <p className="text-sm font-medium text-[#1E3A8A] italic leading-relaxed">
            "Regular M-Pesa transactions and timely loan repayments are key to a high credit score."
          </p>
        </div>

        {/* Options Header */}
        <h2 className="text-lg font-black text-slate-900 mb-4 px-1">Upgrade Options</h2>

        {/* Options List */}
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div 
              key={plan.id}
              onClick={() => handleUpgrade(plan)}
              className={`
                bg-white border rounded-[32px] p-5 flex items-center justify-between shadow-sm hover:shadow-lg transition-all cursor-pointer active:scale-95 duration-300
                ${selectedId === plan.id ? 'border-safaricom-green bg-green-50 ring-2 ring-safaricom-green/20' : `${plan.borderColor} hover:border-safaricom-green/30`}
                animate-fade-in-up
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 ${plan.iconBg} ${plan.iconColor} rounded-[20px] flex items-center justify-center text-xl font-bold shadow-inner shrink-0`}>
                  {selectedId === plan.id && paymentStatus === 'processing' ? (
                    <i className="fa-solid fa-circle-notch animate-spin"></i>
                  ) : (
                    plan.icon
                  )}
                </div>
                
                {/* Details */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-slate-900 text-sm">{plan.name}</h3>
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">New Limit: <span className="text-slate-700 font-bold">KES {plan.limit.toLocaleString()}</span></p>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Fee</p>
                <p className="text-lg font-black text-slate-900 leading-none">
                  <span className="text-xs mr-0.5">KES</span>
                  {plan.fee.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center pb-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
            <i className="fa-solid fa-shield-halved text-xs"></i>
            <span className="text-[10px] font-medium">Secure transaction via Safaricom M-Pesa</span>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">M-PESA APPROVED</p>
        </div>

      </div>
    </div>
  );
};

export default BoostPage;
