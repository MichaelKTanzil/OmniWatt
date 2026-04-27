import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errors';

export interface Device {
  id: string;
  name: string;
  brand?: string;
  type?: string;
  wattage: number;
  count: number;
  dailyUsageHours: number;
}

export default function DevicesList() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'devices'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
      setDevices(devs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/devices`);
    });
    
    return () => unsubscribe();
  }, [user]);

  const removeDevice = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to remove this device?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'devices', id));
        setSelectedDevice(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/devices/${id}`);
      }
    }
  };

  if (loading) return <div className="animate-pulse py-10 text-center">Loading Devices...</div>;

  return (
    <div className="space-y-6 max-w-[1024px] mx-auto w-full">
      <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 -mt-2">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-800">Active Devices</h2>
          <Link 
            to="/devices/add" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Device
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 text-sm">
                <th className="px-6 py-4 font-semibold">Device Name</th>
                <th className="px-6 py-4 font-semibold">Wattage</th>
                <th className="px-6 py-4 font-semibold">Count</th>
                <th className="px-6 py-4 font-semibold">Daily Usage (h)</th>
                <th className="px-6 py-4 font-semibold w-16"></th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    No devices added yet. Click 'Add Device' to start tracking.
                  </td>
                </tr>
              ) : (
                devices.map((device, idx) => (
                  <tr 
                    key={device.id} 
                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${idx !== devices.length - 1 ? 'border-b border-slate-50' : ''}`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <td className="px-6 py-4 text-slate-800 font-medium">{device.name}</td>
                    <td className="px-6 py-4 text-slate-600">{device.wattage} Watt</td>
                    <td className="px-6 py-4 text-slate-600">{device.count}</td>
                    <td className="px-6 py-4 text-slate-600">{device.dailyUsageHours}</td>
                    <td className="px-6 py-4 text-slate-400 hover:text-slate-600">
                      <Edit2 className="h-4 w-4" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Details Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">Device Details</h3>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm text-slate-500">Device Name</label>
                <div className="font-medium text-slate-800 text-lg">{selectedDevice.name}</div>
              </div>
              {selectedDevice.brand && (
                <div>
                  <label className="text-sm text-slate-500">Brand Name</label>
                  <div className="font-medium text-slate-800">{selectedDevice.brand}</div>
                </div>
              )}
              {selectedDevice.type && (
                <div>
                  <label className="text-sm text-slate-500">Brand Type/Model</label>
                  <div className="font-medium text-slate-800">{selectedDevice.type}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500">Wattage</label>
                  <div className="font-medium text-slate-800">{selectedDevice.wattage} W</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Device Count</label>
                  <div className="font-medium text-slate-800">{selectedDevice.count}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Daily Usage</label>
                  <div className="font-medium text-slate-800">{selectedDevice.dailyUsageHours} hours</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => removeDevice(selectedDevice.id)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Remove Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
