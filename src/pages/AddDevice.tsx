import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errors';
import { GoogleGenAI } from '@google/genai';
import { deviceTypesDB } from '../lib/devicesData';

type Step = 'METHOD_SELECT' | 'CATEGORY' | 'BRAND' | 'MODEL' | 'DETAILS' | 'MANUAL';

export default function AddDevice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<Step>('METHOD_SELECT');
  const [loading, setLoading] = useState(false);
  
  // Selection State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: '',
    wattage: '',
    count: '1',
    dailyUsageHours: ''
  });

  const goBack = () => {
    if (step === 'METHOD_SELECT') navigate('/devices');
    else if (step === 'CATEGORY') setStep('METHOD_SELECT');
    else if (step === 'BRAND') setStep('CATEGORY');
    else if (step === 'MODEL') setStep('BRAND');
    else if (step === 'DETAILS') setStep('MODEL');
    else if (step === 'MANUAL') setStep('METHOD_SELECT');
  };

  const saveDevice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    try {
      const payload = {
        name: formData.name,
        brand: formData.brand || '',
        type: formData.type || '',
        wattage: Number(formData.wattage),
        count: Number(formData.count),
        dailyUsageHours: Number(formData.dailyUsageHours),
        createdAt: Date.now(),
        userId: user.uid
      };
      
      await addDoc(collection(db, 'users', user.uid, 'devices'), payload);
      navigate('/devices');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/devices`);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setLoading(true);
    try {
      // Initialize Gemini Vision for device detection
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              },
              {
                text: `Identify this electronic device. Reply with a JSON object strictly containing:
                  {
                    "name": "Short general name (e.g. TV, Laptop)",
                    "brand": "Brand if visible, else empty",
                    "type": "Model/Type if visible, else empty",
                    "wattage": estimated wattage in numbers
                  }`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        setFormData({
          name: result.name || '',
          brand: result.brand || '',
          type: result.type || '',
          wattage: String(result.wattage || ''),
          count: '1',
          dailyUsageHours: ''
        });
        setStep('MANUAL'); // Jump to manual form to review pre-filled data
      }
    } catch (error) {
      console.error('Error scanning device:', error);
      alert('Failed to scan device. Please add manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1024px] w-full mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={goBack} className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">
          {step === 'METHOD_SELECT' && 'Add Device'}
          {step === 'CATEGORY' && 'Pick A Device Category'}
          {step === 'BRAND' && 'Pick A Brand'}
          {step === 'MODEL' && `Pick A Type`}
          {(step === 'DETAILS' || step === 'MANUAL') && 'Device Details'}
        </h2>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-4">
             <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500">Processing...</p>
          </div>
        </div>
      )}

      {/* STEP: METHOD_SELECT */}
      {step === 'METHOD_SELECT' && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {/* Scan Device Block */}
           <div className="col-span-1 md:col-span-2 lg:col-span-1 border-2 border-indigo-900 bg-indigo-900 rounded-[2.5rem] p-8 flex flex-col justify-between text-white relative overflow-hidden group">
             <div className="z-10">
               <h3 className="text-xl font-bold mb-2">Scan Device</h3>
               <p className="text-indigo-200 text-sm leading-relaxed mb-6">Instant detection of model and wattage using Computer Vision.</p>
             </div>
             <div className="relative z-10 w-full">
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full border-2 border-dashed border-indigo-400/50 rounded-3xl p-6 flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
               >
                 <Camera className="w-12 h-12 text-indigo-300 mb-3" />
                 <span className="text-sm font-semibold">Launch Vision Scanner</span>
               </button>
               <input 
                 type="file" 
                 accept="image/*"
                 capture="environment"
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={handleScan}
               />
             </div>
             {/* Decorative Elements */}
             <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
           </div>

           <button 
             onClick={() => setStep('CATEGORY')}
             className="bg-white border-2 text-left border-slate-200 p-8 rounded-[2.5rem] hover:border-indigo-600 hover:shadow-sm transition-all focus:outline-none flex flex-col justify-center"
           >
             <h3 className="font-semibold text-lg text-slate-800">Browse Database</h3>
             <p className="text-slate-500 text-sm mt-2">Select from our list of popular device models and brands.</p>
           </button>

           <button 
             onClick={() => setStep('MANUAL')}
             className="bg-white border-2 text-left border-slate-200 p-8 rounded-[2.5rem] hover:border-indigo-600 hover:shadow-sm transition-all focus:outline-none flex flex-col justify-center"
           >
             <h3 className="font-semibold text-lg text-slate-800">Add Manually</h3>
             <p className="text-slate-500 text-sm mt-2">Type in the custom details if you already know the specs.</p>
           </button>
        </div>
      )}

      {/* STEP: CATEGORY */}
      {step === 'CATEGORY' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(deviceTypesDB).map(cat => (
            <button 
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setFormData(prev => ({ ...prev, name: cat }));
                setStep('BRAND');
              }}
              className="bg-white border-2 border-slate-200 p-6 rounded-[2.5rem] hover:border-indigo-600 hover:text-indigo-600 transition-all font-medium text-slate-800"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* STEP: BRAND */}
      {step === 'BRAND' && !loading && (
        <div className="space-y-4">
          <p className="text-slate-500 font-medium text-lg px-2">{selectedCategory}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys((deviceTypesDB as any)[selectedCategory] || {}).map(brand => (
              <button 
                key={brand}
                onClick={() => {
                  setSelectedBrand(brand);
                  setFormData(prev => ({ ...prev, brand }));
                  setStep('MODEL');
                }}
                className="bg-white border-2 border-slate-200 p-6 rounded-[2.5rem] hover:border-indigo-600 hover:text-indigo-600 transition-all font-medium text-slate-800"
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP: MODEL */}
      {step === 'MODEL' && !loading && (
        <div className="space-y-4">
          <p className="text-slate-500 font-medium text-lg px-2">{selectedCategory} / {selectedBrand}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {((deviceTypesDB as any)[selectedCategory]?.[selectedBrand] || []).map((modelObj: any) => (
              <button 
                key={modelObj.name}
                onClick={() => {
                  setSelectedModel(modelObj.name);
                  setFormData(prev => ({ ...prev, type: modelObj.name, wattage: String(modelObj.wattage) }));
                  setStep('DETAILS');
                }}
                className="bg-white border-2 border-slate-200 p-6 rounded-[2.5rem] hover:border-indigo-600 hover:text-indigo-600 transition-all font-medium text-slate-800 text-sm"
              >
                {modelObj.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP: DETAILS & MANUAL */}
      {(step === 'DETAILS' || step === 'MANUAL') && !loading && (
        <form onSubmit={saveDevice} className="space-y-5 bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-200 md:max-w-2xl">
           {step === 'MANUAL' && (
             <>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Device Name*</label>
                 <input 
                   required 
                   type="text" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   placeholder="Enter device name"
                   className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Brand Name</label>
                 <input 
                   type="text" 
                   value={formData.brand}
                   onChange={e => setFormData({...formData, brand: e.target.value})}
                   placeholder="Enter brand name"
                   className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Brand Type/Model</label>
                 <input 
                   type="text" 
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value})}
                   placeholder="Enter brand type"
                   className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Wattage (Watt)*</label>
                 <input 
                   required
                   type="number" 
                   value={formData.wattage}
                   onChange={e => setFormData({...formData, wattage: e.target.value})}
                   placeholder="Enter device wattage"
                   className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                 />
               </div>
             </>
           )}

           {step === 'DETAILS' && (
             <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-200">
               <p className="text-slate-800 font-bold">{formData.name} / {formData.brand} {formData.type}</p>
               <p className="text-slate-500 text-sm mt-1">Wattage: <span className="font-bold text-indigo-600">{formData.wattage}W</span></p>
             </div>
           )}

           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Device Count*</label>
             <input 
               required
               type="number" 
               min="1"
               value={formData.count}
               onChange={e => setFormData({...formData, count: e.target.value})}
               placeholder="Enter number of device"
               className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
             />
           </div>
           
           <div>
             <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Daily Usage (h)*</label>
             <input 
               required
               type="number" 
               min="0"
               max="24"
               value={formData.dailyUsageHours}
               onChange={e => setFormData({...formData, dailyUsageHours: e.target.value})}
               placeholder="Enter daily usage in hours"
               className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
             />
           </div>

           <button 
             type="submit"
             disabled={loading}
             className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-2xl hover:bg-indigo-700 transition-colors mt-6 disabled:opacity-70 text-sm"
           >
             Save Device
           </button>
        </form>
      )}
    </div>
  );
}
