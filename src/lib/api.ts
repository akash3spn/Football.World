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

export const getUpcomingFixtures = async () => {
  const res = await apiClient.get('/fixtures/upcoming');
  return res.data;
};

export const getNews = async () => {
  const res = await apiClient.get('/news');
  return res.data;
};
