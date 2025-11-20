const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode'); // NEW: Image generator
const UAParser = require('ua-parser-js'); // NEW: User Agent Parser

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// Paste your Atlas connection string here again!
const DB_URI = 'mongodb+srv://admin:project123@cluster0.j38cr4r.mongodb.net/?appName=Cluster0'; 

mongoose.connect(DB_URI)
  .then(() => console.log('✅ Connected to Cloud Database'))
  .catch(err => console.error('❌ DB Error:', err));

// --- UPGRADED SCHEMA ---
// We now store an array of visitor details, not just a number.
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortId: { type: String, required: true, unique: true },
  qrCode: { type: String }, // Stores the Base64 image string
  visitHistory: [
    { 
      timestamp: { type: Number },
      browser: String,
      os: String,
      device: String,
      ip: String
    }
  ]
}, { timestamps: true });

const Url = mongoose.model('Url', urlSchema);

// --- API 1: Create Link + Generate QR Code ---
app.post('/api/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl) return res.status(400).json({ error: 'URL is required' });

  try {
    const shortId = nanoid(7);
    const shortUrl = `http://localhost:5000/${shortId}`;
    
    // BACKEND HEAVY TASK: Generate QR Code on the server
    // This returns a "Data URL" (image encoded as text)
    const qrCodeImage = await QRCode.toDataURL(shortUrl);

    const newUrl = await Url.create({ 
      originalUrl, 
      shortId,
      qrCode: qrCodeImage
    });

    res.json(newUrl);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// --- API 2: The "Smart" Redirect ---
app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;
  
  try {
    // 1. Parse the Visitor's "User-Agent" string
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // 2. Prepare the analytics data
    const visitData = {
      timestamp: Date.now(),
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
      device: result.device.type || 'Desktop', // 'mobile', 'tablet', etc.
      ip: req.ip // Captures IP address
    };

    // 3. Find and Push to array (Complex Write)
    const url = await Url.findOneAndUpdate(
      { shortId },
      { $push: { visitHistory: visitData } } // Adds new visitor to the list
    );

    if (url) {
      res.redirect(url.originalUrl);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// --- API 3: Detailed Stats ---
app.get('/api/stats', async (req, res) => {
  try {
    // We return everything, frontend decides what to show
    const urls = await Url.find().sort({ createdAt: -1 }).limit(10);
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

app.listen(5000, () => console.log('🚀 Advanced Server running on port 5000'));