import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function ScanPage({ apiKey, onUrlScanned }) {
  const [result, setResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const html5QrCode = useRef(null);

  useEffect(() => {
    html5QrCode.current = new Html5Qrcode("reader");
    
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        setSelectedCamera(devices[devices.length - 1].id);
      }
    }).catch(err => {
      console.error("Error getting cameras:", err);
    });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setResult(''); 
      const cameraId = selectedCamera || { facingMode: "environment" };
      
      await html5QrCode.current.start(
        cameraId,
        {
          fps: 10,   
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          setResult(decodedText);
          setIsChecking(true);
          await stopScanning();
          
          
          await onUrlScanned(decodedText);
          setIsChecking(false);
        },
        (errorMessage) => {
          console.log(errorMessage)
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      alert('Camera access denied or not available');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode.current && isScanning) {
      try {
        await html5QrCode.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  if (!apiKey) {
    return (
      <div className="page">
        <h1>QR Scan</h1>
        <p>Set up your VirusTotal API key first to start scanning.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Scan QR Code</h1>
      
      {cameras.length > 1 && !isScanning && (
        <div style={{ marginBottom: '1rem' }}>
          <label>Select Camera: </label>
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div id="reader" style={{ width: '100%', maxWidth: '500px' }}></div>
      
      <div style={{ marginTop: '1rem' }}>
        {!isScanning ? (
          <button onClick={startScanning} disabled={isChecking}>
            Start Scanning
          </button>
        ) : (
          <button onClick={stopScanning}>Stop Scanning</button>
        )}
      </div>

      {isChecking && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
          <p>Submitting URL or analysis</p>
        </div>
      )}

      {result && !isChecking && (
        <div className="result" style={{ marginTop: '1rem', padding: '1rem', background: '#d4edda', borderRadius: '4px' }}>
          <h3>✓ Scanned & Submitted</h3>
          <p style={{ wordBreak: 'break-all' }}>{result}</p>
          {result.startsWith('http') && (
            <a href={result} target="_blank" rel="noopener noreferrer">
              Open Link
            </a>
          )}
          <p style={{ fontSize: '0.9em', marginTop: '0.5rem', color: '#155724' }}>
            Check the History page for VirusTotal results.
          </p>
        </div>
      )}
    </div>
  );
}

export default ScanPage;