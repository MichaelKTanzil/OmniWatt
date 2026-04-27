import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col pt-20 px-8 text-center bg-slate-50">
      <div className="flex justify-center items-center gap-2 mb-16 mt-12 bg-white w-max mx-auto px-6 py-3 rounded-2xl border-2 border-slate-200 shadow-sm">
        <div className="relative">
          <Zap className="h-10 w-10 text-slate-800" />
          <Zap className="h-10 w-10 text-indigo-600 absolute top-0 left-1 opacity-80" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-900">
          OmniWatt
        </h1>
      </div>

      <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
        Smarter Electricity<br />Starts Here
      </h1>
      
      <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
        OmniWatt membantu kamu menghitung konsumsi listrik, memperkirakan biaya bulanan, dan membeli token listrik.
      </p>

      <Link 
        to="/login"
        className="bg-indigo-600 text-white font-bold tracking-wide uppercase py-4 px-12 rounded-2xl inline-block mx-auto hover:bg-indigo-700 transition-colors shadow-sm"
      >
        Start Now
      </Link>

      <div className="mt-auto opacity-30 pointer-events-none w-full max-w-md mx-auto">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="none" stroke="currentColor" strokeWidth="1" d="M100 20 L20 180 h160 Z" />
          <path fill="none" stroke="currentColor" strokeWidth="1" d="M100 40 L40 160 h120 Z" />
          <path fill="none" stroke="currentColor" strokeWidth="1" d="M100 60 L60 140 h80 Z" />
        </svg>
      </div>
    </div>
  );
}
