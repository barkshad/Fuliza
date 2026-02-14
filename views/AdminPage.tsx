
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LocalStore } from '../services/localStore';
import { UserProfile } from '../types';
import { uploadMasterRecord } from '../services/cloudinaryService';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Simple protection check
    const password = window.prompt("Enter Admin Password:");
    if (password === "12345678") {
      setAuthorized(true);
      const allUsers = LocalStore.getAllProfiles();
      setUsers(allUsers.sort((a, b) => b.createdAt - a.createdAt));
    } else {
      alert("Unauthorized Access");
      navigate('/');
    }
  }, [navigate]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Generate CSV
      const headers = ["UID", "Name", "Email", "Phone", "Status", "Limit", "Score", "ID Front", "ID Back", "Selfie"];
      const rows = users.map(u => [
        u.uid,
        `"${u.fullName}"`,
        u.email,
        u.phone,
        u.verificationStatus,
        u.eligibleLimit || 0,
        u.creditScore || 0,
        u.idFrontUrl || "",
        u.idBackUrl || "",
        u.selfieUrl || ""
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      await uploadMasterRecord(csvContent);
      alert("Master Record Synced Successfully to Cloudinary!");
    } catch (e) {
      console.error(e);
      alert("Sync Failed. Please check console logs and ensure API Keys are set in services/cloudinaryService.ts");
    } finally {
      setSyncing(false);
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">User Management & Cloudinary Records</p>
          </div>
          <div className="flex gap-4">
            <Link to="/dashboard" className="px-4 py-2 text-slate-500 font-bold hover:text-slate-900">
              Exit
            </Link>
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="bg-safaricom-green text-white px-6 py-2 rounded-xl font-bold uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
              {syncing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
              Sync Master Record
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Limit</th>
                  <th className="px-6 py-4">Documents</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900">{user.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{user.uid}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600">{user.email}</div>
                      <div className="text-slate-500 text-xs">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                        ${user.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : 
                          user.verificationStatus === 'unverified' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'}`}>
                        {user.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      KES {user.eligibleLimit?.toLocaleString() || '---'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.idFrontUrl ? (
                          <a href={user.idFrontUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 px-2 py-1 rounded bg-blue-50">
                            Front
                          </a>
                        ) : <span className="text-slate-300 text-xs">---</span>}
                        
                        {user.idBackUrl ? (
                          <a href={user.idBackUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 px-2 py-1 rounded bg-blue-50">
                            Back
                          </a>
                        ) : <span className="text-slate-300 text-xs">---</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                      No users found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;