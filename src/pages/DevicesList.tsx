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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);

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

  const removeDevices = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'users', user.uid, 'devices', id))));
      setSelectedIds([]);
      if (selectedDevice && ids.includes(selectedDevice.id)) setSelectedDevice(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/devices`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === devices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(devices.map((device) => device.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleRemoveMode = () => {
    setRemoveMode((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  };

  if (loading) return <div className="animate-pulse py-10 text-center text-slate-500 dark:text-slate-400">Loading Devices...</div>;

  return (
    <div className="space-y-6 max-w-[1024px] mx-auto w-full">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 sm:p-8 -mt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Active Devices</h2>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleRemoveMode}
              className={`font-semibold text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-5 rounded-2xl flex items-center gap-1.5 sm:gap-2 transition-colors ${removeMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-50 dark:bg-red-500/10 text-red-600 hover:text-red-700'}`}
            >
              <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">{removeMode ? 'Cancel Remove' : 'Remove Device'}</span><span className="sm:hidden">{removeMode ? 'Cancel' : 'Remove'}</span>
            </button>
            <Link 
              to="/devices/add" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-5 rounded-2xl flex items-center gap-1.5 sm:gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Device</span><span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                {removeMode && (
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold w-10 sm:w-12">
                    <input
                      type="checkbox"
                      checked={devices.length > 0 && selectedIds.length === devices.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600"
                      aria-label="Select all devices"
                    />
                  </th>
                )}
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Device Name</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Wattage</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold">Count</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold hidden sm:table-cell">Daily Usage (h)</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold w-10 sm:w-16"></th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={removeMode ? 6 : 5} className="px-3 sm:px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No devices added yet. Click 'Add Device' to start tracking.
                  </td>
                </tr>
              ) : (
                devices.map((device, idx) => (
                  <tr 
                    key={device.id} 
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${idx !== devices.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    {removeMode && (
                      <td className="px-3 sm:px-6 py-3 sm:py-4" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(device.id)}
                          onChange={() => toggleSelectOne(device.id)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600"
                          aria-label={`Select ${device.name}`}
                        />
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-800 dark:text-slate-100 font-medium">{device.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-300">{device.wattage} W</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-300">{device.count}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{device.dailyUsageHours}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                      <Edit2 className="h-4 w-4" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {removeMode && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedIds.length} dipilih</p>
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="text-white bg-red-500 hover:bg-red-600 font-semibold text-sm py-2 px-4 rounded-xl flex items-center gap-2"
              disabled={selectedIds.length === 0}
            >
              <Trash2 className="h-4 w-4" /> Hapus
            </button>
          </div>
        )}
      </div>

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Remove devices?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {selectedIds.length} device akan dihapus. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="p-6 flex items-center gap-3 justify-end bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await removeDevices(selectedIds);
                  setShowRemoveConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Details Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Device Details</h3>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400">Device Name</label>
                <div className="font-medium text-slate-800 dark:text-slate-100 text-lg">{selectedDevice.name}</div>
              </div>
              {selectedDevice.brand && (
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Brand Name</label>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{selectedDevice.brand}</div>
                </div>
              )}
              {selectedDevice.type && (
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Brand Type/Model</label>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{selectedDevice.type}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Wattage</label>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{selectedDevice.wattage} W</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Device Count</label>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{selectedDevice.count}</div>
                </div>
                <div>
                  <label className="text-sm text-slate-500 dark:text-slate-400">Daily Usage</label>
                  <div className="font-medium text-slate-800 dark:text-slate-100">{selectedDevice.dailyUsageHours} hours</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button 
                onClick={() => {
                  setSelectedIds([selectedDevice.id]);
                  setShowRemoveConfirm(true);
                }}
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
