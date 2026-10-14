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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">
                {isForgottenCheckout ? 'Forgotten Check-out Fix' : 'Attendance Correction'}
              </h3>
              <p className="text-xs text-slate-400">Record Date: {record.attendanceDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Values Info */}
          <div className="p-3.5 bg-slate-950/70 rounded-2xl text-xs space-y-2 border border-slate-800/80">
            <div className="flex justify-between text-slate-400">
              <span>Original Check-in:</span>
              <span className="font-mono font-bold text-white">{formatTime(record.effectiveCheckinTime || record.checkinTime) || '--:--'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Original Check-out:</span>
              <span className="font-mono font-bold text-white">{formatTime(record.effectiveCheckoutTime || record.checkoutTime) || '--:--'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Original Status:</span>
              <span className="font-bold text-indigo-300 uppercase">{record.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Correction Type */}
          {!isForgottenCheckout && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Correction Field
              </label>
              <select
                value={correctionType}
                onChange={(e) => setCorrectionType(e.target.value as CorrectionType)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Requested Time (HH:MM) <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                required
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          )}

          {/* Status Picker */}
          {correctionType === 'status' && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Requested Status <span className="text-rose-400">*</span>
              </label>
              <select
                value={requestedStatus}
                onChange={(e) => setRequestedStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="present">Present (On-Time)</option>
                <option value="half_day_attendance">Half-Day Attendance</option>
                <option value="leave">Leave</option>
              </select>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Mandatory Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this correction is needed..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
            ℹ️ Attendance correction requests require review and approval by HR/Manager before taking effect.
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
