import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User as UserIcon, Mail, Lock, EyeOff, Eye } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'signup' && password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          createdAt: Date.now(),
          dailyRate: 1444.70 // Default rate IDR / kWh for non-subsidized
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16 px-8 items-center bg-slate-50">
      <div className="flex justify-center items-center gap-2 mb-10 bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl shadow-sm">
        <div className="relative">
          <Zap className="h-8 w-8 text-slate-800" />
          <Zap className="h-8 w-8 text-indigo-600 absolute top-0 left-1 opacity-80" />
        </div>
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-900">
          OmniWatt
        </h1>
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-2">
        {mode === 'login' ? 'Sign In' : 'Sign Up'}
      </h2>
      <p className="text-slate-500 mb-8 font-medium">
        Please {mode === 'login' ? 'Sign In' : 'Sign Up'} to continue
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm">
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

        {mode === 'signup' && (
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              required
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
        </div>

        {mode === 'signup' && (
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
            />
          </div>
        )}

        <button 
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold tracking-wide uppercase py-4 rounded-2xl hover:bg-indigo-700 transition-colors mt-6 shadow-sm disabled:opacity-70 text-sm"
        >
          {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
        </button>

        <p className="text-center text-slate-500 text-sm mt-4">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <Link to={mode === 'login' ? '/signup' : '/login'} className="text-indigo-600 hover:underline font-bold">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </Link>
        </p>
      </form>
    </div>
  );
}
