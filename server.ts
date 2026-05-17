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

app.get('/api/fixtures', async (req, res) => {
  if (!API_KEY) {
    return res.json(getFallbackData('fixtures'));
  }
  try {
    const { date } = req.query; // format YYYY-MM-DD
    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
    }
    const response = await axios.get(`${API_URL}/fixtures?date=${date}`, apiParams);
    res.json(response.data);
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

app.get('/api/fixtures/upcoming', async (req, res) => {
  if (!API_KEY) {
    return res.json(getFallbackData('fixtures'));
  }
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    // Fetch fixtures for the current date. Also we can specify status=NS to get upcoming ones
    const response = await axios.get(`${API_URL}/fixtures?date=${dateStr}&status=NS`, apiParams);
    
    let upcoming = response.data.response || [];
    
    // If very few upcoming today, fetch tomorrow's
    if (upcoming.length < 5) {
       const tomorrow = new Date(today);
       tomorrow.setDate(tomorrow.getDate() + 1);
       const tmrwStr = tomorrow.toISOString().split('T')[0];
       const tomorrowRes = await axios.get(`${API_URL}/fixtures?date=${tmrwStr}&status=NS`, apiParams);
       upcoming = [...upcoming, ...(tomorrowRes.data.response || [])];
    }

    res.json({ ...response.data, response: upcoming });
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming fixtures' });
  }
});

app.get('/api/fixtures/league', async (req, res) => {
  try {
    const { league, season } = req.query;
    if (!league || !season) return res.status(400).json({ error: 'League and season required' });
    const response = await axios.get(`${API_URL}/fixtures?league=${league}&season=${season}`, apiParams);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch league fixtures' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const q = req.query.id;
    const response = await axios.get(`${API_URL}/teams?id=${q}`, apiParams);
    res.json(response.data);
  } catch (err: any) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: 'Failed to fetch team data' });
    }
  }
});

app.get('/api/fixtures/id', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Fixture id required' });
    const response = await axios.get(`${API_URL}/fixtures?id=${id}`, apiParams);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fixture' });
  }
});

app.get('/api/team/fixtures', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Team id required' });
    const [lastRes, nextRes] = await Promise.all([
      axios.get(`${API_URL}/fixtures?team=${id}&last=5`, apiParams),
      axios.get(`${API_URL}/fixtures?team=${id}&next=5`, apiParams)
    ]);
    res.json({
      last: lastRes.data.response || [],
      next: nextRes.data.response || []
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team fixtures' });
  }
});

app.get('/api/team/squad', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Team id required' });
    const response = await axios.get(`${API_URL}/players/squads?team=${id}`, apiParams);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team squad' });
  }
});

app.get('/api/team/coach', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Team id required' });
    const response = await axios.get(`${API_URL}/coachs?team=${id}`, apiParams);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team coach' });
  }
});

app.get('/api/league', async (req, res) => {
  try {
    const q = req.query.id;
    const response = await axios.get(`${API_URL}/leagues?id=${q}`, apiParams);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch league data' });
  }
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ teams: [], leagues: [] });
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

app.get('/api/standings', async (req, res) => {
  try {
    const { league, season } = req.query;
    if (!league || !season) return res.status(400).json({ error: 'League and season required' });
    const response = await axios.get(`${API_URL}/standings?league=${league}&season=${season}`, apiParams);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch standings' });
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

app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://football.world/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>
  <url><loc>https://football.world/live-football-score</loc><changefreq>always</changefreq><priority>0.9</priority></url>
  <url><loc>https://football.world/today-football-match</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>
  <url><loc>https://football.world/leagues</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: https://football.world/sitemap.xml`);
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

    // Refresh fixtures every 3 minutes
    setInterval(async () => {
       try {
         if (API_KEY) {
           const today = new Date();
           const dateStr = today.toISOString().split('T')[0];
           const response = await axios.get(`${API_URL}/fixtures?date=${dateStr}&status=NS`, apiParams);
           
           let upcoming = response.data.response || [];
           if (upcoming.length < 5) {
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tmrwStr = tomorrow.toISOString().split('T')[0];
              const tomorrowRes = await axios.get(`${API_URL}/fixtures?date=${tmrwStr}&status=NS`, apiParams);
              upcoming = [...upcoming, ...(tomorrowRes.data.response || [])];
           }
           io.emit('upcoming_updates', { ...response.data, response: upcoming });
         }
       } catch (error) {
         console.error('Socket upcoming update error');
       }
    }, 180000);
  });
}

startServer();
