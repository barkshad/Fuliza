
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';

const LandingPage: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  
  // Inputs
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentLimit, setCurrentLimit] = useState('');
  
  // Checklist Factors
  const [payFast, setPayFast] = useState(false); // Repay < 3 days
  const [frequentUser, setFrequentUser] = useState(false); // Use > 5x month
  const [highInflow, setHighInflow] = useState(false); // Inflow > 5x limit
  const [stagnant, setStagnant] = useState(false); // Limit held > 3 months

  // Animation State
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState({ 
    oldLimit: 0, 
    newLimit: 0, 
    increase: 0 
  });

  const startScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phoneNumber.length < 10 || !currentLimit || isScanning) return;

    setIsScanning(true);
    setProgress(0);
    
    // 1. Animation Steps (Visuals only)
    const steps = [
      { t: 0, p: 10, msg: 'Connecting to Credit Bureau...' },
      { t: 1000, p: 30, msg: 'Analyzing M-Pesa Statement...' },
      { t: 2000, p: 60, msg: 'Evaluating Repayment Patterns...' },
      { t: 3000, p: 85, msg: 'Calculating Affordability Matrix...' },
      { t: 4000, p: 100, msg: 'Finalizing Prediction...' }
    ];

    steps.forEach(({ t, p, msg }) => {
      setTimeout(() => {
        setScanStep(msg);
        setProgress(p);
      }, t);
    });

    // 2. The Core Calculation Logic (Executed after animation)
    setTimeout(() => {
      const limit = parseFloat(currentLimit);
      let increasePercentage = 0.0;

      // Logic A: Usage & Repayment
      if (frequentUser && payFast) {
        increasePercentage += 0.25; // 25% increase
      }

      // Logic B: Inflow (simulated via checklist for this demo)
      if (highInflow) {
        increasePercentage += 0.20; // 20% increase
      }

      // Logic C: Stagnation
      if (stagnant) {
        increasePercentage += 0.10; // 10% increase
      }

      // Calculate Final
      const rawNewLimit = limit * (1 + increasePercentage);
      
      // Round to nearest 100 standard
      const finalLimit = Math.round(rawNewLimit / 100) * 100;

      setScanResult({
        oldLimit: limit,
        newLimit: finalLimit,
        increase: Math.round(increasePercentage * 100)
      });

      setIsScanning(false);
      setShowResults(true);
    }, 4500);
  };

  const handleClaim = () => {
    navigate(user ? '/dashboard' : '/auth');
  };

  const Checkbox: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'bg-green-50 border-safaricom-green' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
    >
      <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${checked ? 'bg-safaricom-green border-safaricom-green' : 'bg-white border-slate-300'}`}>
        {checked && <i className="fa-solid fa-check text-white text-xs"></i>}
      </div>
      <span className="text-xs font-bold text-slate-700">{label}</span>
    </div>
  );

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
              Algorithm V2.1 Active
            </span>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-none mb-3 drop-shadow-lg">
              PREDICT YOUR <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-safaricom-green to-emerald-400">NEW LIMIT</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium max-w-[80%] mx-auto leading-relaxed">
              Calculate your potential increase based on your repayment and usage behavior.
            </p>
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
                    <i className="fa-solid fa-calculator text-3xl text-safaricom-green animate-pulse"></i>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 mb-2">Analyzing Patterns</h3>
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
                  <i className="fa-solid fa-chart-line text-2xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Projection Ready</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">
                  Based on {scanResult.increase > 0 ? `+${scanResult.increase}% growth factors` : 'current usage factors'}
                </p>

                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white mb-6 shadow-2xl shadow-slate-900/20 relative overflow-hidden group border border-slate-700">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-safaricom-green/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-safaricom-green/20 transition-all duration-700"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Potential New Limit</p>
                    <div className="text-4xl md:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-safaricom-green to-white mb-4">
                      KES {scanResult.newLimit.toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                       <div className="text-left">
                         <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Current Limit</p>
                         <p className="text-xs font-bold text-slate-300">KES {scanResult.oldLimit.toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Eligibility</p>
                         <div className="flex items-center justify-end gap-1">
                           <i className="fa-solid fa-circle-check text-[10px] text-safaricom-green"></i>
                           <p className="text-xs font-bold text-white">Qualified</p>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
                   <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                     <i className="fa-solid fa-circle-info mr-1"></i>
                     Disclaimer: This algorithm is a predictive model based on typical M-PESA behavior. The final limit is determined solely by Safaricom and NCBA Bank systems.
                   </p>
                </div>

                <button 
                  onClick={handleClaim}
                  className="w-full safaricom-btn text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-safaricom-green/20 text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Unlock This Limit</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>

                <button 
                  onClick={() => setShowResults(false)}
                  className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
                >
                  Recalculate
                </button>
              </div>
            ) : (
              /* INPUT STATE */
              <div className="space-y-6 animate-fade-in-up">
                 <div className="text-center mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Enter Details</p>
                    <h2 className="text-xl font-black text-slate-900">Credit Calculator</h2>
                 </div>
                 
                 <form onSubmit={startScan} className="space-y-4">
                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Phone Number</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="07XX XXX XXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-safaricom-green focus:ring-4 focus:ring-safaricom-green/10 focus:bg-white transition-all font-bold text-slate-900"
                        />
                      </div>
                      <div className="relative group">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Current Limit</label>
                        <input 
                          type="number" 
                          required
                          placeholder="e.g. 500"
                          value={currentLimit}
                          onChange={(e) => setCurrentLimit(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-safaricom-green focus:ring-4 focus:ring-safaricom-green/10 focus:bg-white transition-all font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Behavior Checklist */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Behavior Patterns</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Checkbox 
                          label="I repay loans within 3 days" 
                          checked={payFast} 
                          onChange={setPayFast} 
                        />
                        <Checkbox 
                          label="I use Fuliza > 5 times a month" 
                          checked={frequentUser} 
                          onChange={setFrequentUser} 
                        />
                        <Checkbox 
                          label="My monthly inflow is > 5x my limit" 
                          checked={highInflow} 
                          onChange={setHighInflow} 
                        />
                        <Checkbox 
                          label="I've had this limit for > 3 months" 
                          checked={stagnant} 
                          onChange={setStagnant} 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={phoneNumber.length < 10 || !currentLimit}
                      className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 hover:-translate-y-1"
                    >
                      Calculate Potential Limit
                    </button>
                 </form>

                 <div className="flex items-center justify-center gap-4 opacity-50">
                    <div className="flex items-center gap-1">
                      <i className="fa-solid fa-shield-halved text-slate-400 text-[10px]"></i>
                      <p className="text-[9px] font-bold text-slate-500">Secure</p>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="flex items-center gap-1">
                      <i className="fa-solid fa-bolt text-slate-400 text-[10px]"></i>
                      <p className="text-[9px] font-bold text-slate-500">Fast</p>
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
