'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  FileDown,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  ShieldCheck,
  Plus,
  Search,
  UserCog,
  Building,
  Briefcase,
  History,
  FileText,
  UserPlus,
  User,
  Key,
  Laptop,
  LayoutDashboard,
  ClipboardCheck,
  Trash2
} from 'lucide-react';
import {
  UserProfile,
  AttendanceRecord,
  AttendanceSettings,
  AttendanceCorrection,
  Department,
  Designation,
  DailyWorkReport,
  AuditLogEntry,
  UserRole
} from '@/types';
import { formatTime, formatDate, formatDuration, getLocalDateString } from '@/lib/utils';
import { exportToExcel, exportToPDF, filterAttendanceRecords } from '@/lib/export-service';
import { EvidenceModal } from './EvidenceModal';
import { HrAdjustmentModal } from './HrAdjustmentModal';
import { EmployeeModal } from './EmployeeModal';

interface DesktopManagementViewProps {
  currentUser: UserProfile;
  attendanceRecords: AttendanceRecord[];
  profiles: UserProfile[];
  departments: Department[];
  designations: Designation[];
  corrections: AttendanceCorrection[];
  settings: AttendanceSettings;
  dailyReports: DailyWorkReport[];
  auditLogs: AuditLogEntry[];
  onReviewCorrection: (correctionId: string, status: 'approved' | 'rejected', remarks?: string) => void;
  onHrAdjust: (data: any) => void;
  onUpdateSettings: (newSettings: Partial<AttendanceSettings>) => void;
  onSaveDepartment: (depts: Department[]) => void;
  onSaveDesignation: (desigs: Designation[]) => void;
  onSaveProfiles: (profiles: UserProfile[]) => void;
  onUpdateCurrentUser?: (user: UserProfile) => void;
  activeTab?: 'dashboard' | 'employees' | 'corrections' | 'reports' | 'masters' | 'audit' | 'settings' | 'profile';
  onTabChange?: (tab: 'dashboard' | 'employees' | 'corrections' | 'reports' | 'masters' | 'audit' | 'settings' | 'profile') => void;
}

