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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">Mark Today's Leave</h3>
              <p className="text-xs text-slate-400">Current calendar day only</p>
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

          {/* Leave Type Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
              Leave Duration
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setIsHalfDay(false)}
                className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  !isHalfDay
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Full-Day Leave
              </button>
              <button
                type="button"
                onClick={() => setIsHalfDay(true)}
                className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  isHalfDay
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Half-Day Leave
              </button>
            </div>
          </div>

          {/* Half Day Type */}
          {isHalfDay && (
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Select Half
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${halfType === 'first_half' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <input
                    type="radio"
                    name="halfType"
                    value="first_half"
                    checked={halfType === 'first_half'}
                    onChange={() => setHalfType('first_half')}
                    className="accent-amber-500"
                  />
                  <span className="font-semibold">First Half</span>
                </label>
                <label className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${halfType === 'second_half' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  <input
                    type="radio"
                    name="halfType"
                    value="second_half"
                    checked={halfType === 'second_half'}
                    onChange={() => setHalfType('second_half')}
                    className="accent-amber-500"
                  />
                  <span className="font-semibold">Second Half</span>
                </label>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Reason <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical emergency, Family matter"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-white placeholder-slate-500"
            />
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            {isHalfDay
              ? '💡 Half-Day Leave permits Check-in / Check-out for the remaining working portion of the day.'
              : '⚠️ Full-Day Leave will disable Check-in and Check-out actions for today.'}
          </p>

          {/* Submit */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/25 transition active:scale-95 cursor-pointer"
            >
              Submit Leave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
