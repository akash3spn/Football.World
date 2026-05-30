import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createHttpServer } from 'http';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';

dotenv.config();

const app = express();
const httpServer = createHttpServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});

const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Firebase for Backend Caching
let db: any = null;

// Initialize Firebase Admin for Push Notifications
let adminMessaging: any = null;
import * as admin from 'firebase-admin';

try {
  const fbConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(fbConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
    
    // Initialize admin app without credential (will use default or no-op if lacks permission)
    if (!admin.apps?.length) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId
      });
    }
    adminMessaging = admin.messaging();
    console.log("Firebase Admin Messaging Initialized");
  }
} catch (e) {
  console.error("Firebase Admin Init Failed", e);
}

// API for following matches
app.post('/api/follow', async (req, res) => {
  if (!db) return res.status(500).json({ error: "Firebase not initialized" });
  try {
     const { matchId, token } = req.body;
     if (!matchId || !token) return res.status(400).json({ error: "Missing matchId or token" });
     
     const docRef = doc(db, 'match_followers', String(matchId));
     const snap = await getDoc(docRef);
     if (snap.exists()) {
       const data = snap.data();
       const tokens = data.tokens || [];
       if (!tokens.includes(token)) {
          await setDoc(docRef, { tokens: [...tokens, token] }, { merge: true });
       }
     } else {
       await setDoc(docRef, { tokens: [token] });
     }
     return res.json({ success: true });
  } catch (e) {
     console.error(e);
     return res.status(500).json({ error: "DB Error" });
  }
});

try {
  const fbConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(fbConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
    const fbApp = initializeApp(firebaseConfig, 'backend-app');
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase Backend Cache Initialized");
  }
} catch (e) {
  console.error("Firebase Backend Cache Init Failed", e);
}

// API endpoints
const API_HOST = 'v3.football.api-sports.io';
const API_URL = `https://${API_HOST}`;

// Use proper headers directly
const getApiHeaders = () => ({
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY,
  },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiConfigured: !!process.env.API_FOOTBALL_KEY });
});

