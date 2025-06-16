'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  qrCode: string;
  userName: string;
  userRole: string;
}

export default function QRCodeDisplay({ qrCode, userName, userRole }: QRCodeDisplayProps) {
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [qrCode]);

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const url = await QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataURL(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataURL) return;
    
    const link = document.createElement('a');
    link.download = `${userName.replace(/\s+/g, '_')}_QR_Code.png`;
    link.href = qrDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5 text-blue-600" />
          Your QR Code
        </CardTitle>
        <CardDescription>
          Show this QR code for attendance marking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
            {isLoading ? (
              <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-100 rounded">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <img
                src={qrDataURL}
                alt="QR Code"
                className="w-[300px] h-[300px] object-contain"
              />
            )}
          </div>
          
          <div className="text-center space-y-1">
            <p className="font-semibold text-lg">{userName}</p>
            <p className="text-sm text-gray-600 capitalize">{userRole.replace('-', ' ')}</p>
            <p className="text-xs text-gray-500 font-mono break-all">{qrCode}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={downloadQRCode}
            disabled={!qrDataURL}
            className="flex-1"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={generateQRCode}
            disabled={isLoading}
            variant="outline"
            size="icon"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Keep this QR code safe and show it only to authorized personnel for attendance marking.
        </div>
      </CardContent>
    </Card>
  );
}