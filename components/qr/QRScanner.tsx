'use client';

import { useState, useRef, useCallback } from 'react';
import { QrReader } from 'react-qr-reader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, RefreshCw, Check } from 'lucide-react';
import jsQR from 'jsqr';

interface Props {
  onScanSuccess: (result: string) => void;
  onScanError: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: Props) {
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedQR, setDetectedQR] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = (result: any) => {
    if (result?.text) {
      setDetectedQR(result.text);
    }
  };

  const handleError = (error: any) => {
    onScanError(error?.message || 'Failed to access camera');
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not create canvas context');
        }
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          setUploadedImage(imageUrl);
          setDetectedQR(code.data);
        } else {
          onScanError('No QR code found in image');
          URL.revokeObjectURL(imageUrl);
        }
        setIsProcessing(false);
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setIsProcessing(false);
        onScanError('Failed to load image');
      };

      image.src = imageUrl;
    } catch (error) {
      setIsProcessing(false);
      onScanError('Failed to process image');
    }
  }, [onScanError]);

  const handleMarkAttendance = () => {
    if (detectedQR) {
      onScanSuccess(detectedQR);
      setDetectedQR(null);
      setUploadedImage(null);
    }
  };

  const now = new Date();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between mb-4">
          <Button
            variant={isScanning ? "default" : "outline"}
            onClick={() => {
              setIsScanning(true);
              setUploadedImage(null);
              setDetectedQR(null);
            }}
            disabled={isProcessing}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={!isScanning ? "default" : "outline"}
            onClick={() => {
              setIsScanning(false);
              fileInputRef.current?.click();
            }}
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload QR
          </Button>
        </div>

        <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
          {isScanning ? (
            <QrReader
              onResult={handleScan}
              onError={handleError}
              constraints={{ facingMode: 'environment' }}
              className="w-full h-full"
            />
          ) : uploadedImage ? (
            <img
              src={uploadedImage}
              alt="Uploaded QR"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              {isProcessing ? (
                <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click "Upload QR" to select an image</p>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
          onClick={(e) => (e.currentTarget.value = '')}
        />

        {detectedQR && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="mb-2 text-green-800 font-semibold">QR Code Detected</div>
              <div className="text-xs text-gray-700 break-all">QR: {detectedQR}</div>
              <div className="text-xs text-gray-700 mt-2">
                Date: {now.toLocaleDateString()}<br />
                Time: {now.toLocaleTimeString()}
              </div>
            </div>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleMarkAttendance}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}