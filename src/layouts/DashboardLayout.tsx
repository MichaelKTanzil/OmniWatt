import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, Bell, User as UserIcon, X, Home, Smartphone, CreditCard, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const { userData, logout } = useAuth();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Devices', path: '/devices', icon: Smartphone },
    { name: 'Billing', path: '/billing', icon: CreditCard },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Home';
    if (location.pathname.startsWith('/devices')) return 'Devices';
    if (location.pathname.startsWith('/billing') || location.pathname.startsWith('/payment')) return 'Billing';
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm h-16 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={toggleMobileMenu} className="p-2 -ml-2 text-slate-800">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-600 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="relative">
            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
              <UserIcon className="h-5 w-5 text-slate-500" />
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-slate-100 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-800">{userData?.name || 'User'}</p>
                  <p className="text-sm text-slate-500 truncate">{userData?.email || ''}</p>
                </div>
                <button onClick={logout} className="w-full text-left px-4 py-3 text-red-500 flex items-center gap-3 hover:bg-red-50 transition-colors">
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu}>
          <div className="w-64 h-full bg-white flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="h-16 flex items-center px-4">
              <button onClick={closeMobileMenu} className="p-2 -ml-2 text-slate-800">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    location.pathname.startsWith(link.path) 
                      ? "text-indigo-600 bg-indigo-50" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white shadow-sm flex-col border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
          <div className="relative">
            <Zap className="h-6 w-6 text-slate-800" />
            <Zap className="h-6 w-6 text-indigo-600 absolute top-0 left-[2px] opacity-80" />
          </div>
          <span className="text-xl font-bold text-slate-800">OmniWatt</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                location.pathname.startsWith(link.path)
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:overflow-y-auto">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-2xl font-semibold text-slate-800">{getPageTitle()}</h1>
          <div className="flex items-center gap-6">
            <button className="text-slate-600 relative hover:text-indigo-600 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                 <div className="h-9 w-9 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                    <UserIcon className="h-6 w-6 text-slate-500" />
                 </div>
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-800">{userData?.name || 'User'}</p>
                  <p className="text-sm text-slate-500 truncate">{userData?.email || ''}</p>
                </div>
                <button onClick={logout} className="w-full text-left px-4 py-3 text-red-500 flex items-center gap-3 hover:bg-red-50 transition-colors rounded-b-xl">
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
