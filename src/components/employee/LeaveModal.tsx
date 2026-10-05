'use client';

import React, { useState } from 'react';
import { Calendar, X, AlertCircle } from 'lucide-react';
import { LeaveHalfType } from '@/types';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    isHalfDay: boolean;
    halfType?: LeaveHalfType;
    reason: string;
    comment?: string;
  }) => void;
}

export function LeaveModal({ isOpen, onClose, onSubmit }: LeaveModalProps) {
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfType, setHalfType] = useState<LeaveHalfType>('first_half');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason is mandatory for marking leave.');
      return;
    }
    setError(null);
    onSubmit({
      isHalfDay,
      halfType: isHalfDay ? halfType : undefined,
      reason: reason.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Mark Today's Leave</h3>
              <p className="text-xs text-slate-500">Current calendar day only</p>
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

          {/* Leave Type Toggle */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Leave Duration
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setIsHalfDay(false)}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  !isHalfDay
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Full-Day Leave
              </button>
              <button
                type="button"
                onClick={() => setIsHalfDay(true)}
                className={`py-2 text-xs font-medium rounded-lg transition ${
                  isHalfDay
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Half-Day Leave
              </button>
            </div>
          </div>

          {/* Half Day Type */}
          {isHalfDay && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Select Half
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="halfType"
                    value="first_half"
                    checked={halfType === 'first_half'}
                    onChange={() => setHalfType('first_half')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>First Half</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="halfType"
                    value="second_half"
                    checked={halfType === 'second_half'}
                    onChange={() => setHalfType('second_half')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Second Half</span>
                </label>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical emergency, Family matter"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>


          {/* Disclaimer */}
          <p className="text-[11px] text-slate-500">
            {isHalfDay
              ? 'Half-Day Leave permits Check-in / Check-out for the remaining working portion of the day.'
              : 'Full-Day Leave will disable Check-in and Check-out actions for today.'}
          </p>

          {/* Submit */}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
            >
              Submit Leave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
