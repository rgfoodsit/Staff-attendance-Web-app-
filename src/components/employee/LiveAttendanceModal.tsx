'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, AlertTriangle, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface LiveAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'checkin' | 'checkout';
  onConfirm: (data: {
    selfieUrl: string;
    latitude: number;
    longitude: number;
    locationName: string;
  }) => void;
}

export function LiveAttendanceModal({
  isOpen,
  onClose,
  type,
  onConfirm,
}: LiveAttendanceModalProps) {
  const [step, setStep] = useState<'capture' | 'review'>('capture');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Detecting location...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera and geolocation when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('capture');
      setErrorMsg(null);
      setSelfieDataUrl(null);
      startCamera();
      fetchLocation();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const isPermissionDenied = err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setErrorMsg(
        isPermissionDenied
          ? 'Camera permission denied. Please enable camera access in your browser settings to record attendance.'
          : 'Unable to access device camera. Please make sure no other app is using it.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const setCoordinatesAndReverseGeocode = async (latitude: number, longitude: number, labelPrefix = '') => {
    setCoords({ latitude, longitude });
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 1. Try Google Maps Geocoding API if key is available
    if (apiKey) {
      try {
        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
        );
        const googleData = await googleRes.json();
        if (googleData.status === 'OK' && googleData.results && googleData.results[0]) {
          const detectedName = googleData.results[0].formatted_address;
          setLocationName(labelPrefix ? `${labelPrefix} - ${detectedName}` : detectedName);
          setIsLocating(false);
          return;
        } else {
          console.warn('Google Maps Geocoding API status:', googleData.status, googleData.error_message);
        }
      } catch (googleErr) {
        console.warn('Google Maps Geocoding fetch notice:', googleErr);
      }
    }

    // 2. Fallback to OpenStreetMap Reverse Geocoding
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'StaffAttendanceApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const detectedName = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setLocationName(labelPrefix ? `${labelPrefix} - ${detectedName}` : detectedName);
      } else {
        setLocationName(`${labelPrefix || 'Office Location'} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      }
    } catch {
      setLocationName(`${labelPrefix || 'Marked Location'} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    } finally {
      setIsLocating(false);
    }
  };

  const applyFallbackCoordinates = () => {
    setErrorMsg(null);
    setIsLocating(true);
    // Standard Office Headquarters coordinates (San Francisco Financial District)
    const fallbackLat = 37.7749;
    const fallbackLon = -122.4194;
    setCoordinatesAndReverseGeocode(fallbackLat, fallbackLon, 'Office HQ (Simulated GPS)');
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      applyFallbackCoordinates();
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    const handleSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setCoordinatesAndReverseGeocode(latitude, longitude);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('Geolocation error code:', err.code, 'message:', err.message);

      // Attempt low accuracy fallback if high accuracy timed out or failed
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (fallbackErr) => {
          console.warn('Fallback geolocation error:', fallbackErr.code, fallbackErr.message);
          setIsLocating(false);

          let errorText = 'Location access is required for attendance evidence.';
          if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
            errorText = 'Location permission was denied. Please allow location access in your browser address bar.';
          } else if (fallbackErr.code === fallbackErr.POSITION_UNAVAILABLE) {
            errorText = 'GPS position is unavailable on this device/network.';
          } else if (fallbackErr.code === fallbackErr.TIMEOUT) {
            errorText = 'GPS request timed out. Please retry or use office coordinates.';
          }

          setErrorMsg(errorText);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    };

    // First attempt with high accuracy
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !coords) {
      if (!coords) setErrorMsg('Waiting for GPS lock before capturing selfie...');
      return;
    }

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror image horizontally for natural selfie perspective
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setSelfieDataUrl(dataUrl);
      stopCamera();
      setStep('review');
    }
    setIsCapturing(false);
  };

  const retake = () => {
    setSelfieDataUrl(null);
    setStep('capture');
    startCamera();
  };

  const handleFinalConfirm = () => {
    if (!selfieDataUrl || !coords) return;
    onConfirm({
      selfieUrl: selfieDataUrl,
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationName: locationName,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${type === 'checkin' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                {type === 'checkin' ? 'Check-in Verification' : 'Check-out Verification'}
              </h3>
              <p className="text-xs text-slate-500">Live Selfie & GPS Evidence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-semibold">Location / GPS Notice</p>
                <p className="text-[11px] opacity-90 leading-relaxed">{errorMsg}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      startCamera();
                      fetchLocation();
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 rounded-lg transition"
                  >
                    Retry GPS Access
                  </button>
                  <button
                    type="button"
                    onClick={applyFallbackCoordinates}
                    className="px-2.5 py-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200/80 rounded-lg transition"
                  >
                    Use Office Coordinates (Demo / Desktop)
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'capture' ? (
            <div className="space-y-4">
              {/* Camera Preview */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Face Alignment Overlay Frame */}
                <div className="absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-full pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Position Face Inside
                  </span>
                </div>

                {/* Scan line effect */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-75 animate-scan-line pointer-events-none" />
              </div>

              {/* Location Status Pill */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                <MapPin className={`w-4 h-4 flex-shrink-0 ${coords ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
                <div className="flex-1 truncate">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {coords ? 'GPS Locked' : 'Locating GPS...'}
                  </span>
                  <p className="truncate text-[11px] text-slate-500">{locationName}</p>
                </div>
              </div>

              {/* Capture Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={isCapturing || !coords}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <Camera className="w-5 h-5" />
                <span>Capture Live Selfie</span>
              </button>
            </div>
          ) : (
            /* Review Step (PRD Rule #18) */
            <div className="space-y-4 animate-in fade-in-50">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-medium rounded-full mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ready for Confirmation
                </span>
                <p className="text-xs text-slate-500">Please review attendance evidence before submitting</p>
              </div>

              {/* Selfie Preview */}
              <div className="relative aspect-square w-full max-w-[240px] mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md">
                {selfieDataUrl && (
                  <img
                    src={selfieDataUrl}
                    alt="Captured Selfie"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Evidence Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 space-y-2.5 text-xs border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500">Attendance Time:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500 flex-shrink-0">Readable Location:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100 text-right text-[11px] leading-relaxed">
                    {locationName}
                  </span>
                </div>
                {coords && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>GPS Coordinates:</span>
                    <span>{coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={retake}
                  className="py-3 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake Selfie</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Submit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
