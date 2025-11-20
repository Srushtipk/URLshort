import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const res = await axios.get('http://localhost:5000/api/stats');
    setStats(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/shorten', { originalUrl });
      setOriginalUrl('');
      fetchStats();
    } catch (err) {
      alert('Error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>🚀 Advanced URL Shortener</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>With Server-Side QR Generation & Visitor Analytics</p>
      
      {/* INPUT FORM */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', margin: '30px 0' }}>
        <input
          type="url"
          placeholder="Paste a long URL here..."
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
          style={{ flex: 1, padding: '15px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button disabled={loading} style={{ padding: '15px 30px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px' }}>
          {loading ? 'Processing...' : 'Shorten & Generate QR'}
        </button>
      </form>

      {/* DATA LIST */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {stats.map((url) => (
          <div key={url._id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            
            {/* QR CODE COLUMN */}
            <div style={{ textAlign: 'center' }}>
              <img src={url.qrCode} alt="QR" style={{ width: '80px', height: '80px' }} />
              <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Scan Me</div>
            </div>

            {/* INFO COLUMN */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#007bff' }}>
                <a href={`http://localhost:5000/${url.shortId}`} target="_blank" rel="noreferrer">
                  localhost:5000/{url.shortId}
                </a>
              </div>
              <div style={{ fontSize: '14px', color: '#555', margin: '5px 0', wordBreak: 'break-all' }}>
                Original: {url.originalUrl}
              </div>
              
              {/* ANALYTICS BADGES */}
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ background: '#eee', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  👁️ {url.visitHistory.length} Clicks
                </span>
                {/* Show last 3 visitors */}
                {url.visitHistory.slice(-3).reverse().map((visit, i) => (
                   <span key={i} style={{ background: '#e3f2fd', color: '#0d47a1', padding: '5px 10px', borderRadius: '20px', fontSize: '11px' }}>
                     {visit.device} / {visit.browser}
                   </span>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export default App;