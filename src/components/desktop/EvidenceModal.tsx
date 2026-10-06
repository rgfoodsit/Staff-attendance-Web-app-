'use client';

import React from 'react';
import { ShieldCheck, MapPin, Clock, X, ExternalLink, Calendar } from 'lucide-react';
import { AttendanceRecord } from '@/types';
import { formatTime, formatDate, formatDuration } from '@/lib/utils';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
}

export function EvidenceModal({ isOpen, onClose, record }: EvidenceModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                  {record.employeeName}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                  {record.employeeId}
                </span>
                {record.isHrAdjusted && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full">
                    HR Adjusted
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {record.departmentName} &bull; {record.designationTitle} &bull; {formatDate(record.attendanceDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 block">Status</span>
              <span className="text-xs font-bold uppercase text-slate-900 dark:text-white">
                {record.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 block">Check-in</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {formatTime(record.effectiveCheckinTime || record.checkinTime)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 block">Check-out</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {formatTime(record.effectiveCheckoutTime || record.checkoutTime)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 block">Duration</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {formatDuration(record.workingDurationMinutes)}
              </span>
            </div>
          </div>

          {/* Evidence Grid: Check-in vs Check-out (PRD Section 42) */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Check-in Evidence */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Check-in Evidence
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(record.checkinTime)}
                </span>
              </div>

              {record.checkinSelfieUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <img
                      src={record.checkinSelfieUrl}
                      alt="Check-in Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        {record.checkinLocationName || 'Location not recorded'}
                      </span>
                    </div>

                    {record.checkinLatitude && record.checkinLongitude && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>GPS: {record.checkinLatitude.toFixed(6)}, {record.checkinLongitude.toFixed(6)}</span>
                        <a
                          href={`https://www.google.com/maps?q=${record.checkinLatitude},${record.checkinLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                        >
                          <span>Open Map</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No check-in selfie captured
                </div>
              )}
            </div>

            {/* Check-out Evidence */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Check-out Evidence
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(record.checkoutTime)}
                </span>
              </div>

              {record.checkoutSelfieUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <img
                      src={record.checkoutSelfieUrl}
                      alt="Check-out Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        {record.checkoutLocationName || 'Location not recorded'}
                      </span>
                    </div>

                    {record.checkoutLatitude && record.checkoutLongitude && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>GPS: {record.checkoutLatitude.toFixed(6)}, {record.checkoutLongitude.toFixed(6)}</span>
                        <a
                          href={`https://www.google.com/maps?q=${record.checkoutLatitude},${record.checkoutLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                        >
                          <span>Open Map</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1">
                  <span>No check-out selfie captured yet</span>
                  {(record.status === 'checkout_pending' || record.status === 'forgotten_checkout') && (
                    <span className="text-amber-500 font-medium text-[11px]">Forgot to check-out (Missed)</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* HR Adjustment Note if present */}
          {record.isHrAdjusted && (
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-purple-900 dark:text-purple-300">
                HR Adjustment Reason:
              </span>
              <p className="text-purple-800 dark:text-purple-200">{record.hrAdjustmentReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
