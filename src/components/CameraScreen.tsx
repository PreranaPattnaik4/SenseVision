import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, RefreshCw, Sparkles, Volume2 } from 'lucide-react';
import { playChime, speakText } from '../utils/audio';

interface CameraScreenProps {
  onCapture: (base64Image: string) => void;
  isAnalyzing: boolean;
  activeModeLabel: string;
}

export default function CameraScreen({ onCapture, isAnalyzing, activeModeLabel }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Initialize camera
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPreview(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      playChime('click');
      speakText("Camera active. Point your device and trigger the scan.", false);
    } catch (err: any) {
      console.warn("Camera initialization failed:", err);
      setCameraError(
        "Camera stream blocked or unavailable. This is normal inside sandboxed previews. " +
        "Please use the Drag & Drop area below to select or upload any photo."
      );
      speakText("Camera unavailable. You can drag and drop or upload an image to analyze.", false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture frame
  const handleCapture = () => {
    if (isAnalyzing) return;
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Draw mirror-free image for back camera
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPreview(base64Image);
        playChime('scan');
        onCapture(base64Image);
      }
    } else if (capturedPreview) {
      // If camera is not running but we have an uploaded image preview
      playChime('scan');
      onCapture(capturedPreview);
    } else {
      playChime('alert');
      speakText("No visual data available to scan. Please upload a photo first.", false);
    }
  };

  // Keyboard shortcut (Spacebar triggers capture if focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.id === 'scan-trigger-btn') {
        e.preventDefault();
        handleCapture();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stream, capturedPreview, isAnalyzing]);

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      playChime('alert');
      speakText("Error: Only image files are supported.", false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Str = event.target.result as string;
        setCapturedPreview(base64Str);
        // Turn off camera stream when a static photo is loaded
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        playChime('success');
        speakText("Photo loaded. Press Scan to start analysis.", false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearUploadedImage = () => {
    setCapturedPreview(null);
    startCamera();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm" id="camera-viewport-card">
      {/* Top Header Status */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${capturedPreview ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${capturedPreview ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-widest text-slate-800 uppercase">
            {capturedPreview ? "STATIC PHOTO PREVIEW" : "LIVE CAMERA FEED"}
          </span>
        </div>
        <div className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase font-bold">
          {activeModeLabel}
        </div>
      </div>

      {/* Main View Area (Video / Upload Preview / Error Panel) */}
      <div className="relative flex-1 bg-slate-50 flex items-center justify-center min-h-[320px] overflow-hidden">
        
        {/* Real Live Video Stream */}
        {stream && !capturedPreview && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            id="camera-video-stream"
          />
        )}

        {/* Uploaded Static Preview */}
        {capturedPreview && (
          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-2">
            <img 
              src={capturedPreview} 
              alt="Scan Target" 
              className="max-w-full max-h-full object-contain rounded-lg border border-slate-200" 
            />
            <button
              onClick={clearUploadedImage}
              className="absolute top-4 right-4 bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-500 border border-red-500 transition-colors cursor-pointer"
              aria-label="Remove uploaded image and return to live camera"
            >
              Reset Camera
            </button>
          </div>
        )}

        {/* Camera block warning inside iframe */}
        {!stream && !capturedPreview && cameraError && (
          <div className="p-6 text-center max-w-md bg-white/95 backdrop-blur z-10 rounded-xl border border-slate-200 m-4 shadow-md">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Camera Stream Restricted</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">{cameraError}</p>
            <button 
              onClick={startCamera}
              className="inline-flex items-center space-x-2 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 rounded-lg font-medium border border-slate-250 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        )}

        {/* Scanning Pulse effect during analysis */}
        {isAnalyzing && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-pulse" style={{ top: '50%' }}>
            <div className="absolute inset-0 bg-blue-400 blur-sm"></div>
          </div>
        )}
      </div>

      {/* Dynamic Interaction Overlay (Drag & Drop Field) */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-t border-slate-200 p-4 transition-colors cursor-pointer text-center ${
          isDragOver ? 'bg-blue-50 border-blue-500/50' : 'bg-slate-50 hover:bg-slate-100'
        }`}
        aria-label="Upload source file drag or click selector"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="image/*" 
          className="hidden" 
        />
        <div className="flex flex-col items-center justify-center space-y-1">
          <Upload className={`w-5 h-5 ${isDragOver ? 'text-blue-600 animate-bounce' : 'text-slate-400'}`} />
          <p className="text-xs text-slate-600">
            <span className="font-bold text-blue-600">Drag & Drop</span> any photo here, or <span className="font-bold underline text-blue-600">browse files</span>
          </p>
          <p className="text-[10px] text-slate-400 font-mono">SUPPORTS JPEG, PNG, WEBP • MAX 15MB</p>
        </div>
      </div>

      {/* Huge Accessible Capture Control Bar */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Instructions</p>
          <p className="text-xs text-slate-600 font-medium leading-normal max-w-sm">
            Press the main trigger button to analyze. Turn on your audio speakers to receive step-by-step guidance.
          </p>
        </div>

        <button
          id="scan-trigger-btn"
          disabled={isAnalyzing || (!stream && !capturedPreview)}
          onClick={handleCapture}
          className={`w-full sm:w-auto min-h-[52px] px-8 rounded-xl font-bold uppercase tracking-wider text-xs inline-flex items-center justify-center space-x-3 transition-all transform active:scale-95 cursor-pointer ${
            isAnalyzing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
              : (!stream && !capturedPreview)
                ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md focus:ring-4 focus:ring-blue-500/50 outline-none border border-blue-600 font-black'
          }`}
          aria-label={`Trigger Visual Scan for ${activeModeLabel}. Keyboard shortcut: Spacebar when focused.`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              <span>Analyzing visual field...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold">TRIGGER VOICE SCAN</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden processing helper canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
