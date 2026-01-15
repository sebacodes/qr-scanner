import React, { useState, useRef, useEffect } from 'react';
import { Camera, Settings, Shield, AlertTriangle, CheckCircle, XCircle, Key } from 'lucide-react';

export default function QRScanner() {
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Load jsQR library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js';
    script.async = true;
    script.onload = () => {
      console.log('jsQR loaded successfully');
      setJsQRLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load jsQR');
      setError('Failed to load QR code library');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Check if API key exists on mount
  useEffect(() => {
    if (!apiKey) {
      setShowSettings(true);
    }
  }, []);

  const startCamera = async () => {
    if (!jsQRLoaded) {
      setError('QR library is still loading, please wait...');
      return;
    }

    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      console.log('Camera access granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play();
          setScanning(true);
          setError('');
          startScanning();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Camera access error: ${err.message}. Please check permissions in your browser settings.`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const startScanning = () => {
    console.log('Starting QR code scanning...');
    scanIntervalRef.current = setInterval(() => {
      captureAndDecode();
    }, 300);
  };

  const captureAndDecode = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas ref not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    if (window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        console.log('QR Code detected:', code.data);
        stopCamera();
        checkURL(code.data);
      }
    } else {
      console.error('jsQR not available');
    }
  };

  const checkURL = async (url) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Checking URL:', url);
      
      // First, submit the URL to VirusTotal
      const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `url=${encodeURIComponent(url)}`
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('VirusTotal API error:', errorText);
        throw new Error('Invalid API key or request failed');
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

            {!jsQRLoaded && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">Loading QR code library...</p>
              </div>
            )}
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
              stopCamera();
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
                onClick={startCamera}
                disabled={!jsQRLoaded}
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {jsQRLoaded ? 'Start Scanning' : 'Loading...'}
              </button>
            </div>
          )}

          {scanning && (
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-96 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-indigo-500 rounded-lg"></div>
              </div>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
                Position QR code within the frame
              </div>
              <button
                onClick={stopCamera}
                className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>
          )}

          {loading && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Checking URL with VirusTotal...</p>
            </div>
          )}

          {result && (
            <div className="p-8">
              <div className="text-center mb-6">
                {getStatusIcon()}
                <h2 className="text-2xl font-bold mt-4 mb-2">
                  {result.malicious > 0 ? 'Danger!' : result.suspicious > 0 ? 'Suspicious' : 'Safe'}
                </h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Scanned URL:</p>
                <p className="text-sm font-mono break-all">{result.url}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Malicious</p>
                  <p className="text-3xl font-bold text-red-600">{result.malicious}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Suspicious</p>
                  <p className="text-3xl font-bold text-yellow-600">{result.suspicious}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Harmless</p>
                  <p className="text-3xl font-bold text-green-600">{result.harmless}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Undetected</p>
                  <p className="text-3xl font-bold text-gray-600">{result.undetected}</p>
                </div>
              </div>

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
                <p className="text-red-800 font-semibold mb-2">Error</p>
                <p className="text-red-600">{error}</p>
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

        {/* Debug info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          jsQR: {jsQRLoaded ? '✓ Loaded' : '⏳ Loading...'}
        </div>
      </div>
    </div>
  );
}