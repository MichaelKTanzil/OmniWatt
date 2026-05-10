import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, Bell, User as UserIcon, X, Home, Smartphone, CreditCard, LogOut, Zap } from 'lucide-react';
import { collection, doc, limit, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errors';
import { cn } from '../lib/utils';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; createdAt?: number; read?: boolean }>>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const location = useLocation();
  const { user, userData, logout } = useAuth();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const markNotificationsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((item) => item.read === false);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((item) => {
        const notifRef = doc(db, 'users', user.uid, 'notifications', item.id);
        batch.update(notifRef, { read: true });
      });
      await batch.commit();
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/notifications`);
      } catch (loggedError) {
        console.error(loggedError);
      }
    }
  };

  const toggleNotifications = () => {
    setIsNotificationOpen((prev) => {
      const next = !prev;
      if (!prev && next) markNotificationsRead();
      return next;
    });
  };

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

  const formatDate = (value?: number) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };

  const hasUnread = notifications.some((item) => item.read === false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotificationsLoading(false);
      return;
    }

    setNotificationsLoading(true);
    const notifQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(8)
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as { title?: string; message?: string; createdAt?: number; read?: boolean };
          return {
            id: docSnap.id,
            title: data.title || 'Notification',
            message: data.message || '',
            createdAt: data.createdAt,
            read: data.read
          };
        });
        setNotifications(items);
        setNotificationsLoading(false);
      },
      (error) => {
        setNotifications([]);
        setNotificationsLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`);
        } catch (loggedError) {
          console.error(loggedError);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-notification-root]')) return;
      setIsNotificationOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isNotificationOpen]);

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
          <div className="relative" data-notification-root>
            <button onClick={toggleNotifications} className="text-slate-600 relative">
              <Bell className="h-6 w-6" />
              {hasUnread && <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>}
            </button>
            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-[320px] max-w-[90vw] bg-white rounded-2xl shadow-lg border border-slate-200 z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    <p className="text-xs text-slate-500">Log terbaru</p>
                  </div>
                  <button
                    onClick={markNotificationsRead}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Tandai semua terbaca
                  </button>
                </div>
                <div className="max-h-72 overflow-auto">
                  {notificationsLoading && (
                    <div className="px-4 py-3 text-sm text-slate-500">Memuat notifikasi...</div>
                  )}
                  {!notificationsLoading && notifications.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500">Belum ada notifikasi.</div>
                  )}
                  {!notificationsLoading && notifications.length > 0 && (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((item) => (
                        <div key={item.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{item.message}</p>
                            </div>
                            {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-red-500"></span>}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2">{formatDate(item.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
            <div className="relative" data-notification-root>
              <button onClick={toggleNotifications} className="text-slate-600 relative hover:text-indigo-600 transition-colors">
                <Bell className="h-5 w-5" />
                {hasUnread && <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>}
              </button>
              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-[320px] bg-white rounded-2xl shadow-lg border border-slate-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      <p className="text-xs text-slate-500">Log terbaru</p>
                    </div>
                    <button
                      onClick={markNotificationsRead}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Tandai semua terbaca
                    </button>
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {notificationsLoading && (
                      <div className="px-4 py-3 text-sm text-slate-500">Memuat notifikasi...</div>
                    )}
                    {!notificationsLoading && notifications.length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-500">Belum ada notifikasi.</div>
                    )}
                    {!notificationsLoading && notifications.length > 0 && (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((item) => (
                          <div key={item.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                                <p className="text-xs text-slate-500 mt-1">{item.message}</p>
                              </div>
                              {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-red-500"></span>}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2">{formatDate(item.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
