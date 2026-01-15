import React, { useState, useEffect, useRef } from 'react';
import { Camera, Settings, Shield, AlertTriangle, CheckCircle, XCircle, Key } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner() {
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scannerIdRef = useRef('qr-reader');

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Stop error:', err));
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setResult(null);

      const html5QrCode = new Html5Qrcode(scannerIdRef.current);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText, decodedResult) => {
          console.log('QR Code detected:', decodedText);
          stopScanning();
          checkURL(decodedText);
        },
        (errorMessage) => {
          // This fires continuously while scanning, so we don't log it
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available. Please check permissions.');
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const checkURL = async (url) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Checking URL:', url);
      
      // Submit the URL to VirusTotal
      const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${encodeURIComponent(url)}`
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        console.error('VirusTotal API error:', errorData);
        throw new Error('Invalid API key or request failed. Check your API key.');
      }

      const submitData = await submitResponse.json();
      const analysisId = submitData.data.id;
      console.log('Analysis ID:', analysisId);

      // Wait for analysis to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get the analysis results
      const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: {
          'x-apikey': apiKey
        }
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to retrieve analysis results');
      }

      const analysisData = await analysisResponse.json();
      const stats = analysisData.data.attributes.stats;

      setResult({
        url,
        malicious: stats.malicious || 0,
        suspicious: stats.suspicious || 0,
        harmless: stats.harmless || 0,
        undetected: stats.undetected || 0,
        total: (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0)
      });
    } catch (err) {
      console.error('Check URL error:', err);
      setError(err.message || 'Failed to check URL. Please verify your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    setError('');
  };

  const getStatusIcon = () => {
    if (!result) return null;
    if (result.malicious > 0) return <XCircle className="w-16 h-16 text-red-500" />;
    if (result.suspicious > 0) return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
    return <CheckCircle className="w-16 h-16 text-green-500" />;
  };

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <Key className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">VirusTotal API Key</h2>
            <p className="text-gray-600 text-center mb-6">
              Enter your VirusTotal API key to start scanning QR codes
            </p>
            
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API Key"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-indigo-500"
            />
            
            <button
              onClick={() => {
                if (apiKey.trim()) {
                  setShowSettings(false);
                }
              }}
              disabled={!apiKey.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Save & Continue
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Don't have an API key?</strong><br />
                Get a free API key at{' '}
                <a href="https://www.virustotal.com/gui/join-us" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                  virustotal.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">QR Scanner</h1>
          </div>
          <button
            onClick={() => {
              stopScanning();
              setShowSettings(true);
            }}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {!scanning && !result && !loading && (
            <div className="p-12 text-center">
              <Camera className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
              <p className="text-gray-600 mb-8">
                Point your camera at a QR code to check if the link is safe
              </p>
              <button
                onClick={startScanning}
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition text-lg"
              >
                Start Scanning
              </button>
            </div>
          )}

          {scanning && (
            <div className="relative">
              <div id={scannerIdRef.current} className="w-full"></div>
              <button
                onClick={stopScanning}
                className="mt-4 mb-4 mx-auto block bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition shadow-lg"
              >
                Cancel Scan
              </button>
            </div>
          )}

          {loading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Checking URL with VirusTotal...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          )}

          {result && (
            <div className="p-8">
              <div className="text-center mb-6">
                {getStatusIcon()}
                <h2 className="text-2xl font-bold mt-4 mb-2">
                  {result.malicious > 0 ? 'Danger Detected!' : result.suspicious > 0 ? 'Suspicious Link' : 'Safe to Visit'}
                </h2>
                <p className="text-gray-600">
                  {result.malicious > 0 
                    ? 'This URL has been flagged as malicious by security vendors'
                    : result.suspicious > 0 
                    ? 'This URL has some suspicious characteristics'
                    : 'No security threats detected'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Scanned URL:</p>
                <p className="text-sm font-mono break-all text-gray-800">{result.url}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 border-2 border-red-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Malicious</p>
                  <p className="text-3xl font-bold text-red-600">{result.malicious}</p>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Suspicious</p>
                  <p className="text-3xl font-bold text-yellow-600">{result.suspicious}</p>
                </div>
                <div className="bg-green-50 border-2 border-green-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Harmless</p>
                  <p className="text-3xl font-bold text-green-600">{result.harmless}</p>
                </div>
                <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Undetected</p>
                  <p className="text-3xl font-bold text-gray-600">{result.undetected}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center mb-4">
                Scanned by {result.total} security vendors
              </p>

              <button
                onClick={handleScanAgain}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Scan Another QR Code
              </button>
            </div>
          )}

          {error && (
            <div className="p-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-semibold mb-1">Error</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleScanAgain}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}