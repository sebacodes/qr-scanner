import { useState, type FormEvent } from 'react';

interface ApiKeyPageProps {
  currentApiKey: string;
  onSave: (key: string) => void;
}

function ApiKeyPage({ currentApiKey, onSave }: ApiKeyPageProps) {
  const [key, setKey] = useState(currentApiKey || '');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="page">
      <h1>API Key Settings</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your API key"
        />
        <button type="submit">Save</button>
      </form>
      {currentApiKey && (
        <p>✓ API Key is configured</p>
      )}
    </div>
  );
}

export default ApiKeyPage;