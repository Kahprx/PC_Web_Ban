import { apiRequest } from './apiClient';

export async function fetchOverviewStats(token) {
  return apiRequest('/api/stats/overview', {
    method: 'GET',
    token,
  });
}
