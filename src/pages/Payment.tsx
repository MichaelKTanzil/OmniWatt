import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errors';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toastTimerRef = useRef<number | null>(null);
  const toastProgressTimerRef = useRef<number | null>(null);
  const toastEnterTimerRef = useRef<number | null>(null);
  const toastExitTimerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastProgress, setToastProgress] = useState(0);

  const state = location.state as { tokenID: string; amount: number } | null;

  if (!state) {
    return (
      <div className="text-center py-20">
        <p>Invalid payment session</p>
        <button onClick={() => navigate('/billing')} className="text-orange-500 mt-4">Go Back</button>
      </div>
    );
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (toastProgressTimerRef.current) window.clearTimeout(toastProgressTimerRef.current);
      if (toastEnterTimerRef.current) window.clearTimeout(toastEnterTimerRef.current);
      if (toastExitTimerRef.current) window.clearTimeout(toastExitTimerRef.current);
    };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const simulatedPaymentValue = JSON.stringify({ token: state.tokenID, amount: state.amount, app: 'OmniWatt' });

  const confirmPayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'PLN Token',
        amount: state.amount,
        status: 'Success',
        createdAt: Date.now(),
        userId: user.uid
      });
      await addDoc(collection(db, 'users', user.uid, 'notifications'), {
        title: 'PLN Token Success',
        message: `PLN Token Rp ${formatCurrency(state.amount)} telah berhasil diisi!`,
        read: false,
        createdAt: Date.now(),
        userId: user.uid
      });
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (toastProgressTimerRef.current) window.clearTimeout(toastProgressTimerRef.current);
      if (toastEnterTimerRef.current) window.clearTimeout(toastEnterTimerRef.current);
      if (toastExitTimerRef.current) window.clearTimeout(toastExitTimerRef.current);

      setShowToast(true);
      setToastActive(false);
      setToastProgress(100);
      toastEnterTimerRef.current = window.setTimeout(() => setToastActive(true), 30);
      toastProgressTimerRef.current = window.setTimeout(() => setToastProgress(0), 40);
      toastTimerRef.current = window.setTimeout(() => {
        setToastActive(false);
        toastExitTimerRef.current = window.setTimeout(() => {
          setShowToast(false);
          navigate('/dashboard');
        }, 220);
      }, 1400);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/transactions`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Payment</h2>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-200 space-y-6">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
           <span className="text-slate-600 font-medium text-sm uppercase tracking-wider">Token Amount</span>
           <span className="font-bold text-slate-800">{formatCurrency(state.amount)}</span>
        </div>

        <div className="text-center space-y-2">
           <div className="text-3xl font-bold text-indigo-600">
             Rp {formatCurrency(state.amount)}
           </div>
        </div>

        <div className="flex justify-center py-6">
          <div className="bg-white p-4 rounded-[2rem] border-2 border-slate-200">
             <QRCode value={simulatedPaymentValue} size={200} />
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm">Scan QR Code untuk bayar</p>

        <button 
          onClick={confirmPayment}
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-2xl hover:bg-indigo-700 transition-colors mt-8 disabled:opacity-70"
        >
          {loading ? 'Processing...' : 'Simulate Payment Success'}
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 w-[320px] max-w-[90vw]">
          <div
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl transition-all ${toastActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDuration: '320ms', transitionTimingFunction: 'cubic-bezier(0.21, 0.9, 0.24, 1)' }}
          >
            <div className="px-4 py-3">
              <p className="text-sm font-semibold">Token berhasil ditambahkan</p>
              <p className="text-xs text-slate-500">Mengalihkan ke dashboard...</p>
            </div>
            <div className="h-1 w-full bg-slate-100">
              <div
                className="h-full bg-indigo-500"
                style={{
                  width: `${toastProgress}%`,
                  transition: 'width 1400ms linear'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
