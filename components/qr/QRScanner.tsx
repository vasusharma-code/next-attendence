'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Type for the QR scanner library
declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

interface QRScannerProps {
  onScanSuccess: (qrCode: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [lastScan, setLastScan] = useState<string>('');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      
      // Check for camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setIsScanning(true);

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startDetection();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasPermission(false);
      setError('Camera access denied. Please enable camera permissions and try again.');
      onScanError?.('Camera access denied');
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Check if BarcodeDetector is supported
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['qr_code']
        });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && canvasRef.current && isScanning) {
            try {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              const context = canvas.getContext('2d');

              if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const barcodes = await barcodeDetector.detect(canvas);
                
                if (barcodes.length > 0) {
                  const qrCode = barcodes[0].rawValue;
                  if (qrCode && qrCode !== lastScan) {
                    setLastScan(qrCode);
                    handleQRCodeDetected(qrCode);
                  }
                }
              }
            } catch (err) {
              console.error('Detection error:', err);
            }
          }
        }, 500); // Scan every 500ms
      } catch (err) {
        console.error('BarcodeDetector error:', err);
        setError('QR code detection not supported on this device');
        fallbackToManualInput();
      }
    } else {
      setError('QR code detection not supported on this browser');
      fallbackToManualInput();
    }
  };

  const fallbackToManualInput = () => {
    toast.info('Camera scanning not available. Please use manual QR code input.');
  };

  const handleQRCodeDetected = (qrCode: string) => {
    toast.success('QR Code detected!');
    onScanSuccess(qrCode);
    stopScanning();
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="h-5 w-5 text-blue-600" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Point your camera at a QR code to scan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div className="absolute inset-0 border-2 border-dashed border-white/50 m-8 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-sm font-medium">Align QR code within frame</div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Camera not active</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="outline" className="flex-1">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          )}
        </div>

        {hasPermission === false && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera permission is required for QR code scanning. Please enable camera access in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {lastScan && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Last scanned: <code className="text-xs">{lastScan}</code>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}