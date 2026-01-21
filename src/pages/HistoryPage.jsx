function HistoryPage({ urls }) {
  const clearHistory = () => {
    if (confirm('Clear all scan history?')) {
      localStorage.removeItem('scannedUrls');
      window.location.reload();
    }
  };

  return (
    <div className="page">
      <h1>QR Scan History</h1>
      
      {urls.length === 0 ? (
        <p>No URLs scanned yet.</p>
      ) : (
        <>
          <button onClick={clearHistory} style={{ marginBottom: '1rem' }}>
            Clear History
          </button>
          <div className="history-list">
            {urls.map((item, index) => (
              <div key={index} className="history-item" style={{
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>URL:</strong>{' '}
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ wordBreak: 'break-all' }}
                  >
                    {item.url}
                  </a>
                </div>
                
                <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '0.5rem' }}>
                  <strong>Scanned:</strong> {new Date(item.timestamp).toLocaleString()}
                </div>

                {item.virusTotal && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.5rem', 
                    backgroundColor: item.virusTotal.success ? '#d4edda' : '#f8d7da',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}>
                    <strong>VirusTotal:</strong>
                    {item.virusTotal.success ? (
                      <>
                        <div>Successfully submitted for analysis</div>
                        {item.virusTotal.scanId && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <strong>Scan ID:</strong> {item.virusTotal.scanId}
                          </div>
                        )}
                        {item.virusTotal.analysisUrl && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <a 
                              href={item.virusTotal.analysisUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              View Analysis Results
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>Error: {item.virusTotal.error || 'Failed to scan'}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HistoryPage;