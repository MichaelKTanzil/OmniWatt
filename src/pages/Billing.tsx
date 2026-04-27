import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Billing() {
  const navigate = useNavigate();
  const [tokenID, setTokenID] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  
  const tokenOptions = [
    20000, 50000, 100000, 200000, 500000, 1000000
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const handleNext = () => {
    if (!tokenID) return alert('Please enter ID Pelanggan');
    if (!amount) return alert('Please select a token amount');
    // passing state via router
    navigate('/payment', { state: { tokenID, amount } });
  };

  return (
    <div className="max-w-[1024px] w-full mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">PLN Token</h2>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <Clock className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-2">ID Pelanggan<span className="text-red-500">*</span></label>
           <input 
             type="text" 
             value={tokenID}
             onChange={e => setTokenID(e.target.value)}
             placeholder="Enter token ID"
             className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
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
                  ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" 
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
              )}
            >
               <span className="text-xl font-bold text-indigo-600 mb-1">{formatCurrency(opt)}</span>
               <span className="text-sm text-slate-500 font-medium">Rp {formatCurrency(opt)}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-2xl hover:bg-indigo-700 transition-colors mt-8 md:max-w-md md:mx-auto md:block"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
