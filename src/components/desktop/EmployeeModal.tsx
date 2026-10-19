'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, X, AlertCircle, KeyRound, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { UserProfile, Department, Designation, UserRole } from '@/types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  designations: Designation[];
  currentRole: UserRole; // Role of current user (Admin or HR)
  editingUser?: UserProfile | null;
  onSave: (userData: {
    fullName: string;
    employeeId: string;
    email?: string;
    departmentId: string;
    departmentName: string;
    designationId: string;
    designationTitle: string;
    role: UserRole;
    password?: string;
    isActive?: boolean;
  }) => void;
}

export function EmployeeModal({
  isOpen,
  onClose,
  departments,
  designations,
  currentRole,
  editingUser,
  onSave,
}: EmployeeModalProps) {
  const resolvedFullName = editingUser?.fullName || (editingUser as any)?.full_name || '';
  const resolvedEmployeeId = editingUser?.employeeId || (editingUser as any)?.employee_id || '';

  const getResolvedDeptId = () => {
    const rawDeptId = editingUser?.departmentId || (editingUser as any)?.department_id;
    const rawDeptName = editingUser?.departmentName || (editingUser as any)?.department_name;
    const match = departments.find(
      (d) =>
        (rawDeptId && d.id === rawDeptId) ||
        (rawDeptName && d.name.toLowerCase() === rawDeptName.toLowerCase())
    );
    return match?.id || rawDeptId || departments[0]?.id || '';
  };

  const getResolvedDesigId = () => {
    const rawDesigId = editingUser?.designationId || (editingUser as any)?.designation_id;
    const rawDesigTitle = editingUser?.designationTitle || (editingUser as any)?.designation_title;
    const match = designations.find(
      (d) =>
        (rawDesigId && d.id === rawDesigId) ||
        (rawDesigTitle && d.title.toLowerCase() === rawDesigTitle.toLowerCase())
    );
    return match?.id || rawDesigId || designations[0]?.id || '';
  };

  const resolvedRole = (editingUser?.role || (editingUser as any)?.role || 'employee') as UserRole;

  const defaultCalculatedPwd = (() => {
    if (!editingUser) return '';
    const name = resolvedFullName || '';
    if (!name) return '';
    const first = name.trim().split(' ')[0].toLowerCase();
    return first.charAt(0).toUpperCase() + first.slice(1) + '@123';
  })();

  const existingPassword =
    editingUser?.assignedPassword ||
    (editingUser as any)?.assigned_password ||
    (editingUser as any)?.password ||
    (resolvedRole === 'employee' ? defaultCalculatedPwd : '');

  const [fullName, setFullName] = useState(resolvedFullName);
  const [employeeId, setEmployeeId] = useState(resolvedEmployeeId);
  const [departmentId, setDepartmentId] = useState(getResolvedDeptId());
  const [designationId, setDesignationId] = useState(getResolvedDesigId());
  const [role, setRole] = useState<UserRole>(resolvedRole);
  const [isActive, setIsActive] = useState<boolean>(editingUser ? editingUser.isActive !== false : true);
  const [password, setPassword] = useState(existingPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(resolvedFullName);
      setEmployeeId(resolvedEmployeeId);
      setDepartmentId(getResolvedDeptId());
      setDesignationId(getResolvedDesigId());
      setRole(resolvedRole);
      setIsActive(editingUser ? editingUser.isActive !== false : true);
      setPassword(existingPassword);
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen, editingUser, departments, designations]);

  if (!isOpen) return null;

  const isAdmin = currentRole === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Employee Name is required.');
      return;
    }
    if (!employeeId.trim()) {
      setError('Employee ID is required and must be unique.');
      return;
    }
    if (!editingUser && !password.trim()) {
      setError('Initial password is required for new accounts.');
      return;
    }

    const selectedDept = departments.find((d) => d.id === departmentId);
    const selectedDesig = designations.find((d) => d.id === designationId);

    onSave({
      fullName: fullName.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      departmentId,
      departmentName: selectedDept?.name || 'General',
      designationId,
      designationTitle: selectedDesig?.title || 'Staff',
      role: isAdmin ? role : 'employee', // Only Admin can assign/change roles (PRD #9)
      password: password.trim() || undefined,
      isActive,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              {editingUser ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {editingUser ? 'Edit Employee Account' : 'Add New Employee'}
                </h3>
                {resolvedEmployeeId && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                    {resolvedEmployeeId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {editingUser
                  ? `Editing account details for ${resolvedFullName || resolvedEmployeeId}`
                  : (isAdmin ? 'Admin & Role Management' : 'HR Account Management')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Employee Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jessica Taylor"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Employee ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. EMP-1003"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Must be unique across the organization.</p>
          </div>


          {/* Department (Admin-managed dropdown, PRD #6.3) */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {departments.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Designation (Admin-managed dropdown, PRD #6.4) */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Designation <span className="text-rose-500">*</span>
            </label>
            <select
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {designations.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          {/* Role (Only Admin can change, PRD #9) */}
          {isAdmin ? (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                User Role (Admin Only Permission)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white capitalize"
              >
                <option value="employee">Employee (Mobile Web Only)</option>
                <option value="hr">HR (Desktop Management & Adjustments)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500">
              Role: <strong className="uppercase text-slate-800 dark:text-slate-200">Employee</strong> (Role changes restricted to Admin per PRD #9).
            </div>
          )}

          {/* Account Status (Active / Deactivated) */}
          {editingUser && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Account Status
              </label>
              <select
                value={isActive ? 'active' : 'deactivated'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                    : 'border-rose-300 bg-rose-50/50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                <option value="active">Active (Can log in & record attendance)</option>
                <option value="deactivated">Deactivated (Suspended - cannot log in)</option>
              </select>
            </div>
          )}

          {/* Login Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                {editingUser ? 'Existing Password (or enter new to reset)' : 'Initial Password'} {!editingUser && <span className="text-rose-500">*</span>}
              </label>
              {password && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {showPassword ? 'Password visible' : 'Password hidden'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  editingUser
                    ? (showPassword ? 'Enter new password or view current' : '••••••••')
                    : (showPassword ? 'Enter initial password' : '••••••••')
                }
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword((prev) => !prev);
                }}
                tabIndex={-1}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer z-10 ${
                  showPassword
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={showPassword ? 'Hide password' : 'View password'}
                aria-label={showPassword ? 'Hide password' : 'View password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {editingUser && (
              <p className="text-[10px] text-slate-400 mt-1">
                {password
                  ? (showPassword
                      ? 'Existing password is shown in plain text. Click eye to mask.'
                      : 'Existing password is loaded and masked. Click eye to view.')
                  : 'Click eye to view or type a new password.'}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              {editingUser ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
