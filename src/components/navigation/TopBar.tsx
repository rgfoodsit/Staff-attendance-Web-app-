'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  User, 
  Smartphone, 
  Laptop, 
  Check, 
  ChevronDown, 
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { UserProfile, UserRole, InAppNotification } from '@/types';
import { AppStore } from '@/lib/app-store';

interface TopBarProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  notifications: InAppNotification[];
  onNotificationsRead: () => void;
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
  onLogout?: () => void;
  onNavigateProfile?: () => void;
}

export function TopBar({
  currentUser,
  onRoleChange,
  notifications,
  onNotificationsRead,
  isMobilePreview,
  setIsMobilePreview,
  onLogout,
  onNavigateProfile,
}: TopBarProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleRoleSelect = (role: UserRole) => {
    setShowRoleMenu(false);
    onRoleChange(role);
    if (role === 'employee') {
      setIsMobilePreview(true);
    } else {
      setIsMobilePreview(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="puchIn Logo"
            className="w-9 h-9 rounded-xl object-contain shadow-md shadow-red-500/20"
          />
          <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            puchIn
          </h1>
        </div>

        {/* Center / Portal Indicator */}
        {currentUser.role === 'employee' ? (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Mobile Web (Employee Portal)</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop Management Portal ({currentUser.role.toUpperCase()})</span>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                if (!showNotifMenu) onNotificationsRead();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-50">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    In-App Notifications
                  </span>
                  <span className="text-[11px] text-slate-400">{notifications.length} total</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 text-xs space-y-1 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>



          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 transition"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold leading-tight">{currentUser.fullName}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-bold">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-50 py-1">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500">
                  Switch Active Role (Demo Mode)
                </div>
                {(['employee', 'hr', 'admin'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 capitalize"
                  >
                    <span className="font-medium">{role}</span>
                    {currentUser.role === role && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                  {currentUser.role !== 'employee' && onNavigateProfile && (
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onNavigateProfile();
                      }}
                      className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium"
                    >
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>My Profile</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onLogout?.();
                    }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
