'use client';

import React, { useState } from 'react';
import { UserCog, X, AlertTriangle } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '@/types';

interface HrAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSubmit: (data: {
    attendanceId: string;
    newStatus: AttendanceStatus;
    effectiveCheckinTime?: string;
    effectiveCheckoutTime?: string;
    reason: string;
  }) => void;
}

export function HrAdjustmentModal({ isOpen, onClose, record, onSubmit }: HrAdjustmentModalProps) {
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(record?.status || 'present');
  const [checkinTime, setCheckinTime] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory reason is required for HR adjustments.');
      return;
    }

    let effCheckin: string | undefined;
    let effCheckout: string | undefined;

    if (checkinTime) {
      effCheckin = `${record.attendanceDate}T${checkinTime}:00.000Z`;
    }
    if (checkoutTime) {
      effCheckout = `${record.attendanceDate}T${checkoutTime}:00.000Z`;
    }

    onSubmit({
      attendanceId: record.id,
      newStatus,
      effectiveCheckinTime: effCheckin,
      effectiveCheckoutTime: effCheckout,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Direct HR Adjustment</h3>
              <p className="text-xs text-slate-500">
                {record.employeeName} ({record.employeeId}) &bull; {record.attendanceDate}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Status */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Adjust Status To
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="present">Present (Full Day)</option>
              <option value="half_day_attendance">Half-Day Attendance</option>
              <option value="absent">Absent</option>
              <option value="leave">Full-Day Leave</option>
              <option value="half_day_leave">Half-Day Leave</option>
            </select>
          </div>

          {/* Correct Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Effective Check-in
              </label>
              <input
                type="time"
                value={checkinTime}
                onChange={(e) => setCheckinTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Effective Check-out
              </label>
              <input
                type="time"
                value={checkoutTime}
                onChange={(e) => setCheckoutTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Mandatory Adjustment Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Device failure at entrance gate verified by security supervisor."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl text-[11px] text-purple-700 dark:text-purple-300 border border-purple-200/50">
            Note: Original selfies, GPS coordinates, and initial timestamps remain preserved in the audit history.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
            >
              Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
