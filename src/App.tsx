import { useState, useEffect } from 'react'
import ApiKeyPage from './pages/ApiKeyPage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('apiKey');
  const [apiKey, setApiKey] = useState('');
  const [scannedUrls, setScannedUrls] = useState([]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    const savedUrls = localStorage.getItem('scannedUrls');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setCurrentPage('scan');
    }
    if (savedUrls) {
      setScannedUrls(JSON.parse(savedUrls));
    }
  }, []);

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('apiKey', key);
    setCurrentPage('scan');
  };

  const scanUrlWithVirusTotal = async (url) => {
    try {
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-apikey': apiKey,
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ url: url })
      };

      const response = await fetch('https://www.virustotal.com/api/v3/urls', options);
      const data = await response.json();
      
      return {
        success: true,
        scanId: data.data?.id,
        analysisUrl: data.data?.links?.self,
        response: data
      };
    } catch (error) {
      console.error('VirusTotal API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const handleUrlScanned = async (url) => {
    
    const virusTotalResult = await scanUrlWithVirusTotal(url);
    
    
    const newUrls = [
      ...scannedUrls, 
      { 
        url, 
        timestamp: new Date().toISOString(),
        virusTotal: virusTotalResult
      }
    ];
    
    setScannedUrls(newUrls);
    localStorage.setItem('scannedUrls', JSON.stringify(newUrls));
  };

  return (
    <div className="app">
      <nav>
        <button onClick={() => setCurrentPage('apiKey')}>API Key</button>
        <button onClick={() => setCurrentPage('scan')}>Scan</button>
        <button onClick={() => setCurrentPage('history')}>History</button>
      </nav>

      {currentPage === 'apiKey' && (
        <ApiKeyPage 
          currentApiKey={apiKey}
          onSave={handleSaveApiKey} 
        />
      )}
      {currentPage === 'scan' && (
        <ScanPage 
          apiKey={apiKey}
          onUrlScanned={handleUrlScanned} 
        />
      )}
      {currentPage === 'history' && (
        <HistoryPage urls={scannedUrls} />
      )}
    </div>
  );
}

export default App;