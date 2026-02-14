
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserStatus, Application } from '../types';
import { LocalStore } from '../services/localStore';

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    verified: 'bg-blue-100 text-blue-700 ring-blue-500/10',
    unverified: 'bg-orange-100 text-orange-700 ring-orange-500/10',
    eligible: 'bg-green-100 text-green-700 ring-green-500/10',
    assessment_complete: 'bg-green-100 text-green-700 ring-green-500/10',
    pending: 'bg-yellow-100 text-yellow-700 ring-yellow-500/10',
    payment_pending: 'bg-purple-100 text-purple-700 ring-purple-500/10',
    approved: 'bg-teal-100 text-teal-700 ring-teal-500/10',
  };
  const style = styles[status] || 'bg-gray-100 text-gray-700 ring-gray-500/10';
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const Dashboard: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    if (profile) {
      if (profile.verificationStatus === 'unverified') {
        navigate('/kyc');
      }
      
      // Load local apps first for immediate render
      const localApps = LocalStore.getApplications(profile.uid);
      setApps(localApps);

      const q = query(collection(db, 'applications'), where('userId', '==', profile.uid));
      const unsub = onSnapshot(q, (snap) => {
        const dbApps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
        
        // Merge apps (DB takes precedence, but we include local-only apps)
        const mergedApps = [...dbApps];
        localApps.forEach(localApp => {
           if (!mergedApps.some(dbApp => dbApp.id === localApp.id)) {
             mergedApps.push(localApp);
           }
        });

        setApps(mergedApps.sort((a, b) => b.createdAt - a.createdAt));
      }, (error) => {
        console.warn("Firestore error, showing local apps", error);
        // On error, just stick with local apps (already set)
      });
      return () => unsub();
    }
  }, [profile, navigate]);

  if (!profile) return null;

  const score = profile.creditScore || 300;
  const scorePct = Math.min(100, Math.max(0, ((score - 300) / 550) * 100));
  
  // Check if there is a pending application to show the 3-5 day message
  const hasPendingApp = apps.some(a => ['pending', 'payment_pending'].includes(a.paymentStatus) || ['pending', 'payment_pending'].includes(a.applicationStatus));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm font-medium text-slate-500">Welcome back, {profile.fullName}</p>
        </div>
        <div>
           <Badge status={profile.verificationStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats */}
        <div className="lg:col-span-1 space-y-8">
          {/* Credit Meter */}
          <div className="glass-card rounded-[32px] p-8 text-center relative overflow-hidden">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Credit Trust Score</h3>
            
            <div className="relative w-44 h-44 mx-auto mb-4">
               {/* Background Circle */}
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="50%" cy="50%" r="70" stroke="#f1f5f9" strokeWidth="16" fill="none" />
                 {/* Progress Circle */}
                 <circle cx="50%" cy="50%" r="70" stroke="url(#gradient)" strokeWidth="16" fill="none" 
                   strokeDasharray={440} 
                   strokeDashoffset={440 - (440 * scorePct) / 100}
                   className="transition-all duration-1000 ease-out drop-shadow-lg"
                   strokeLinecap="round"
                 />
                 <defs>
                   <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="#ef4444" />
                     <stop offset="50%" stopColor="#eab308" />
                     <stop offset="100%" stopColor="#22c55e" />
                   </linearGradient>
                 </defs>
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-5xl font-black text-slate-900 tracking-tighter">{score}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">out of 850</span>
               </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-3 inline-block">
               <p className="text-[10px] font-bold text-slate-500 italic max-w-[200px] leading-relaxed mx-auto">
                 "{profile.aiReport || 'Scan transaction history to update score.'}"
               </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Growth Tips</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start group cursor-default">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-check text-[10px]"></i>
                </div>
                <span className="text-xs font-bold text-slate-600 leading-snug">Transact &gt;5 times weekly to build history.</span>
              </li>
              <li className="flex gap-3 items-start group cursor-default">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-check text-[10px]"></i>
                </div>
                <span className="text-xs font-bold text-slate-600 leading-snug">Pay utility bills via M-Pesa for better scoring.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Main Action & History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Application Status - 3-5 DAYS Message */}
          {hasPendingApp ? (
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 to-purple-500"></div>
               <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">
                 <i className="fa-solid fa-hourglass-half animate-pulse"></i>
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-3">Verification In Progress</h2>
               <p className="text-lg text-slate-500 font-medium mb-8 max-w-md mx-auto">
                 We are currently communicating with the credit bureau to approve your new limit.
               </p>
               
               <div className="inline-flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Time</p>
                    <p className="text-xl font-black text-slate-900">3 to 5 Days</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="text-left">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                     <p className="text-sm font-bold text-blue-600 uppercase">Processing</p>
                  </div>
               </div>
               
               <p className="text-xs text-slate-400 mt-6 font-medium">You will receive an SMS notification once completed.</p>
            </div>
          ) : (
            /* Standard Hero Action Card */
            <div className="glass-dark rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-safaricom-green/30 rounded-full blur-[100px] pointer-events-none group-hover:bg-safaricom-green/40 transition-all duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      Available Potential
                    </p>
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                      KES {profile.eligibleLimit?.toLocaleString() || '---'}
                    </h2>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                    <i className="fa-solid fa-wifi rotate-90 text-white/70 text-lg"></i>
                  </div>
                </div>

                {profile.verificationStatus === 'verified' && (
                  <Link to="/assessment" className="inline-flex items-center bg-safaricom-green hover:bg-[#3d8f39] text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-green-900/50 hover:shadow-green-900/80 hover:-translate-y-1">
                    Run Diagnostic Scan <i className="fa-solid fa-arrow-right ml-3"></i>
                  </Link>
                )}

                {profile.verificationStatus === 'assessment_complete' && (
                  <Link to="/packages" className="inline-flex items-center bg-white text-safaricom-dark hover:bg-slate-50 px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1">
                    Activate Limit <i className="fa-solid fa-bolt ml-3 text-safaricom-green"></i>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* History */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-black text-slate-900">Application History</h3>
              {apps.length > 0 && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{apps.length} RECORDS</span>}
            </div>
            
            {apps.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] border border-slate-100 border-dashed text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-folder-open text-2xl text-slate-300"></i>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">No Applications Yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apps.map((app, index) => (
                  <div 
                    key={app.id} 
                    className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:shadow-lg hover:border-safaricom-green/20 transition-all group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-safaricom-green group-hover:text-white transition-colors shadow-sm">
                        <i className="fa-solid fa-file-invoice text-lg"></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm group-hover:text-safaricom-green transition-colors">{app.selectedPackage}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <i className="fa-regular fa-calendar text-[10px] text-slate-400"></i>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-sm mb-1">+ KES {app.requestedLimit.toLocaleString()}</p>
                      <Badge status={app.paymentStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
