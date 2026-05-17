import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createHttpServer } from 'http';

dotenv.config();

const app = express();
const httpServer = createHttpServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});

const PORT = 3000;

app.use(cors());
app.use(express.json());

// API endpoints
const API_KEY = process.env.API_FOOTBALL_KEY;
const API_HOST = 'v3.football.api-sports.io';
const API_URL = `https://${API_HOST}`;

const apiParams = {
  headers: {
    'x-apisports-key': API_KEY,
    'x-rapidapi-host': API_HOST,
  },
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiConfigured: !!API_KEY });
});

// Mock/fallback response for when API key is not configured, to ensure app doesn't crash
const getFallbackData = (type: string) => {
  if (type === 'fixtures') {
    return {
      get: "fixtures",
      results: 0,
      paging: { current: 1, total: 1 },
      response: []
    };
  }
  return [];
};


app.get('/api/fixtures/live', async (req, res) => {
  if (!API_KEY) {
    return res.json(getFallbackData('fixtures'));
  }
  try {
    const response = await axios.get(`${API_URL}/fixtures?live=all`, apiParams);
    res.json(response.data);
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch live fixtures' });
  }
});

app.get('/api/fixtures/upcoming', async (req, res) => {
  if (!API_KEY) {
    return res.json(getFallbackData('fixtures'));
  }
  try {
    // Next 24 hours
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fetch fixtures for a few major leagues (e.g., PL: 39, La Liga: 140, CL: 2)
    // To limit reqs, let's just fetch for date
    const response = await axios.get(`${API_URL}/fixtures?date=${dateStr}`, apiParams);
    res.json(response.data);
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming fixtures' });
  }
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ teams: [], leagues: [] });
  // Currently, we mock search to ensure NO CRASH, but if API_KEY is present, we could search teams.
  // api-football supports search via /teams?search=string
  if (!API_KEY) {
      return res.json({
        teams: [],
        leagues: []
      });
  }
  try {
     const params = { ...apiParams, params: { search: q }};
     const teamsRes = await axios.get(`${API_URL}/teams`, params);
     const leaguesRes = await axios.get(`${API_URL}/leagues`, params);
     res.json({
         teams: teamsRes.data.response || [],
         leagues: leaguesRes.data.response || []
     });
  } catch (error) {
     res.status(500).json({ error: 'Search failed' });
  }
});
app.get('/api/news', async (req, res) => {
   // A mock news endpoint for now since API-Football doesn't have a news endpoint.
   // We will return a few static recent news placeholders but we could scrape or use another Free API like NewsAPI.
   res.json({
     articles: [
        {
           id: "1",
           headline: "Official: Unveiling the New Football Schedule",
           imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop",
           publishedAt: new Date().toISOString(),
           source: "UEFA",
           url: "#"
        },
        {
           id: "2",
           headline: "Champions League Updates: High stakes in the upcoming matches",
           imageUrl: "https://images.unsplash.com/photo-1551280857-2b9ebf2629e8?q=80&w=600&auto=format&fit=crop",
           publishedAt: new Date(Date.now() - 3600000).toISOString(),
           source: "Sky Sports",
           url: "#"
        }
     ]
   });
});


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Simple mock live polling every 30s to broadcast to connected clients
    setInterval(async () => {
       try {
         if (API_KEY) {
           const response = await axios.get(`${API_URL}/fixtures?live=all`, apiParams);
           io.emit('live_updates', response.data);
         } else {
           io.emit('live_updates', getFallbackData('fixtures'));
         }
       } catch (error) {
         console.error('Socket Live Poll Error');
       }
    }, 30000);
  });
}

startServer();
