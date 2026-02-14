
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Application } from '../types';
import { LocalStore } from '../services/localStore';

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
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get the target limit from Session (Calc) or Profile
    const stored = sessionStorage.getItem('fuliza_boost_data');
    let maxLimit = 2000; // Absolute fallback

    if (stored) {
      const data = JSON.parse(stored);
      maxLimit = data.projected || 2000;
    } else if (profile?.eligibleLimit) {
        maxLimit = profile.eligibleLimit;
    }

    // Ensure we have a reasonable minimum for the display
    if (maxLimit < 1000) maxLimit = 1000;

    // 2. Generate Dynamic Tiers based on the calculated max limit
    // Gold = 100% of Limit
    // Silver = 50% of Limit
    // Bronze = 20% of Limit
    const calculatedPlans: Plan[] = [
      {
        id: 'bronze',
        name: 'Bronze Upgrade',
        badge: 'BASIC',
        limit: Math.max(500, Math.floor((maxLimit * 0.2) / 100) * 100),
        fee: Math.max(50, Math.floor((maxLimit * 0.2 * 0.1) / 10) * 10), // Approx 10% fee
        icon: 'B',
        iconColor: 'text-[#B45309]',
        iconBg: 'bg-[#FFEDD5]',
        borderColor: 'border-orange-100'
      },
      {
        id: 'silver',
        name: 'Silver Upgrade',
        badge: 'PRO',
        limit: Math.max(1000, Math.floor((maxLimit * 0.5) / 100) * 100),
        fee: Math.max(100, Math.floor((maxLimit * 0.5 * 0.1) / 10) * 10),
        icon: 'S',
        iconColor: 'text-[#334155]',
        iconBg: 'bg-[#F1F5F9]',
        borderColor: 'border-slate-200'
      },
      {
        id: 'gold',
        name: 'Gold Upgrade',
        badge: 'MAX',
        limit: maxLimit,
        fee: Math.max(200, Math.floor((maxLimit * 0.1) / 10) * 10),
        icon: 'G',
        iconColor: 'text-[#A16207]',
        iconBg: 'bg-[#FEF9C3]',
        borderColor: 'border-yellow-100'
      }
    ];
    setPlans(calculatedPlans);
  }, [profile]);

  const handleSelect = async (plan: Plan) => {
    if (!profile) return;
    
    setSelectedId(plan.id);
    setLoading(true);

    const applicationData: any = {
      userId: profile.uid,
      selectedPackage: plan.name,
      requestedLimit: plan.limit,
      serviceFee: plan.fee,
      paymentStatus: 'pending',
      applicationStatus: 'pending',
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'applications'), applicationData);
      
      const userUpdates = { 
        verificationStatus: 'payment_pending' as const,
        eligibleLimit: plan.limit
      };
      await updateDoc(doc(db, 'users', profile.uid), userUpdates);

    } catch (e) {
      console.warn("DB connection error. Saving locally.");
      LocalStore.saveApplication({ ...applicationData, id: `local_${Date.now()}` } as Application);
      LocalStore.updateProfile(profile.uid, { verificationStatus: 'payment_pending', eligibleLimit: plan.limit });
    } finally {
       // Clear session
       sessionStorage.removeItem('fuliza_boost_data');
       // Redirect to Payment
       window.location.href = "https://lipana.dev/pay/mpesa"; 
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-10">
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
              onClick={() => handleSelect(plan)}
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
                  {loading && selectedId === plan.id ? (
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
                  {plan.fee}
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
