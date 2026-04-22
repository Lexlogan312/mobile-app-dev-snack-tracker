import React, { useState, useEffect } from 'react';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import { useSettings } from '../hooks/useSettings';
import { Save, UserPlus, Trash2, Shield, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
  const { globalThreshold } = useSettings();
  const navigate = useNavigate();
  
  const [thresholdInput, setThresholdInput] = useState(globalThreshold);
  const [isSaving, setIsSaving] = useState(false);
  
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState(null);

  useEffect(() => {
    setThresholdInput(globalThreshold);
  }, [globalThreshold]);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        const adminList = [];
        querySnapshot.forEach((doc) => {
          adminList.push({ id: doc.id, ...doc.data() });
        });
        setAdmins(adminList);
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    };
    fetchAdmins();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'globalThreshold'), { value: Number(thresholdInput) });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    
    setIsManagingAdmins(true);
    try {
      const functions = getFunctions();
      const createAdminUser = httpsCallable(functions, 'createAdminUser');
      await createAdminUser({ email: newAdminEmail });
      
      // Optimistically add to UI
      setAdmins([...admins, { email: newAdminEmail, role: 'admin' }]);
      setNewAdminEmail('');
      toast.success(`Admin invitation sent to ${newAdminEmail}`);
    } catch (error) {
      console.error("Error adding admin:", error);
      toast.error(error.message || 'Failed to add admin');
    } finally {
      setIsManagingAdmins(false);
    }
  };

  const handleRemoveAdmin = async (adminEmail) => {
    setAdminToRemove(adminEmail);
  };

  const confirmRemoveAdmin = async () => {
    if (!adminToRemove) return;
    
    setIsManagingAdmins(true);
    try {
      const functions = getFunctions();
      const disableAdminUser = httpsCallable(functions, 'disableAdminUser');
      await disableAdminUser({ email: adminToRemove });
      
      setAdmins(admins.filter(a => a.email !== adminToRemove));
      toast.success(`${adminToRemove} removed from admins`);
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error(error.message || 'Failed to remove admin');
    } finally {
      setIsManagingAdmins(false);
      setAdminToRemove(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <PageWrapper className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-display text-[var(--color-text-primary)] tracking-tight">Settings</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 font-medium">Manage app configuration</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
          title="Log Out"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--color-border)] mb-8">
        <h2 className="text-xl font-display text-[var(--color-text-primary)] mb-6">General Settings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">
              Global Low Stock Threshold
            </label>
            <input
              type="number"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-glow)] transition-all font-bold text-[var(--color-text-primary)]"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              Snacks with quantity at or below this number will automatically be added to the shopping list.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--color-border)] mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-[var(--color-primary)]" size={24} />
          <h2 className="text-xl font-display text-[var(--color-text-primary)]">Admin Accounts</h2>
        </div>

        <form onSubmit={handleAddAdmin} className="flex gap-2 mb-6">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="New admin email..."
            className="flex-1 px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] transition-all font-bold text-[var(--color-text-primary)]"
            required
          />
          <button
            type="submit"
            disabled={isManagingAdmins || !newAdminEmail}
            className="px-4 py-3 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-glow)] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <UserPlus size={20} />
          </button>
        </form>

        <div className="space-y-3">
          {admins.map((admin, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
              <span className="font-bold text-[var(--color-text-primary)] truncate pr-4">{admin.email}</span>
              <button
                onClick={() => handleRemoveAdmin(admin.email)}
                disabled={isManagingAdmins}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {admins.length === 0 && (
            <p className="text-center text-[var(--color-text-secondary)] font-medium py-4">No admins found.</p>
          )}
        </div>
      </div>
      {adminToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[var(--color-border)] w-full max-w-sm">
            <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-2">Remove Admin?</h3>
            <p className="text-[var(--color-text-secondary)] mb-6 font-medium">
              Are you sure you want to remove <span className="font-bold text-[var(--color-text-primary)]">{adminToRemove}</span> as an admin? They will lose access to the dashboard.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setAdminToRemove(null)}
                className="flex-1 py-3 bg-[var(--color-background)] text-[var(--color-text-secondary)] font-bold rounded-xl hover:bg-gray-200 transition-colors"
                disabled={isManagingAdmins}
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveAdmin}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/30"
                disabled={isManagingAdmins}
              >
                {isManagingAdmins ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default AdminSettings;
