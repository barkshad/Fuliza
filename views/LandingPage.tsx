
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';

const LandingPage: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState({ age: 0, turnover: 0, limit: 0 });

  const startScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phoneNumber.length < 10 || isScanning) return;

    setIsScanning(true);
    setProgress(0);
    
    const steps = [
      { t: 0, p: 10, msg: 'Connecting to M-Pesa Ledger...' },
      { t: 1000, p: 40, msg: 'Analyzing Transaction Volume (2023-2024)...' },
      { t: 2500, p: 75, msg: 'Calculating Repayment Consistency...' },
      { t: 3800, p: 90, msg: 'Optimizing Max Limit Capability...' },
      { t: 4500, p: 100, msg: 'Finalizing Report...' }
    ];

    steps.forEach(({ t, p, msg }) => {
      setTimeout(() => {
        setScanStep(msg);
        setProgress(p);
      }, t);
    });

    setTimeout(() => {
      // Simulation Logic
      const randomAge = Math.floor(Math.random() * 3) + 3; // 3-6 years
      const randomTurnover = Math.floor(Math.random() * (90000 - 25000) + 25000);
      const calculatedLimit = 12000 + (randomAge * 2000) + Math.floor(randomTurnover * 0.12);
      const finalLimit = Math.min(50000, Math.ceil(calculatedLimit / 500) * 500);

      setScanResult({
        age: randomAge,
        turnover: randomTurnover,
        limit: finalLimit
      });

      setIsScanning(false);
      setShowResults(true);
    }, 5000);
  };

  const handleClaim = () => {
    navigate(user ? '/dashboard' : '/auth');
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-lg bg-white rounded-[48px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative transition-all duration-500">
        
        {/* Top Gradient Header */}
        <div className="relative bg-gradient-to-br from-[#020617] via-[#0F172A] to-[#1E293B] p-8 pt-12 pb-24 text-white text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-safaricom-green/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent opacity-10"></div>
          
          <div className="relative z-10 animate-fade-in-up">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 shadow-lg ring-1 ring-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-safaricom-green animate-pulse mr-2"></span>
              Instant Boost Active
            </span>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-none mb-3 drop-shadow-lg">
              MAX YOUR <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-safaricom-green to-emerald-400">LIMIT NOW</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium max-w-[80%] mx-auto leading-relaxed">Unlock up to KES 50,000 instantly based on your transaction history.</p>
          </div>
        </div>

        {/* Content Card */}
        <div className="relative z-20 -mt-14 px-6 pb-8">
          <div className="glass-card rounded-[32px] p-6 md:p-8 shadow-xl">
            
            {/* SCANNING STATE */}
            {isScanning ? (
              <div className="text-center py-6">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-safaricom-green border-r-safaricom-green rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fa-solid fa-fingerprint text-3xl text-safaricom-green animate-pulse"></i>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 mb-2">System Analysis</h3>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div 
                    className="bg-safaricom-green h-full transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(73,170,68,0.5)]" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{scanStep}</p>
              </div>
            ) : showResults ? (
              /* RESULTS STATE */
              <div className="text-center animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-full text-safaricom-green mb-4 shadow-inner">
                  <i className="fa-solid fa-check-double text-2xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Eligibility Confirmed!</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">Verified via {scanResult.age} years history</p>

                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white mb-6 shadow-2xl shadow-slate-900/20 relative overflow-hidden group border border-slate-700">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-safaricom-green/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-safaricom-green/20 transition-all duration-700"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Approved Limit Upgrade</p>
                    <div className="text-4xl md:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-safaricom-green to-white mb-4">
                      KES {scanResult.limit.toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                       <div className="text-left">
                         <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Avg. Turnover</p>
                         <p className="text-xs font-bold text-slate-300">KES {scanResult.turnover.toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Trust Score</p>
                         <div className="flex items-center justify-end gap-1">
                           <i className="fa-solid fa-star text-[10px] text-yellow-400"></i>
                           <p className="text-xs font-bold text-white">98/100</p>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleClaim}
                  className="w-full safaricom-btn text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-safaricom-green/20 text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Claim Limit Now</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            ) : (
              /* INPUT STATE */
              <div className="space-y-6 animate-fade-in-up">
                 <div className="text-center mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Check Eligibility</p>
                    <h2 className="text-xl font-black text-slate-900">Enter M-Pesa Number</h2>
                 </div>
                 
                 <form onSubmit={startScan}>
                    <div className="relative mb-5 group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fa-solid fa-mobile-screen text-slate-300 group-focus-within:text-safaricom-green transition-colors"></i>
                      </div>
                      <input 
                        type="tel" 
                        required
                        placeholder="07XX XXX XXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-safaricom-green focus:ring-4 focus:ring-safaricom-green/10 focus:bg-white transition-all font-black text-lg text-slate-900 tracking-widest placeholder:font-medium placeholder:text-slate-300 placeholder:tracking-normal"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={phoneNumber.length < 10}
                      className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 hover:-translate-y-1"
                    >
                      Analyze History
                    </button>
                 </form>

                 <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-100 transition-colors">
                      <i className="fa-solid fa-shield-halved text-safaricom-green text-sm mb-1.5"></i>
                      <p className="text-[9px] font-bold text-slate-600">Secure</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-100 transition-colors">
                      <i className="fa-solid fa-bolt text-yellow-500 text-sm mb-1.5"></i>
                      <p className="text-[9px] font-bold text-slate-600">Fast</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-100 transition-colors">
                      <i className="fa-solid fa-robot text-blue-500 text-sm mb-1.5"></i>
                      <p className="text-[9px] font-bold text-slate-600">AI Driven</p>
                    </div>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
