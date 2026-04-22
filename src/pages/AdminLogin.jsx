import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import { LockKeyhole } from 'lucide-react';

import { useAdmin } from '../hooks/useAdmin';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAdmin();

  if (authLoading) return null;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="flex flex-col items-center justify-center min-h-[80vh] pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-sm border border-[var(--color-border)]"
      >
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-[var(--color-primary-soft)] rounded-[2rem] flex items-center justify-center rotate-3">
              <LockKeyhole size={48} className="text-[var(--color-primary)]" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-3xl font-display text-[var(--color-text-primary)]">Admin Login</h1>
          <p className="text-[var(--color-text-secondary)] mt-2 font-medium">Only cool admins allowed! 😎</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-4 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-2xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
              placeholder="admin@snacktracker.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-4 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-2xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[var(--color-primary)] text-white font-bold text-xl rounded-2xl shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:bg-[var(--color-primary-light)] transition-all disabled:opacity-70 mt-6 flex justify-center items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-[var(--color-text-secondary)] font-bold hover:text-[var(--color-primary)] transition-colors"
          >
            Back to Snacks
          </button>
        </div>
      </motion.div>
    </PageWrapper>
  );
};

export default AdminLogin;