export function DesktopManagementView({
  currentUser,
  attendanceRecords,
  profiles,
  departments,
  designations,
  corrections,
  settings,
  dailyReports,
  auditLogs,
  onReviewCorrection,
  onHrAdjust,
  onUpdateSettings,
  onSaveDepartment,
  onSaveDesignation,
  onSaveProfiles,
  onUpdateCurrentUser,
  activeTab: propActiveTab,
  onTabChange,
}: DesktopManagementViewProps) {
  // Navigation tabs
  const [internalTab, setInternalTab] = useState<'dashboard' | 'employees' | 'corrections' | 'reports' | 'masters' | 'audit' | 'settings' | 'profile'>('dashboard');
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalTab;
  const setActiveTab = (tab: typeof activeTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Profile Form State
  const [profileFullName, setProfileFullName] = useState(currentUser.fullName);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  React.useEffect(() => {
    setProfileFullName(currentUser.fullName);
  }, [currentUser]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!profileFullName.trim()) {
      setProfileErrorMsg('Full Name cannot be empty.');
      return;
    }

    if (profilePassword && profilePassword.length < 6) {
      setProfileErrorMsg('New password must be at least 6 characters.');
      return;
    }

    if (profilePassword && profilePassword !== profileConfirmPassword) {
      setProfileErrorMsg('New password and confirmation do not match.');
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: profileFullName.trim(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateCurrentUser?.(updatedUser);

    const updatedProfiles = profiles.map((p) => p.id === currentUser.id ? updatedUser : p);
    onSaveProfiles(updatedProfiles);

    setProfilePassword('');
    setProfileConfirmPassword('');
    setProfileSuccessMsg('Profile details updated successfully!');
  };

  // Employee Modal State
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<UserProfile | null>(null);

  // Filter States
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Selected records for modals
  const [evidenceRecord, setEvidenceRecord] = useState<AttendanceRecord | null>(null);
  const [adjustmentRecord, setAdjustmentRecord] = useState<AttendanceRecord | null>(null);

  // Settings State
  const [officialTime, setOfficialTime] = useState(settings.officialCheckinTime);
  const [lateThreshold, setLateThreshold] = useState(settings.lateThresholdMinutes);
  const [reminderTime, setReminderTime] = useState(settings.checkoutReminderTime);
  const [reminderEnabled, setReminderEnabled] = useState(settings.checkoutReminderEnabled);
  const [notifyAdjustment, setNotifyAdjustment] = useState(settings.notifyEmployeeOnHrAdjustment);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // New Department / Designation Form
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDesigTitle, setNewDesigTitle] = useState('');

  const isHR = currentUser.role === 'hr';
  const isAdmin = currentUser.role === 'admin';

  const todayStr = getLocalDateString();

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((r) => {
      if (filterDept !== 'all' && r.departmentName !== filterDept) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (dateRange === 'today' && r.attendanceDate !== todayStr) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = r.employeeName?.toLowerCase().includes(query);
        const matchId = r.employeeId?.toLowerCase().includes(query);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [attendanceRecords, filterDept, filterStatus, dateRange, searchQuery, todayStr]);

  // Dashboard KPI Metrics (PRD Section 54)
  const totalEmployees = profiles.length;
  const todayRecords = attendanceRecords.filter((r) => r.attendanceDate === todayStr);
  const presentToday = todayRecords.filter((r) => ['present', 'checked_in', 'checked_out'].includes(r.status) && !r.isLate).length;
  const lateToday = todayRecords.filter((r) => r.isLate).length;
  const absentToday = todayRecords.filter((r) => r.status === 'absent').length;
  const onLeaveToday = todayRecords.filter((r) => ['leave', 'half_day_leave'].includes(r.status)).length;
  const pendingCorrectionsCount = corrections.filter((c) => c.status === 'pending').length;

  const handleExportExcel = async () => {
    try {
      await exportToExcel(filteredRecords, `Attendance_Report_${dateRange}_${todayStr}.xlsx`);
    } catch (e) {
      console.error('Excel export error:', e);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(filteredRecords, `Attendance_Report_${dateRange}_${todayStr}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      officialCheckinTime: officialTime,
      lateThresholdMinutes: Number(lateThreshold),
      checkoutReminderTime: reminderTime,
      checkoutReminderEnabled: reminderEnabled,
      notifyEmployeeOnHrAdjustment: notifyAdjustment,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    try {
      const res = await fetch('/api/masters/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName.trim(), code: newDeptCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to add department');
        return;
      }
      onSaveDepartment([...departments, data.department]);
      setNewDeptName('');
      setNewDeptCode('');
    } catch (err: any) {
      alert(err.message || 'Error adding department');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this department?')) return;
    try {
      const res = await fetch(`/api/masters/departments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to remove department');
        return;
      }
      onSaveDepartment(departments.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error removing department');
    }
  };

  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigTitle) return;
    try {
      const res = await fetch('/api/masters/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDesigTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to add designation');
        return;
      }
      onSaveDesignation([...designations, data.designation]);
      setNewDesigTitle('');
    } catch (err: any) {
      alert(err.message || 'Error adding designation');
    }
  };

  const handleDeleteDesignation = async (id: string) => {
    if (!confirm('Are you sure you want to remove this designation?')) return;
    try {
      const res = await fetch(`/api/masters/designations?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to remove designation');
        return;
      }
      onSaveDesignation(designations.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error removing designation');
    }
  };

  const handleSaveEmployee = async (userData: {
    fullName: string;
    employeeId: string;
    email?: string;
    departmentId: string;
    departmentName: string;
    designationId: string;
    designationTitle: string;
    role: UserRole;
    password?: string;
  }) => {
    let updatedProfiles: UserProfile[];
    if (editingEmployee) {
      updatedProfiles = profiles.map((p) => {
        if (p.id === editingEmployee.id) {
          return {
            ...p,
            fullName: userData.fullName,
            employeeId: userData.employeeId,
            departmentId: userData.departmentId,
            departmentName: userData.departmentName,
            designationId: userData.designationId,
            designationTitle: userData.designationTitle,
            role: userData.role,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      onSaveProfiles(updatedProfiles);
      setShowEmployeeModal(false);
      setEditingEmployee(null);
    } else {
      try {
        const res = await fetch('/api/employees/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: userData.fullName,
            employeeId: userData.employeeId,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            departmentId: userData.departmentId,
            designationId: userData.designationId,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Failed to create employee in database.');
          return;
        }

        const newProfile: UserProfile = data.profile;
        updatedProfiles = [newProfile, ...profiles];
        onSaveProfiles(updatedProfiles);
        setShowEmployeeModal(false);
        setEditingEmployee(null);
      } catch (err: any) {
        alert(err.message || 'Error creating employee account.');
      }
    }
  };

  const handleToggleEmployeeActive = (profileId: string) => {
    const updated = profiles.map((p) => {
      if (p.id === profileId) {
        return { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    onSaveProfiles(updated);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Content Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
              {activeTab === 'dashboard' && 'Workforce Intelligence Dashboard'}
              {activeTab === 'employees' && 'Employee Directory & Access Control'}
              {activeTab === 'corrections' && 'Attendance Corrections Center'}
              {activeTab === 'reports' && 'Daily Work Reports Review'}
              {activeTab === 'masters' && 'Master Data Administration'}
              {activeTab === 'audit' && 'System Audit Trail & Security Log'}
              {activeTab === 'settings' && 'Global Attendance Timing Settings'}
              {activeTab === 'profile' && 'Desktop Account & User Profile'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged in as {currentUser.fullName} ({currentUser.role.toUpperCase()})
            </p>
          </div>

          {/* Action Buttons: Exports (Icon-only by default, reveals label on hover) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              title="Export Excel"
              className="group/btn h-9 px-2.5 hover:px-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all duration-200 flex items-center shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span className="max-w-0 opacity-0 group-hover/btn:max-w-xs group-hover/btn:opacity-100 group-hover/btn:ml-1.5 overflow-hidden whitespace-nowrap transition-all duration-200">
                Export Excel
              </span>
            </button>
            <button
              onClick={handleExportPDF}
              title="Export PDF"
              className="group/btn h-9 px-2.5 hover:px-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all duration-200 flex items-center shadow-xs"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span className="max-w-0 opacity-0 group-hover/btn:max-w-xs group-hover/btn:opacity-100 group-hover/btn:ml-1.5 overflow-hidden whitespace-nowrap transition-all duration-200">
                Export PDF
              </span>
            </button>
          </div>
        </div>

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Cards (PRD Section 54) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-semibold uppercase">Total Staff</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalEmployees}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-semibold uppercase">Present</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentToday}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-semibold uppercase">Late Today</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lateToday}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-semibold uppercase">Absent</span>
                <UserX className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{absentToday}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-semibold uppercase">On Leave</span>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{onLeaveToday}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-semibold uppercase">Corrections</span>
                <AlertCircle className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{pendingCorrectionsCount}</span>
            </div>
          </div>

          {/* Filter Bar (PRD Section 57 & 60) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Department */}
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present (On-Time)</option>
              <option value="late">Late</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="half_day_attendance">Half-Day Attendance</option>
              <option value="half_day_leave">Half-Day Leave</option>
              <option value="leave">Full-Day Leave</option>
              <option value="absent">Absent</option>
              <option value="checkout_pending">Check-out Pending</option>
              <option value="forgotten_checkout">Forgot to check-out</option>
            </select>

            {/* Date Range */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  dateRange === 'today' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  dateRange === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                All Records
              </button>
            </div>
          </div>

          {/* Today's Attendance Table (PRD Section 55) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Attendance Records</h3>
                <p className="text-xs text-slate-500">Showing {filteredRecords.length} records</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Check-in</th>
                    <th className="px-4 py-3">Check-out</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        No matching attendance records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{r.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.employeeId}</div>
                        </td>
                        <td className="px-4 py-3">{r.departmentName}</td>
                        <td className="px-4 py-3">{formatDate(r.attendanceDate)}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatTime(r.effectiveCheckinTime || r.checkinTime)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatTime(r.effectiveCheckoutTime || r.checkoutTime)}
                        </td>
                        <td className="px-4 py-3">{formatDuration(r.workingDurationMinutes)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'forgotten_checkout' || r.status === 'checkout_pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : r.isLate
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : r.status === 'absent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : r.status.includes('leave')
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {r.status === 'forgotten_checkout' ? 'Forgot Check-out' : r.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          {r.isHrAdjusted ? (
                            <span className="text-purple-600 dark:text-purple-400 font-medium">HR Adjusted</span>
                          ) : (
                            <span className="text-slate-400">System Marked</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Evidence Viewer (PRD Section 42) */}
                            <button
                              onClick={() => setEvidenceRecord(r)}
                              title="View Check-in/Check-out Selfie & GPS Evidence"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Direct HR Adjustment (PRD Section 30) */}
                            {isHR && (
                              <button
                                onClick={() => setAdjustmentRecord(r)}
                                title="HR Direct Adjustment"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition"
                              >
                                <UserCog className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Employees Management (PRD Section 6, 8, 66) */}
      {activeTab === 'employees' && (isHR || isAdmin) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Employee Accounts & Profiles</h3>
              <p className="text-xs text-slate-500">
                Managed by Admin and HR. {isAdmin ? 'Admin can also assign/change roles.' : 'Role assignment is Admin-only.'}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setShowEmployeeModal(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>

          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                          {p.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{p.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.departmentName}</td>
                    <td className="px-4 py-3">{p.designationTitle}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono">
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {p.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(p);
                            setShowEmployeeModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleEmployeeActive(p.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                            p.isActive
                              ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {p.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Corrections Review (PRD Section 36 & 37) */}
      {activeTab === 'corrections' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Attendance Correction Requests</h3>
              <p className="text-xs text-slate-500">
                HR and Administrators can review and approve attendance correction requests.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {corrections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No correction requests found.</div>
            ) : (
              corrections.map((c) => {
                const canApprove = isHR || isAdmin;

                return (
                  <div key={c.id} className="p-5 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {c.employeeName}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded">
                          {c.employeeId}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                          {c.correctionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : c.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Original Check-in / Check-out:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatTime(c.originalCheckinTime)} &rarr; {formatTime(c.originalCheckoutTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Requested Value:</span>
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {c.requestedCheckinTime && `Check-in: ${formatTime(c.requestedCheckinTime)} `}
                          {c.requestedCheckoutTime && `Check-out: ${formatTime(c.requestedCheckoutTime)} `}
                          {c.requestedStatus && `Status: ${c.requestedStatus.toUpperCase()}`}
                        </span>
                      </div>
                      <div className="md:col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">Employee Reason: </span>
                        <span className="text-slate-800 dark:text-slate-200 italic">"{c.reason}"</span>
                      </div>
                    </div>

                    {c.status === 'pending' && canApprove && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => onReviewCorrection(c.id, 'rejected')}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => onReviewCorrection(c.id, 'approved')}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve & Apply</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Daily Work Reports (PRD Section 46) */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Staff Daily Work Reports</h3>
            <p className="text-xs text-slate-500">View daily free-text activity summaries submitted by employees</p>
          </div>

          <div className="p-5 space-y-4">
            {dailyReports.map((d) => (
              <div key={d.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{d.employeeName} ({d.employeeId})</span>
                  <span className="text-slate-400">{formatDate(d.reportDate)}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {d.reportText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Master Data (Admin Only, PRD Section 7) */}
      {activeTab === 'masters' && isAdmin && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Departments Master */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Departments Master</h3>
            </div>

            <form onSubmit={handleAddDepartment} className="flex gap-2">
              <input
                type="text"
                placeholder="Department Name"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Code"
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                className="w-24 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {departments.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{d.name}</span>
                    <span className="ml-2 font-mono text-[10px] text-slate-400">({d.code})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(d.id)}
                      title="Remove Department"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Designations Master */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Designations Master</h3>
            </div>

            <form onSubmit={handleAddDesignation} className="flex gap-2">
              <input
                type="text"
                placeholder="Designation Title"
                value={newDesigTitle}
                onChange={(e) => setNewDesigTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {designations.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{d.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDesignation(d.id)}
                      title="Remove Designation"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: System Audit Trail (PRD Section 39) */}
      {activeTab === 'audit' && (isHR || isAdmin) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Complete Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable ledger of administrative actions, HR adjustments, and rule modifications</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 text-xs space-y-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{log.action.toUpperCase()}</span>
                    <span className="text-slate-400 font-mono text-[11px]">&bull; {log.entityName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <span>Performed by: <strong className="text-slate-900 dark:text-white">{log.performedByName || log.performedBy}</strong></span>
                </div>
                {log.reason && (
                  <div className="text-indigo-600 dark:text-indigo-400 italic">
                    Reason: "{log.reason}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Attendance Settings (HR Only, PRD Section 11) */}
      {activeTab === 'settings' && isHR && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">HR Attendance Timing Rules</h3>
              <p className="text-xs text-slate-500">Global organization-wide attendance rules for all staff</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {settingsSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Settings updated and logged to audit trail successfully.</span>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Official Check-in Time
              </label>
              <input
                type="time"
                value={officialTime}
                onChange={(e) => setOfficialTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Late Grace Threshold (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={180}
                value={lateThreshold}
                onChange={(e) => setLateThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Employees checking in after {officialTime} + {lateThreshold}m will automatically be marked Late.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Check-out Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Enable Check-out In-App Reminder
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyAdjustment}
                  onChange={(e) => setNotifyAdjustment(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Notify Employee in-app when HR modifies their attendance
                </span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
              >
                Save Timing Rules
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Section (HR & Admin) */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Hero Profile Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-indigo-500/25 ring-4 ring-white/10">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white">{currentUser.fullName}</h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-indigo-200/90 font-medium">
                    {currentUser.designationTitle || (isHR ? 'Human Resources Manager' : 'System Administrator')}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                    <span className="font-mono bg-white/10 px-2 py-0.5 rounded-md">ID: {currentUser.employeeId}</span>
                    <span>•</span>
                    <span>{currentUser.departmentName || (isHR ? 'Human Resources' : 'Engineering')}</span>
                    <span>•</span>
                    <span className="uppercase text-[11px] font-bold tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">
                      Role: {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs text-slate-400">
                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-slate-300">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  <span>Desktop Management Portal</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Account Info + Personal Details Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Information Overview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Account & Organization Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Employee ID</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{currentUser.employeeId}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">System Role</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-sm">
                      {isHR ? 'Human Resources (HR)' : 'System Administrator (Admin)'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Department</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {currentUser.departmentName || (isHR ? 'Human Resources' : 'Engineering')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Designation</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {currentUser.designationTitle || (isHR ? 'HR Manager' : 'System Administrator')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Platform Access</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">Desktop Web Only (Management Portal)</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-slate-400 font-medium">Account Status</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">Active & Verified</p>
                  </div>
                </div>
              </div>

              {/* Edit Personal Details & Password Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Update Profile & Security</span>
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Update your display name or reset your desktop login credentials.
                </p>

                {profileSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        New Password (optional)
                      </label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={profileConfirmPassword}
                        onChange={(e) => setProfileConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right 1 Col: Role Privileges & Access Scope */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Assigned Role Privileges</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {isHR 
                    ? 'Privileges granted to Human Resources Management:' 
                    : 'Privileges granted to System Superuser Administration:'}
                </p>

                <div className="space-y-2.5">
                  {isHR ? (
                    <>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Configure official check-in timing & late thresholds</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Inspect employee check-in & check-out selfie pictures & GPS</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Approve or reject attendance correction requests</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Direct attendance status & time adjustments with mandatory audit reason</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Add new employees & manage active status</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Export attendance datasets to clean Excel (.xlsx) and PDF</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>View complete system audit trail</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Manage Departments Master (Create, Edit, Deactivate)</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Manage Designations Master (Create, Edit, Deactivate)</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Full User Role assignment & administration (Employee, HR, Admin)</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Review & approve attendance corrections</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Full access to System Audit Logs & security trails</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Comprehensive reporting & master data export</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick System Summary */}
              <div className="bg-linear-to-br from-indigo-50 to-slate-50 dark:from-slate-900 dark:to-indigo-950/30 border border-indigo-100 dark:border-slate-800 rounded-2xl p-5 text-xs space-y-3">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Current Workspace Summary</span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    Live
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Total Employees:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{profiles.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Departments:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{departments.filter(d => d.isActive).length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Corrections:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{corrections.filter(c => c.status === 'pending').length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Attendance Records:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{attendanceRecords.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={!!evidenceRecord}
        onClose={() => setEvidenceRecord(null)}
        record={evidenceRecord}
      />

      {/* HR Adjustment Modal */}
      <HrAdjustmentModal
        isOpen={!!adjustmentRecord}
        onClose={() => setAdjustmentRecord(null)}
        record={adjustmentRecord}
        onSubmit={onHrAdjust}
      />

      {/* Employee Add/Edit Modal (Admin & HR) */}
      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditingEmployee(null);
        }}
        departments={departments}
        designations={designations}
        currentRole={currentUser.role}
        editingUser={editingEmployee}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}
