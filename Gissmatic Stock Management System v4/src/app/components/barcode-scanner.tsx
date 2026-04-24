import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Keyboard, X, ScanLine, Zap } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetect: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onDetect }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const detectedRef = useRef(false);

  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [scanLine, setScanLine] = useState(15);
  const [scanDir, setScanDir] = useState(1);
  const [isDetecting, setIsDetecting] = useState(false);

  const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    detectedRef.current = false;
  }, []);

  const handleDetected = useCallback((barcode: string) => {
    if (detectedRef.current) return;
    detectedRef.current = true;
    stopCamera();
    onDetect(barcode);
    onClose();
    toast.success(`Barcode scanned: ${barcode}`);
  }, [stopCamera, onDetect, onClose]);

  const scanLoop = useCallback(async () => {
    if (detectedRef.current || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    try {
      if (hasBarcodeDetector) {
        setIsDetecting(true);
        const detector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e", "data_matrix"],
        });
        const results = await detector.detect(canvas);
        if (results.length > 0) {
          handleDetected(results[0].rawValue);
          return;
        }
        setIsDetecting(false);
      }
    } catch {
      setIsDetecting(false);
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [hasBarcodeDetector, handleDetected]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    detectedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        rafRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError" ? "Camera access denied — please allow camera permission" :
        err.name === "NotFoundError" ? "No camera found on this device" :
        "Camera unavailable — try manual entry";
      setCameraError(msg);
      setMode("manual");
    }
  }, [scanLoop]);

  // Animate scan line
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => {
      setScanLine((prev) => {
        const next = prev + scanDir * 1.5;
        if (next >= 82) { setScanDir(-1); return 82; }
        if (next <= 15) { setScanDir(1); return 15; }
        return next;
      });
    }, 16);
    return () => clearInterval(id);
  }, [isStreaming, scanDir]);

  useEffect(() => {
    if (isOpen && mode === "camera") startCamera();
    if (!isOpen) { stopCamera(); setManualInput(""); setCameraError(""); setIsDetecting(false); }
    return () => stopCamera();
  }, [isOpen, mode]);

  const handleManualSubmit = () => {
    if (!manualInput.trim()) { toast.error("Please enter a barcode number"); return; }
    handleDetected(manualInput.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopCamera(); onClose(); } }}>
      <DialogContent className="max-w-sm p-0 rounded-2xl overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-[#0a1565] px-5 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-xl bg-[#16c60c]/20 border border-[#16c60c]/40 flex items-center justify-center">
                <ScanLine className="w-4 h-4 text-[#16c60c]" />
              </div>
              Scan Barcode
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {mode === "camera" ? "Point camera at barcode to auto-detect" : "Enter barcode number manually"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Mode tabs */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode("camera"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === "camera" ? "bg-[#0a1565] text-white shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
            >
              <Camera className="w-4 h-4" />Camera
            </button>
            <button
              onClick={() => { stopCamera(); setMode("manual"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === "manual" ? "bg-[#0a1565] text-white shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
            >
              <Keyboard className="w-4 h-4" />Manual
            </button>
          </div>
        </div>

        {mode === "camera" && (
          <div className="px-4 pb-2">
            <div className="relative rounded-xl overflow-hidden bg-[#070e42] aspect-[4/3]">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scan frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-28">
                  {/* Corner brackets */}
                  {[
                    "top-0 left-0 border-t-2 border-l-2",
                    "top-0 right-0 border-t-2 border-r-2",
                    "bottom-0 left-0 border-b-2 border-l-2",
                    "bottom-0 right-0 border-b-2 border-r-2",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-5 h-5 border-[#16c60c] ${cls}`} />
                  ))}
                  {/* Scan line */}
                  {isStreaming && (
                    <div
                      className="absolute left-1 right-1 h-0.5 transition-none"
                      style={{
                        top: `${scanLine}%`,
                        background: "linear-gradient(90deg, transparent, #16c60c, transparent)",
                        boxShadow: "0 0 8px 2px rgba(22,198,12,0.5)",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Status overlays */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070e42]/95 text-center px-5 gap-3">
                  <Camera className="w-10 h-10 text-slate-500" />
                  <p className="text-white text-sm">{cameraError}</p>
                  <button onClick={() => { setCameraError(""); stopCamera(); setMode("manual"); }} className="text-[#16c60c] text-sm underline">
                    Use manual entry
                  </button>
                </div>
              )}
              {!isStreaming && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#070e42]/80">
                  <div className="w-8 h-8 border-2 border-[#16c60c] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {isDetecting && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-[#16c60c]/90 text-[#070e42] text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Zap className="w-3 h-3" /> Detecting…
                </div>
              )}
            </div>

            {!hasBarcodeDetector && isStreaming && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                <span className="text-amber-500 text-sm mt-0.5">⚠</span>
                <p className="text-amber-700 text-xs">Auto-detect not supported in this browser. Use Chrome/Edge or switch to Manual mode.</p>
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="px-4 pb-2">
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Enter the barcode or SKU printed on the product:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 4901234567894"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  className="rounded-xl flex-1 font-mono"
                  autoFocus
                />
                <Button
                  onClick={handleManualSubmit}
                  className="rounded-xl bg-[#0d9904] hover:bg-[#0b8203] text-white shrink-0"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-4">
          <Button variant="outline" onClick={() => { stopCamera(); onClose(); }} className="w-full rounded-xl">
            <X className="w-4 h-4 mr-2" />Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
