import axios from 'axios';

// Get the base URL securely, no need for VITE_ prefix if we use relative paths for API.
const getAppUrl = () => {
    return window.location.origin;
}

export const apiClient = axios.create({
  baseURL: `${getAppUrl()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getLiveFixtures = async () => {
  const res = await apiClient.get('/fixtures/live');
  return res.data;
};

export const getFixturesByDate = async (dateStr: string) => {
  const res = await apiClient.get(`/fixtures?date=${dateStr}`);
  return res.data;
};

export const getUpcomingFixtures = async () => {
  const res = await apiClient.get('/fixtures/upcoming');
  return res.data;
};

export const getMatch = async (id: string | number) => {
  const res = await apiClient.get(`/fixtures/id?id=${id}`);
  return res.data;
};

export const getNews = async () => {
  const res = await apiClient.get('/news');
  return res.data;
};

export const searchEntities = async (query: string) => {
  const res = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

export const getStandings = async (league: string | number, season: string | number) => {
  const res = await apiClient.get(`/standings?league=${league}&season=${season}`);
  return res.data;
};

export const getTeam = async (id: string | number) => {
  const res = await apiClient.get(`/teams?id=${id}`);
  return res.data;
};

export const getTeamFixtures = async (id: string | number) => {
  const res = await apiClient.get(`/team/fixtures?id=${id}`);
  return res.data;
};

export const getTeamSquad = async (id: string | number) => {
  const res = await apiClient.get(`/team/squad?id=${id}`);
  return res.data;
};

export const getTeamCoach = async (id: string | number) => {
  const res = await apiClient.get(`/team/coach?id=${id}`);
  return res.data;
};

export const getLeague = async (id: string | number) => {
  const res = await apiClient.get(`/league?id=${id}`);
  return res.data;
};

export const getLeagueFixtures = async (league: string | number, season: string | number) => {
  const res = await apiClient.get(`/fixtures/league?league=${league}&season=${season}`);
  return res.data;
};
