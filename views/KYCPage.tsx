
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { LocalStore } from '../services/localStore';

const KYCPage: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const navigate = useNavigate();
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !idFront || !idBack || !selfie) return;

    setLoading(true);
    try {
      const [f, b, s] = await Promise.all([
        uploadToCloudinary(idFront),
        uploadToCloudinary(idBack),
        uploadToCloudinary(selfie)
      ]);

      const updates = {
        idFrontUrl: f,
        idBackUrl: b,
        selfieUrl: s,
        verificationStatus: 'verified' as const
      };

      try {
        await updateDoc(doc(db, 'users', profile.uid), updates);
      } catch (dbErr) {
        console.warn("Firestore update failed, saving locally");
        LocalStore.updateProfile(profile.uid, updates);
      }
      
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('Upload failed.');
    }
  };

  const Input: React.FC<{ label: string, onChange: (f: File | null) => void, preview: File | null }> = ({ label, onChange, preview }) => (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-32 flex flex-col items-center justify-center relative cursor-pointer hover:border-safaricom-green transition-colors">
      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={e => onChange(e.target.files?.[0] || null)} />
      {preview ? (
        <div className="text-center text-safaricom-green">
           <i className="fa-solid fa-check-circle text-2xl mb-2"></i>
           <p className="text-[10px] font-bold uppercase">{preview.name}</p>
        </div>
      ) : (
        <div className="text-center text-slate-400">
          <i className="fa-solid fa-cloud-arrow-up text-2xl mb-2"></i>
          <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">Complete Verification</h1>
          <p className="text-sm text-slate-500">Upload your documents to unlock the dashboard.</p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <Input label="ID Front" onChange={setIdFront} preview={idFront} />
             <Input label="ID Back" onChange={setIdBack} preview={idBack} />
          </div>
          <Input label="Selfie" onChange={setSelfie} preview={selfie} />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-safaricom-green text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg"
          >
            {loading ? 'Uploading...' : 'Submit Documents'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KYCPage;
