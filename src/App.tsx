import { useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode';
import './App.css'


function App() {
  const [count, setCount] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [url, setURL] = useState('')
  const [result, setResult] = useState('')



  //Html5-qrcode basic usage from documentation
  const html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      console.log(decodedText);
    }
  );


// Page starts asking for your virus total API key and save it on click save
// Options: Go to Scan, (feat: save session scans)
// Options: Delete all data

// Scan page ask for cammera permissions to take pictures
// Then they extract the url from the image and send it to virus total
// Then return the results
// Options: Go to Scan, (feat: save session scans)
// Options: Delete all data

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
