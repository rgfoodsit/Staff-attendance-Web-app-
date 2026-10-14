'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, AlertTriangle, RefreshCw, X, ShieldCheck, ExternalLink } from 'lucide-react';

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
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Detecting GPS location...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchIdRef = useRef<number | null>(null);

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
      stopLocationTracking();
    }
    return () => {
      stopCamera();
      stopLocationTracking();
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

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const setCoordinatesAndReverseGeocode = async (latitude: number, longitude: number, accuracy?: number) => {
    setCoords({ latitude, longitude, accuracy });
    setIsLocating(false);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 1. Try Google Maps Geocoding API if key is available
    if (apiKey) {
      try {
        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
        );
        const googleData = await googleRes.json();
        if (googleData.status === 'OK' && googleData.results && googleData.results[0]) {
          setLocationName(googleData.results[0].formatted_address);
          return;
        }
      } catch (googleErr) {
        console.warn('Google Maps Geocoding fetch notice:', googleErr);
      }
    }

    // 2. Try BigDataCloud Client Reverse Geocode (free, client-side, CORS friendly)
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const parts = [
          bdcData.locality || bdcData.city,
          bdcData.principalSubdivision,
          bdcData.countryName,
        ].filter(Boolean);
        if (parts.length > 0) {
          setLocationName(parts.join(', '));
          return;
        }
      }
    } catch (bdcErr) {
      console.warn('BigDataCloud reverse geocode notice:', bdcErr);
    }

    // 3. Fallback to OpenStreetMap Reverse Geocoding
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'StaffAttendanceApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setLocationName(data.display_name);
          return;
        }
      }
    } catch {
      // ignore
    }

    // 4. Default clean fallback showing exact coordinates
    setLocationName(`GPS Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
  };

  const fetchLocation = () => {
    stopLocationTracking();

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setErrorMsg('Geolocation requires a secure connection (HTTPS) or localhost. Please ensure you are opening the site via HTTPS.');
      setIsLocating(false);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    let hasReceivedPosition = false;

    const handleSuccess = (pos: GeolocationPosition) => {
      hasReceivedPosition = true;
      setErrorMsg(null);
      const { latitude, longitude, accuracy } = pos.coords;
      setCoordinatesAndReverseGeocode(latitude, longitude, accuracy);
    };

    const handleInitialError = (err: GeolocationPositionError) => {
      if (hasReceivedPosition) return;
      console.warn('Geolocation fast fix notice:', err.code, err.message);
    };

    const handleWatchError = (err: GeolocationPositionError) => {
      if (hasReceivedPosition) return;
      console.warn('Geolocation watch error:', err.code, err.message);
      setIsLocating(false);

      let errorText = 'Unable to acquire GPS location.';
      if (err.code === err.PERMISSION_DENIED) {
        errorText = 'Location permission was denied. Tap the lock/tune icon in your browser address bar to allow location access, then tap "Retry GPS Access".';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        errorText = 'GPS signal is unavailable. Please ensure Location/GPS is turned ON in your phone settings and try again.';
      } else if (err.code === err.TIMEOUT) {
        errorText = 'GPS signal acquisition timed out. Please ensure your device Location/GPS is enabled and tap "Retry GPS Access".';
      }

      setErrorMsg(errorText);
    };

    // Stage 1: Immediate Fast Coarse / Cached Fix (low latency, allows immediate check-in on phones)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleInitialError,
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );

    // Stage 2: High Accuracy Continuous Watch (refines satellite fix in background)
    try {
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleWatchError,
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      );
      watchIdRef.current = watchId;
    } catch (watchErr) {
      console.warn('Failed to start watchPosition:', watchErr);
    }
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
      stopLocationTracking();
      setStep('review');
    }
    setIsCapturing(false);
  };

  const retake = () => {
    setSelfieDataUrl(null);
    setStep('capture');
    startCamera();
    fetchLocation();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] backdrop-blur-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${type === 'checkin' ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30' : 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'}`}>
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base capitalize tracking-tight">
                {type === 'checkin' ? 'Check-in Biometric' : 'Check-out Biometric'}
              </h3>
              <p className="text-xs text-slate-400">Live Face & GPS Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {errorMsg && (
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-1.5 flex-1">
                <p className="font-bold text-amber-200">GPS Location Notice</p>
                <p className="text-[11px] opacity-90 leading-relaxed">{errorMsg}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      fetchLocation();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    Retry GPS Access
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'capture' ? (
            <div className="space-y-4">
              {/* Camera Preview with Biometric Frame & Reticles */}
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Reticle Corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-400 rounded-br-lg pointer-events-none" />

                {/* Face Alignment Overlay Frame */}
                <div className="absolute inset-10 border-2 border-dashed border-indigo-400/50 rounded-full pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 tracking-wide">
                    Align Face Here
                  </span>
                </div>

                {/* Scan line effect */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80 animate-scan-line pointer-events-none shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
              </div>

              {/* Location Status Pill */}
              <div className="p-3.5 bg-slate-950/70 rounded-2xl flex items-center gap-3 text-xs border border-slate-800/80 shadow-md">
                <div className={`p-2 rounded-xl shrink-0 ${coords ? 'bg-emerald-500/15 text-emerald-400' : isLocating ? 'bg-amber-500/15 text-amber-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      {coords
                        ? coords.accuracy && coords.accuracy <= 30
                          ? 'GPS Locked (High Precision)'
                          : 'GPS Locked'
                        : isLocating
                        ? 'Acquiring GPS Signal...'
                        : 'GPS Waiting'}
                    </span>
                    {coords?.accuracy && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono border border-emerald-500/30">
                        &plusmn;{Math.round(coords.accuracy)}m
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-slate-400 mt-0.5">{locationName}</p>
                </div>
                <button
                  type="button"
                  title="Refresh GPS"
                  onClick={fetchLocation}
                  disabled={isLocating}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Shutter Capture Button (Camera Style) */}
              <div className="pt-2 text-center space-y-2">
                <button
                  type="button"
                  onClick={takeSnapshot}
                  disabled={isCapturing || !coords}
                  className="mx-auto flex flex-col items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/40 p-1 group-hover:border-indigo-400 transition-all flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 group-hover:scale-95 group-active:scale-90 transition-all shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-300 tracking-tight group-hover:text-indigo-200">
                    Tap to Capture Selfie
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Review Step (PRD Rule #18) */
            <div className="space-y-4 animate-in fade-in-50">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Evidence Verified
                </span>
                <p className="text-xs text-slate-400">Review your live capture before final confirmation</p>
              </div>

              {/* Selfie Preview with badge */}
              <div className="relative aspect-square w-full max-w-[220px] mx-auto rounded-3xl overflow-hidden border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/10">
                {selfieDataUrl && (
                  <img
                    src={selfieDataUrl}
                    alt="Captured Selfie"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 inset-x-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-center border border-white/10 text-[10px] text-white/90 font-mono">
                  Live Camera Stamp
                </div>
              </div>

              {/* Evidence Summary Card */}
              <div className="bg-slate-950/70 rounded-2xl p-4 space-y-2.5 text-xs border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Recorded Time:</span>
                  <span className="font-bold text-white font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-400 shrink-0">Location:</span>
                  <span className="font-medium text-slate-200 text-right text-[11px] leading-relaxed">
                    {locationName}
                  </span>
                </div>
                {coords && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Coordinates:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-300">{coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</span>
                      <a
                        href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                      >
                        <span>Map</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={retake}
                  className="py-3.5 px-3 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake Selfie</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="py-3.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
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

