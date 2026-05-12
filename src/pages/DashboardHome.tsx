import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errors';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DeviceData {
  wattage: number;
  count: number;
  dailyUsageHours: number;
}

export default function DashboardHome() {
  const { userData, user } = useAuth();
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [chartRange, setChartRange] = useState<'hourly' | 'daily' | 'monthly'>('daily');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'devices'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devs: DeviceData[] = snapshot.docs.map(doc => doc.data() as DeviceData);
      setDevices(devs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/devices`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dailyRateMultiplier = userData?.dailyRate || 1444.70;
  
  const dailyWh = devices.reduce((sum, d) => sum + (d.wattage * d.count * d.dailyUsageHours), 0);
  const dailyKWh = dailyWh / 1000;
  
  const dailyCost = dailyKWh * dailyRateMultiplier;
  const projectedMonthlyKWh = dailyKWh * 30;
  const projectedMonthlyCost = dailyCost * 30;

  const hourlyUsage = dailyKWh / 24;
  const monthlyUsage = dailyKWh * 30;

  const chartData = devices.length === 0 ? [] : (() => {
    if (chartRange === 'hourly') {
      return Array.from({ length: 24 }).map((_, i) => ({
        label: `${String(i).padStart(2, '0')}:00`,
        description: `${String(i).padStart(2, '0')}:00`,
        usage: hourlyUsage
      }));
    }

    if (chartRange === 'monthly') {
      return Array.from({ length: 12 }).map((_, i) => ({
        label: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(now.getFullYear(), i, 1)),
        description: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(now.getFullYear(), i, 1)),
        usage: monthlyUsage
      }));
    }

    return Array.from({ length: 30 }).map((_, i) => ({
      label: `${i + 1}`,
      description: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(now.getFullYear(), now.getMonth(), i + 1)),
      usage: dailyKWh
    }));
  })();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(val);
  };

  const timezone = userData?.timezone || 'WIB';
  const timezoneMap: Record<string, string> = {
    WIB: 'Asia/Jakarta',
    WITA: 'Asia/Makassar',
    WIT: 'Asia/Jayapura'
  };

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezoneMap[timezone] || 'Asia/Jakarta'
  }).format(now);

  if (loading) return <div className="text-center py-10 animate-pulse text-slate-400">Loading Dashboard...</div>;

  return (
    <div className="max-w-[1024px] w-full mx-auto space-y-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Welcome, <span className="text-indigo-600">{userData?.name?.split(' ')[0]}!</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time Energy Intelligence Dashboard</p>
        </div>
        <div className="hidden sm:flex gap-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Local Rate: Rp {formatCurrency(dailyRateMultiplier)} / kWh</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{timezone} {formattedTime}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min lg:auto-rows-fr">
        {/* Main Chart Card */}
        <div className="lg:col-span-8 h-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold">Usage Trend</h3>
              <p className="text-slate-400 dark:text-slate-400 text-sm">Load monitoring berdasarkan pilihan waktu</p>
            </div>
            <div className="flex gap-2">
              <select
                value={chartRange}
                onChange={(event) => setChartRange(event.target.value as 'hourly' | 'daily' | 'monthly')}
                className="text-[10px] font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 uppercase tracking-widest"
              >
                <option value="hourly">Per Jam</option>
                <option value="daily">Per Hari</option>
                <option value="monthly">Per Bulan</option>
              </select>
            </div>
          </div>
          {/* Usage Trend Chart */}
          <div className="relative h-[250px] lg:h-[320px] w-full mt-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-400 dark:text-slate-500">
              kWh
            </div>
            {devices.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-sm font-medium">No usage data yet</p>
                <p className="text-xs mt-1">Add devices to see your trend</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 16, bottom: 8 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tickFormatter={(value) => `${value.toFixed(1)}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Usage']}
                    content={({ payload }) => {
                      const entry = payload?.[0]?.payload as { description?: string; label?: string; usage?: number } | undefined;
                      if (!entry) return null;
                      return (
                        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.description || entry.label}</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.usage?.toFixed(2)} kWh</p>
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="usage" stroke="#4f46e5" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
            {chartRange === 'hourly' ? 'Jam' : chartRange === 'daily' ? 'Tanggal' : 'Bulan'}
          </div>
        </div>

        {/* Stats Summary Combo */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full">
          
           <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
             <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-6">Daily Summary</h3>
             <div className="space-y-6 relative z-10">
               <div>
                 <p className="text-3xl font-bold">{formatNumber(dailyKWh)} <span className="text-lg font-medium text-slate-400 dark:text-slate-400">kWh</span></p>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily Usage</p>
               </div>
               <div className="h-[2px] bg-slate-100 dark:bg-slate-800 w-full"></div>
               <div>
                  <p className="text-3xl font-bold text-emerald-600">Rp {formatCurrency(dailyCost)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Calculated Cost</p>
               </div>
             </div>
           </div>

           <div className="bg-indigo-900 border-2 border-indigo-900 text-white rounded-[2.5rem] p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
             <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-6 relative z-10">Monthly Est.</h3>
             <div className="space-y-6 relative z-10">
               <div>
                  <p className="text-3xl font-bold">{formatNumber(projectedMonthlyKWh)} <span className="text-lg font-medium text-indigo-300">kWh</span></p>
               </div>
               <div className="h-[2px] bg-indigo-800 w-full"></div>
               <div>
                  <p className="text-3xl font-bold text-emerald-400">Rp {formatCurrency(projectedMonthlyCost)}</p>
               </div>
             </div>
             {/* Decorative Elements */}
             <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
           </div>

        </div>

      </div>
    </div>
  );
}
