'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Building,
  History,
  Settings,
  User,
  LogOut,
  Bell,
  Check,
  ChevronUp,
  Smartphone,
  ShieldCheck,
  X
} from 'lucide-react';
import { UserProfile, UserRole, InAppNotification } from '@/types';

interface LeftSidebarProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  notifications: InAppNotification[];
  onNotificationsRead: () => void;
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  pendingCorrectionsCount?: number;
}

export function LeftSidebar({
  currentUser,
  onRoleChange,
  notifications,
  onNotificationsRead,
  onLogout,
  activeTab = 'dashboard',
  onTabChange,
  pendingCorrectionsCount = 0,
}: LeftSidebarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const isHR = currentUser.role === 'hr';
  const isAdmin = currentUser.role === 'admin';
  const isEmployee = currentUser.role === 'employee';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
        setShowNotifPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setShowProfileMenu(false);
    onRoleChange(role);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-16 hover:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between py-3 transition-all duration-300 ease-in-out group shadow-xl hover:shadow-2xl overflow-visible select-none">
      {/* 1. TOP: Left-Aligned Logo & App Name */}
      <div className="px-2.5 pb-3 border-b border-slate-800/80">
        <div className="h-10 flex items-center overflow-hidden">
          <div className="w-11 shrink-0 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="puchIn Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-md shadow-red-500/20"
            />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pl-1.5">
            <span className="font-bold text-lg text-white tracking-tight">puchIn</span>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE: Navigation Tab Items (Zero horizontal overflow) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-1.5 px-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {!isEmployee ? (
          <>
            {/* Dashboard */}
            <button
              onClick={() => onTabChange?.('dashboard')}
              title="Dashboard"
              className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="w-11 shrink-0 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                Dashboard
              </span>
            </button>

            {/* Employees (HR & Admin) */}
            {(isHR || isAdmin) && (
              <button
                onClick={() => onTabChange?.('employees')}
                title="Employees"
                className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                  activeTab === 'employees'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="w-11 shrink-0 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                  Employees
                </span>
              </button>
            )}

            {/* Corrections */}
            <button
              onClick={() => onTabChange?.('corrections')}
              title="Corrections"
              className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                activeTab === 'corrections'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="w-11 shrink-0 flex items-center justify-center relative">
                <ClipboardCheck className="w-5 h-5" />
                {pendingCorrectionsCount > 0 && (
                  <span className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 group-hover:hidden" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                <span>Corrections</span>
                {pendingCorrectionsCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                    {pendingCorrectionsCount}
                  </span>
                )}
              </div>
            </button>

            {/* Work Reports */}
            <button
              onClick={() => onTabChange?.('reports')}
              title="Work Reports"
              className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="w-11 shrink-0 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                Work Reports
              </span>
            </button>

            {/* Master Data (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => onTabChange?.('masters')}
                title="Master Data"
                className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                  activeTab === 'masters'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="w-11 shrink-0 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                  Master Data
                </span>
              </button>
            )}

            {/* Audit Trail */}
            {(isHR || isAdmin) && (
              <button
                onClick={() => onTabChange?.('audit')}
                title="Audit Trail"
                className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                  activeTab === 'audit'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="w-11 shrink-0 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                  Audit Trail
                </span>
              </button>
            )}

            {/* Settings (HR Only) */}
            {isHR && (
              <button
                onClick={() => onTabChange?.('settings')}
                title="Attendance Settings"
                className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="w-11 shrink-0 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                  Settings
                </span>
              </button>
            )}

            {/* Profile Tab */}
            <button
              onClick={() => onTabChange?.('profile')}
              title="My Profile"
              className={`w-full h-10 flex items-center rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="w-11 shrink-0 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
                My Profile
              </span>
            </button>
          </>
        ) : (
          /* Employee Navigation Item */
          <div className="w-full h-10 flex items-center rounded-xl text-xs font-semibold text-slate-300 bg-indigo-950/40 border border-indigo-800/40 overflow-hidden">
            <div className="w-11 shrink-0 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pr-3">
              <div className="text-xs font-bold text-slate-200">Employee Portal</div>
              <div className="text-[10px] text-slate-400">Mobile Web Simulation</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM: Profile Switch & Controls (Hovered Bottom) */}
      <div ref={menuRef} className="px-2.5 pt-2 border-t border-slate-800/80 relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          title={currentUser.fullName}
          className="w-full h-11 flex items-center rounded-xl hover:bg-slate-800 transition text-left overflow-hidden group/profile"
        >
          <div className="w-11 shrink-0 flex items-center justify-center relative">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {currentUser.fullName.charAt(0)}
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900" />
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden pl-1 flex-1 pr-2">
            <div className="font-semibold text-xs text-slate-200 truncate leading-tight">
              {currentUser.fullName}
            </div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              {currentUser.role}
            </div>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mr-2" />
        </button>

        {/* Profile Switch & Role Switcher Popover */}
        {showProfileMenu && (
          <div className="absolute left-full bottom-2 ml-3 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-3">
            {/* User Info Header */}
            <div className="flex items-center gap-3 pb-2.5 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-inner shrink-0">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white truncate">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.employeeId}</div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {/* Notifications Trigger */}
            <div>
              <button
                onClick={() => {
                  setShowNotifPopover(!showNotifPopover);
                  if (!showNotifPopover) onNotificationsRead();
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between text-slate-300 hover:bg-slate-800 transition"
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notifications</span>
                </span>
                {unreadCount > 0 ? (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white font-bold text-[10px] rounded-full">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">{notifications.length}</span>
                )}
              </button>

              {/* In-Popover Notifications List */}
              {showNotifPopover && (
                <div className="mt-1.5 p-2 bg-slate-950/80 rounded-xl border border-slate-800 max-h-40 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <div className="text-[11px] text-slate-500 text-center py-2">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="text-[11px] p-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
                        <div className="font-semibold text-slate-200">{n.title}</div>
                        <div className="text-slate-400 text-[10px] line-clamp-2">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Role Switcher Section */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1 mb-1">
                Switch Role (Demo)
              </span>
              {(['employee', 'hr', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSelect(r)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between capitalize transition ${
                    currentUser.role === r
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="capitalize">{r === 'hr' ? 'HR Portal' : r === 'admin' ? 'Admin Portal' : 'Employee (Mobile)'}</span>
                  {currentUser.role === r && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            {/* Logout Action */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2 font-medium transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
