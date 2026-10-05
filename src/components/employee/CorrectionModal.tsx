'use client';

import React, { useState } from 'react';
import { FileEdit, X, AlertCircle } from 'lucide-react';
import { AttendanceRecord, CorrectionType, AttendanceStatus } from '@/types';
import { formatTime } from '@/lib/utils';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord;
  onSubmit: (data: {
    attendanceId: string;
    correctionType: CorrectionType;
    requestedCheckinTime?: string;
    requestedCheckoutTime?: string;
    requestedStatus?: AttendanceStatus;
    reason: string;
  }) => void;
}

export function CorrectionModal({ isOpen, onClose, record, onSubmit }: CorrectionModalProps) {
  const isForgottenCheckout = record.status === 'checkout_pending';
  const [correctionType, setCorrectionType] = useState<CorrectionType>(
    isForgottenCheckout ? 'forgotten_checkout' : 'checkin_time'
  );
  const [requestedTime, setRequestedTime] = useState('');
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('present');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory reason is required for correction requests.');
      return;
    }

    let checkinTime: string | undefined;
    let checkoutTime: string | undefined;

    if (correctionType === 'checkin_time' && requestedTime) {
      checkinTime = `${record.attendanceDate}T${requestedTime}:00.000Z`;
    } else if ((correctionType === 'checkout_time' || correctionType === 'forgotten_checkout') && requestedTime) {
      checkoutTime = `${record.attendanceDate}T${requestedTime}:00.000Z`;
    }

    onSubmit({
      attendanceId: record.id,
      correctionType,
      requestedCheckinTime: checkinTime,
      requestedCheckoutTime: checkoutTime,
      requestedStatus: correctionType === 'status' ? requestedStatus : undefined,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {isForgottenCheckout ? 'Forgotten Check-out Correction' : 'Submit Attendance Correction'}
              </h3>
              <p className="text-xs text-slate-500">Record Date: {record.attendanceDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Values Info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Original Check-in:</span>
              <span className="font-medium">{formatTime(record.effectiveCheckinTime || record.checkinTime)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Original Check-out:</span>
              <span className="font-medium">{formatTime(record.effectiveCheckoutTime || record.checkoutTime)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Status:</span>
              <span className="font-medium uppercase">{record.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Correction Type */}
          {!isForgottenCheckout && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Correction Field
              </label>
              <select
                value={correctionType}
                onChange={(e) => setCorrectionType(e.target.value as CorrectionType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="checkin_time">Adjust Check-in Time</option>
                <option value="checkout_time">Adjust Check-out Time</option>
                <option value="status">Adjust Status</option>
              </select>
            </div>
          )}

          {/* Time Picker */}
          {(correctionType === 'checkin_time' || correctionType === 'checkout_time' || correctionType === 'forgotten_checkout') && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Requested Time (HH:MM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Status Picker */}
          {correctionType === 'status' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Requested Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={requestedStatus}
                onChange={(e) => setRequestedStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="present">Present (On-Time)</option>
                <option value="half_day_attendance">Half-Day Attendance</option>
                <option value="leave">Leave</option>
              </select>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Mandatory Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this correction is needed..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Attendance correction requests require approval by HR.
          </p>

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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
