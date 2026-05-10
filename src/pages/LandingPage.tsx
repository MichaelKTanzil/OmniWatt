import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col pt-20 px-8 text-center bg-slate-50 dark:bg-slate-950 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 flex items-center justify-center"
        aria-label="Toggle theme"
        aria-pressed={theme === 'dark'}
      >
        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <div className="flex justify-center items-center gap-2 mb-16 mt-12 bg-white dark:bg-slate-900 w-max mx-auto px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Zap className="h-10 w-10 text-slate-800 dark:text-slate-100" />
          <Zap className="h-10 w-10 text-indigo-600 absolute top-0 left-1 opacity-80" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-900">
          OmniWatt
        </h1>
      </div>

      <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-6">
        Smarter Electricity<br />Starts Here
      </h1>
      
      <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto text-lg">
        OmniWatt membantu kamu menghitung konsumsi listrik, memperkirakan biaya bulanan, dan membeli token listrik.
      </p>

      <Link 
        to="/login"
        className="bg-indigo-600 text-white font-bold tracking-wide uppercase py-4 px-12 rounded-2xl inline-block mx-auto hover:bg-indigo-700 transition-colors shadow-sm"
      >
        Start Now
      </Link>

      <div className="mt-auto opacity-30 dark:opacity-20 pointer-events-none w-full max-w-md mx-auto">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="none" stroke="currentColor" strokeWidth="1" d="M100 20 L20 180 h160 Z" />
          <path fill="none" stroke="currentColor" strokeWidth="1" d="M100 40 L40 160 h120 Z" />
          <path fill="none" stroke="currentColor" strokeWidth="1" d="M100 60 L60 140 h80 Z" />
        </svg>
      </div>
    </div>
  );
}