app.get('/api/status', async (req, res) => {
  try {
    const data = await fetchFromAPI(`${API_URL}/status`);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Cache and retry system
const cache = new Map<string, { data: any; expiry: number }>();
const inflight = new Map<string, Promise<any>>();

// Simple delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Request throttle queue to ensure not too many requests go out instantly
let lastRequestTime = 0;
const requestThrottleMs = 250; // Max 4 requests per second

const fetchFromAPI = async (url: string, retries = 2): Promise<any> => {
  // Check memory cache first
  if (cache.has(url)) {
    const cached = cache.get(url)!;
    if (Date.now() < cached.expiry) {
      return cached.data;
    }
    cache.delete(url);
  }

  // If there's an active request for this URL, wait for it instead of duplicating
  if (inflight.has(url)) {
    return inflight.get(url);
  }

  const doFetch = async (currentRetries: number): Promise<any> => {
    // Create a safe document ID from the URL
    const docId = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_');
    
    // Check Firebase cache
    if (db) {
      try {
        const docRef = doc(db, 'cache', docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const cached = snapshot.data();
          if (Date.now() < cached.expiry) {
            cache.set(url, { data: cached.data, expiry: cached.expiry }); // Sync to memory
            return cached.data;
          }
        }
      } catch (e) {
        console.error("Firebase Cache Read Error", e);
      }
    }

    try {
      // Throttle outward requests
      const now = Date.now();
      if (now - lastRequestTime < requestThrottleMs) {
         await delay(requestThrottleMs - (now - lastRequestTime));
      }
      lastRequestTime = Date.now();

      const response = await axios.get(url, { ...getApiHeaders(), timeout: 8000 });
      
      const hasErrors = response.data && response.data.errors && 
        (Array.isArray(response.data.errors) 
          ? response.data.errors.length > 0 
          : Object.keys(response.data.errors).length > 0);

      // API returned an applications-level error (e.g. auth issue, rate limit hit according to API-sports spec)
      if (hasErrors) {
         return await tryFallbackApi(url, response.data);
      }
      
      // Set cache expiry: 30s for live, 24h for search, 30m for everything else to save API calls
      const isLive = url.includes('live=all');
      const isSearch = url.includes('search=');
      const isConfig = url.includes('/status');
      
      // Events, stats, and specific fixtures can update quickly during match. Cap them at 1 minute.
      const isMatchData = url.includes('/fixtures?id=') || url.includes('/fixtures/events') || url.includes('/fixtures/statistics');
      
      const expiryTime = Date.now() + (isLive ? 30000 : (isSearch ? 86400000 : (isConfig ? 86400000 : (isMatchData ? 60000 : 1800000)))); 
      const dataToCache = response.data;
      
      // Save to Memory Cache
      cache.set(url, { data: dataToCache, expiry: expiryTime });

      // Save to Firebase Cache (in background)
      if (db) {
         setDoc(doc(db, 'cache', docId), {
           url,
           data: dataToCache,
           expiry: expiryTime,
           updatedAt: Date.now()
         }).catch(e => console.error("Firebase Cache Write Error", e));
      }

      return dataToCache;
    } catch (error: any) {
      const status = error.response?.status;
      
      // Do not retry client errors like 401 Unauthorized, 403 Forbidden, 429 Too Many Requests
      const isClientError = status >= 400 && status < 500;
      
      if (currentRetries > 0 && !isClientError) {
        const retryDelay = 1000 * (3 - currentRetries); // Exponential backoff (1s, 2s)
        console.warn(`Retrying... (${currentRetries} left) for ${url} after ${retryDelay}ms`);
        await delay(retryDelay);
        return doFetch(currentRetries - 1);
      }
      return await tryFallbackApi(url, { errors: { message: error.message } });
    }
  };

  const promise = doFetch(retries);
  inflight.set(url, promise);

  try {
    const result = await promise;
    inflight.delete(url);
    return result;
  } catch (err) {
    inflight.delete(url);
    throw err;
  }
};

// Fallback logic mapping OpenFootball / TheSportsDB to API-Sports structure structure when primary fails
const tryFallbackApi = async (url: string, originalErrorData: any) => {
   // Determine what to return based on URL
   if (url.includes('/status')) return originalErrorData;
   
   // Fallback mock/open data wrapper to prevent full application crash
   const tsdbBase = 'https://www.thesportsdb.com/api/v1/json/3';
   try {
     if (url.includes('live=all')) {
        // Just return empty array for live on fallback, no mock data
        return { response: [], fallback: true };
     } else if (url.includes('fixtures?date=') || url.includes('next=')) {
        // Map today's events if date matches
        const dateMatch = url.match(/date=([^&]+)/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
        const res = await axios.get(`${tsdbBase}/eventsday.php?d=${date}&s=Soccer`, { timeout: 5000 });
        const events = res.data?.events || [];
        
        const mapped = events.map((e: any) => ({
           fixture: {
             id: e.idEvent,
             date: e.strTimestamp || e.dateEvent,
             status: { elapsed: null, short: e.strStatus === 'Match Finished' ? 'FT' : (e.strStatus || (e.intHomeScore !== null ? 'FT' : 'NS')) }
           },
           league: { name: e.strLeague, logo: e.strLeagueBadge, country: e.strCountry || 'Unknown' },
           teams: {
              home: { name: e.strHomeTeam, logo: e.strHomeTeamBadge || 'https://media.api-sports.io/football/teams/1.png' },
              away: { name: e.strAwayTeam, logo: e.strAwayTeamBadge || 'https://media.api-sports.io/football/teams/2.png' }
           },
           goals: { home: e.intHomeScore, away: e.intAwayScore }
        }));
        
        return { response: mapped, fallback: true };
     } else if (url.includes('league=')) {
         return { response: [], fallback: true };
     } else if (url.includes('search=')) {
         return { response: [], fallback: true }; 
     }
     
     return originalErrorData;
   } catch {
     return originalErrorData;
   }
};

app.get('/api/live', async (req, res) => {
  try {
    const data = await fetchFromAPI(`${API_URL}/fixtures?live=all`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/fixtures/live', async (req, res) => {
  try {
    const data = await fetchFromAPI(`${API_URL}/fixtures?live=all`);
    res.json(data);
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch live fixtures' });
  }
});

app.get('/api/fixtures', async (req, res) => {
  try {
    const { date } = req.query; // format YYYY-MM-DD
    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
    }
    const data = await fetchFromAPI(`${API_URL}/fixtures?date=${date}`);
    res.json(data);
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

app.get('/api/fixtures/upcoming', async (req, res) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const data = await fetchFromAPI(`${API_URL}/fixtures?date=${dateStr}&status=NS`);
    
    let upcoming = data.response || [];
    
    // If very few upcoming today, fetch tomorrow's
    if (upcoming.length < 5) {
       const tomorrow = new Date(today);
       tomorrow.setDate(tomorrow.getDate() + 1);
       const tmrwStr = tomorrow.toISOString().split('T')[0];
       const tomorrowData = await fetchFromAPI(`${API_URL}/fixtures?date=${tmrwStr}&status=NS`);
       upcoming = [...upcoming, ...(tomorrowData.response || [])];
    }

    res.json({ ...data, response: upcoming });
  } catch (error: any) {
    console.error('API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming fixtures' });
  }
});

app.get('/api/fixtures/league', async (req, res) => {
  try {
    const { league, season } = req.query;
    if (!league || !season) return res.status(400).json({ error: 'League and season required' });
    const data = await fetchFromAPI(`${API_URL}/fixtures?league=${league}&season=${season}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch league fixtures' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const q = req.query.id;
    const data = await fetchFromAPI(`${API_URL}/teams?id=${q}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team data' });
  }
});

app.get('/api/fixtures/id', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Fixture id required' });
    const data = await fetchFromAPI(`${API_URL}/fixtures?id=${id}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fixture' });
  }
});

app.get('/api/fixtures/events', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Fixture id required' });
    const data = await fetchFromAPI(`${API_URL}/fixtures/events?fixture=${id}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fixture events' });
  }
});

app.get('/api/fixtures/statistics', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Fixture id required' });
    const data = await fetchFromAPI(`${API_URL}/fixtures/statistics?fixture=${id}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fixture statistics' });
  }
});

app.get('/api/fixtures/lineups', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Fixture id required' });
    const data = await fetchFromAPI(`${API_URL}/fixtures/lineups?fixture=${id}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fixture lineups' });
  }
});

app.get('/api/fixtures/players', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Fixture id required' });
    const data = await fetchFromAPI(`${API_URL}/fixtures/players?fixture=${id}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch fixture players' });
  }
});

app.get('/api/team/fixtures', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Team id required' });
    const [lastData, nextData] = await Promise.all([
      fetchFromAPI(`${API_URL}/fixtures?team=${id}&last=5`),
      fetchFromAPI(`${API_URL}/fixtures?team=${id}&next=5`)
    ]);
    res.json({
      last: lastData.response || [],
      next: nextData.response || []
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team fixtures' });
  }
});

app.get('/api/team/squad', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Team id required' });
    const data = await fetchFromAPI(`${API_URL}/players/squads?team=${id}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team squad' });
  }
});

app.get('/api/team/coach', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Team id required' });
    const data = await fetchFromAPI(`${API_URL}/coachs?team=${id}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch team coach' });
  }
});

app.get('/api/league', async (req, res) => {
  try {
    const q = req.query.id;
    const data = await fetchFromAPI(`${API_URL}/leagues?id=${q}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch league data' });
  }
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ teams: [], leagues: [] });
  if (!process.env.API_FOOTBALL_KEY) {
      return res.json({
        teams: [],
        leagues: []
      });
  }
  try {
     const teamsData = await fetchFromAPI(`${API_URL}/teams?search=${q}`);
     const leaguesData = await fetchFromAPI(`${API_URL}/leagues?search=${q}`);
     res.json({
         teams: teamsData.response || [],
         leagues: leaguesData.response || []
     });
  } catch (error) {
     res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/api/standings', async (req, res) => {
  try {
    const { league, season } = req.query;
    if (!league || !season) return res.status(400).json({ error: 'League and season required' });
    const data = await fetchFromAPI(`${API_URL}/standings?league=${league}&season=${season}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

let cachedNews: any = null;
let lastNewsFetchTime: number = 0;

app.get('/api/news', async (req, res) => {
  try {
     const ONE_HOUR = 60 * 60 * 1000;
     if (cachedNews && (Date.now() - lastNewsFetchTime < ONE_HOUR)) {
        return res.json({ articles: cachedNews });
     }
     
     // Fetch from BBC Football via RSS2JSON
     const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/sport/football/rss.xml');
     const data = await response.json();
     
     if (data && data.items && data.items.length > 0) {
        cachedNews = data.items.map((item: any, i: number) => ({
           id: String(i),
           headline: item.title,
           imageUrl: item.thumbnail || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop",
           publishedAt: item.pubDate,
           source: "BBC Sport",
           url: item.link
        }));
        lastNewsFetchTime = Date.now();
        return res.json({ articles: cachedNews });
     } else {
        // Fallback
        if (cachedNews) return res.json({ articles: cachedNews });
        res.json({
           articles: [
              {
                 id: "1",
                 headline: "Live Football Updates Available Soon",
                 imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop",
                 publishedAt: new Date().toISOString(),
                 source: "Football.World",
                 url: "#"
              }
           ]
        });
     }
  } catch(e) {
     if (cachedNews) return res.json({ articles: cachedNews });
     res.status(500).json({ error: 'Failed to fetch news' });
  }
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
    
    // Simple live polling every 30s to broadcast to connected clients
    let previousLiveMatches: Record<string, any> = {};

    setInterval(async () => {
       // Only poll if there are connected clients to prevent API exhaustion!
       if ((io.engine as any).clientsCount === 0) return;
       
       try {
         if (process.env.API_FOOTBALL_KEY) {
           const data = await fetchFromAPI(`${API_URL}/fixtures?live=all`);
           io.emit('live_updates', data);
           
           if (data && data.response && Array.isArray(data.response)) {
              for (const match of data.response) {
                const matchId = match.fixture.id;
                const prevMatch = previousLiveMatches[matchId];
                
                let notificationSent = false;
                let messageBody = '';

                if (prevMatch) {
                    // Check for new goals
                    if (match.goals.home > prevMatch.goals.home || match.goals.away > prevMatch.goals.away) {
                        messageBody = `GOAL! ${match.teams.home.name} ${match.goals.home} - ${match.goals.away} ${match.teams.away.name}`;
                        notificationSent = true;
                    }
                    
                    // Check for red cards (if statistics array exists and has red cards)
                    const homeRedsObj = match.statistics?.[0]?.statistics?.find((s:any) => s.type === 'Red Cards');
                    const awayRedsObj = match.statistics?.[1]?.statistics?.find((s:any) => s.type === 'Red Cards');
                    const prevHomeRedsObj = prevMatch.statistics?.[0]?.statistics?.find((s:any) => s.type === 'Red Cards');
                    const prevAwayRedsObj = prevMatch.statistics?.[1]?.statistics?.find((s:any) => s.type === 'Red Cards');

                    const getVal = (obj: any) => obj?.value || 0;

                    if (getVal(homeRedsObj) > getVal(prevHomeRedsObj)) {
                        messageBody = `RED CARD for ${match.teams.home.name}`;
                        notificationSent = true;
                    } else if (getVal(awayRedsObj) > getVal(prevAwayRedsObj)) {
                        messageBody = `RED CARD for ${match.teams.away.name}`;
                        notificationSent = true;
                    }
                }
                
                previousLiveMatches[matchId] = match;

                // Send push notification via Firebase Admin
                if (notificationSent && adminMessaging && db) {
                   try {
                     const snap = await getDoc(doc(db, 'match_followers', String(matchId)));
                     if (snap.exists()) {
                       const tokens = snap.data().tokens || [];
                       if (tokens.length > 0) {
                          await adminMessaging.sendEachForMulticast({
                            tokens,
                            notification: {
                              title: 'Live Match Update',
                              body: messageBody,
                            }
                          });
                          console.log(`Notification sent for match ${matchId} to ${tokens.length} users`);
                       }
                     }
                   } catch (e) {
                     console.error("Failed to send push notification", e);
                   }
                }
              }
           }
         } else {
           io.emit('live_updates', { response: [] });
         }
       } catch (error) {
         // Quietly ignore polling errors to avoid log spam
       }
    }, 30000);

    // Refresh fixtures every 3 minutes
    setInterval(async () => {
       // Only poll if there are connected clients
       if ((io.engine as any).clientsCount === 0) return;
       
       try {
         if (process.env.API_FOOTBALL_KEY) {
           const today = new Date();
           const dateStr = today.toISOString().split('T')[0];
           const data = await fetchFromAPI(`${API_URL}/fixtures?date=${dateStr}&status=NS`);
           
           let upcoming = data.response || [];
           if (upcoming.length < 5) {
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tmrwStr = tomorrow.toISOString().split('T')[0];
              const tomorrowData = await fetchFromAPI(`${API_URL}/fixtures?date=${tmrwStr}&status=NS`);
              upcoming = [...upcoming, ...(tomorrowData.response || [])];
           }
           io.emit('upcoming_updates', { ...data, response: upcoming });
         }
       } catch (error) {
         // Quietly ignore polling errors to avoid log spam
       }
    }, 180000);
  });
}

startServer();
