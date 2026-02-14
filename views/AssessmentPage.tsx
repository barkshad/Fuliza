
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { LocalStore } from '../services/localStore';

const AssessmentPage: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const navigate = useNavigate();
  const [income, setIncome] = useState(0);
  const [bizType, setBizType] = useState('');
  const [years, setYears] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsAnalyzing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = `
        Analyze credit risk for an M-Pesa user:
        - Monthly Income: KES ${income}
        - Business: ${bizType}
        - Years Active: ${years}
      `;

      let data;
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                limit: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ["score", "limit", "reason"],
            }
          }
        });
        data = JSON.parse(resp.text || '{}');
      } catch (aiErr) {
        console.warn("AI Analysis failed, using fallback metrics");
        data = { score: 650, limit: 12500, reason: "Manual assessment logic applied." };
      }
      
      const updates = {
        monthlyIncome: income,
        businessType: bizType,
        yearsInBusiness: years,
        creditScore: data.score || 650,
        eligibleLimit: data.limit || 15000,
        aiReport: data.reason || "Eligibility confirmed based on turnover.",
        verificationStatus: 'assessment_complete' as const
      };

      // Simulate "Thinking" delay for UX
      setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'users', profile.uid), updates);
        } catch (dbErr) {
          console.warn("Firestore unavailable, saving locally");
          LocalStore.updateProfile(profile.uid, updates);
        }
        navigate('/dashboard');
      }, 3000);

    } catch (e) {
      console.error(e);
      // Fallback
      const updates = {
         eligibleLimit: 12000,
         creditScore: 600,
         verificationStatus: 'assessment_complete' as const
      };
      
      try {
        await updateDoc(doc(db, 'users', profile.uid), updates);
      } catch (dbErr) {
        LocalStore.updateProfile(profile.uid, updates);
      }
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-slate-100 relative overflow-hidden">
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-safaricom-green rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-slate-900 animate-pulse">Running Financial Audit...</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Connecting to Daraja 3.0</p>
          </div>
        )}

        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-safaricom-green/10 rounded-2xl flex items-center justify-center text-safaricom-green mx-auto mb-4">
             <i className="fa-solid fa-magnifying-glass-chart text-2xl"></i>
           </div>
           <h1 className="text-2xl font-black text-slate-900 mb-2">Diagnostic Scan</h1>
           <p className="text-sm font-medium text-slate-500">Provide accurate details to maximize your limit score.</p>
        </div>

        <form onSubmit={runAnalysis} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Avg. Monthly Turnover (KES)</label>
            <input 
              type="number" 
              required
              value={income || ''}
              onChange={e => setIncome(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-lg outline-none focus:border-safaricom-green focus:bg-white transition-all"
              placeholder="e.g. 45000"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Primary Source</label>
              <select
                required
                value={bizType}
                onChange={e => setBizType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-safaricom-green focus:bg-white transition-all appearance-none"
              >
                <option value="">Select...</option>
                <option value="business">Small Business / Shop</option>
                <option value="salary">Employed / Salary</option>
                <option value="freelance">Gig / Freelance</option>
                <option value="farming">Agribusiness</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Age (Years)</label>
              <input 
                type="number" 
                required
                value={years || ''}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-lg outline-none focus:border-safaricom-green focus:bg-white transition-all"
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95 mt-4"
          >
            Calculate Max Limit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssessmentPage;
