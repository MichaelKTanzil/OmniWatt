import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errors';
import { cn } from '../lib/utils';

export default function Billing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tokenID, setTokenID] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<Array<{ id: string; amount: number; createdAt?: number; status?: string }>>([]);
  
  const tokenOptions = [
    20000, 50000, 100000, 200000, 500000, 1000000
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (value?: number) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    const historyQuery = query(
      collection(db, 'users', user.uid, 'transactions'),
      where('type', '==', 'PLN Token'),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const nextHistory = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as { amount?: number; createdAt?: number; status?: string };
          return {
            id: docSnap.id,
            amount: data.amount ?? 0,
            createdAt: data.createdAt,
            status: data.status
          };
        });
        setHistory(nextHistory);
        setHistoryLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.READ, `users/${user.uid}/transactions`);
        setHistoryLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleNext = () => {
    if (!tokenID) return alert('Please enter ID Pelanggan');
    if (!amount) return alert('Please select a token amount');
    navigate('/payment', { state: { tokenID, amount } });
  };

  return (
    <div className="max-w-[1024px] w-full mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">PLN Token</h2>
      </div>

      <div className="space-y-6">
        <div>
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ID Pelanggan<span className="text-red-500">*</span></label>
           <input 
             type="text" 
             value={tokenID}
             onChange={e => setTokenID(e.target.value)}
             placeholder="Enter token ID"
             className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
           />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {tokenOptions.map(opt => (
            <button 
              key={opt}
              onClick={() => setAmount(opt)}
              className={cn(
                "p-6 rounded-[2.5rem] border-2 text-center flex flex-col items-center justify-center transition-all",
                amount === opt 
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-600" 
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 hover:shadow-sm"
              )}
            >
               <span className="text-xl font-bold text-indigo-600 mb-1">{formatCurrency(opt)}</span>
               <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Rp {formatCurrency(opt)}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-2xl hover:bg-indigo-700 transition-colors mt-8 md:max-w-md md:mx-auto md:block"
        >
          Next Step
        </button>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">History Saldo</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Terbaru</span>
          </div>

          {historyLoading && (
            <div className="text-sm text-slate-500 dark:text-slate-400">Memuat riwayat...</div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400">Belum ada transaksi token.</div>
          )}

          {!historyLoading && history.length > 0 && (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Top Up Token PLN</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">Rp {formatCurrency(item.amount)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.status || 'Success'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
