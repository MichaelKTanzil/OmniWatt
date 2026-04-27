import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errors';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const state = location.state as { tokenID: string; amount: number } | null;

  if (!state) {
    return (
      <div className="text-center py-20">
        <p>Invalid payment session</p>
        <button onClick={() => navigate('/billing')} className="text-orange-500 mt-4">Go Back</button>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const simulatedPaymentValue = JSON.stringify({ token: state.tokenID, amount: state.amount, app: 'OmniWatt' });

  const confirmPayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Record transaction
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type: 'PLN Token',
        amount: state.amount,
        status: 'Success',
        createdAt: Date.now(),
        userId: user.uid
      });
      // Add a notification
      await addDoc(collection(db, 'users', user.uid, 'notifications'), {
        title: 'PLN Token Success',
        message: `PLN Token Rp ${formatCurrency(state.amount)} telah berhasil diisi!`,
        read: false,
        createdAt: Date.now(),
        userId: user.uid
      });
      setSuccess(true);
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

      {success && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-4 border-2 border-slate-200">
             <div className="flex justify-center">
                 <CheckCircle className="h-16 w-16 text-emerald-500" />
             </div>
             <h3 className="text-2xl font-bold text-emerald-500">Successful!</h3>
             <p className="text-slate-600">Woohoo! You have added a Token Rp {formatCurrency(state.amount)}</p>
             <button 
               onClick={() => navigate('/dashboard')}
               className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-2xl transition-colors mt-4 text-sm uppercase tracking-wide"
             >
               Continue
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
