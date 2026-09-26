const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('creator_calendar_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('creator_calendar_token', token);
  } else {
    localStorage.removeItem('creator_calendar_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { message: response.statusText || 'An unexpected error occurred' };
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },

  // Profiles
  profiles: {
    list: () => request('/profiles'),
    create: (data) => request('/profiles', { method: 'POST', body: data }),
    get: (id) => request(`/profiles/${id}`),
    update: (id, data) => request(`/profiles/${id}`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/profiles/${id}`, { method: 'DELETE' }),
  },

  // Profile Posts (historical data)
  profilePosts: {
    list: (profileId) => request(`/profiles/${profileId}/posts`),
    create: (profileId, data) => request(`/profiles/${profileId}/posts`, { method: 'POST', body: data }),
    batchImport: (profileId, posts) => request(`/profiles/${profileId}/posts/batch`, { method: 'POST', body: { posts } }),
    seedSample: (profileId) => request(`/profiles/${profileId}/seed-sample-posts`, { method: 'POST' }),
    update: (id, data) => request(`/profile-posts/${id}`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/profile-posts/${id}`, { method: 'DELETE' }),
  },

  // Analysis & Recommendations
  analysis: {
    trigger: (profileId) => request(`/profiles/${profileId}/analyze`, { method: 'POST' }),
    getLatest: (profileId) => request(`/profiles/${profileId}/analysis`),
    getRecommendations: (profileId) => request(`/profiles/${profileId}/recommendations`),
    updateRecommendation: (id, status) => request(`/recommendations/${id}`, { method: 'PATCH', body: { status } }),
  },

  // Ideas
  ideas: {
    list: (profileId) => request(`/profiles/${profileId}/ideas`),
    generate: (profileId) => request(`/profiles/${profileId}/ideas`, { method: 'POST' }),
    delete: (id) => request(`/ideas/${id}`, { method: 'DELETE' }),
  },

  // Content Plans & Calendar
  calendar: {
    getPlans: (profileId) => request(`/content-plans${profileId ? `?profile_id=${profileId}` : ''}`),
    generatePlan: (profileId) => request('/content-plans/generate', { method: 'POST', body: { profile_id: profileId } }),
    getPlan: (id) => request(`/content-plans/${id}`),
    deletePlan: (id) => request(`/content-plans/${id}`, { method: 'DELETE' }),
  },

  // Posts
  posts: {
    list: (filters = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          queryParams.append(key, val);
        }
      });
      const q = queryParams.toString();
      return request(`/posts${q ? `?${q}` : ''}`);
    },
    create: (data) => request('/posts', { method: 'POST', body: data }),
    get: (id) => request(`/posts/${id}`),
    update: (id, data) => request(`/posts/${id}`, { method: 'PATCH', body: data }),
    updateStatus: (id, status) => request(`/posts/${id}/status`, { method: 'PATCH', body: { status } }),
    delete: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  },

  // AI Direct Endpoints
  ai: {
    analyzeProfile: (profileId) => request('/ai/analyze-profile', { method: 'POST', body: { profile_id: profileId } }),
    generateIdeas: (profileId) => request('/ai/generate-ideas', { method: 'POST', body: { profile_id: profileId } }),
    generateCalendar: (profileId) => request('/ai/generate-calendar', { method: 'POST', body: { profile_id: profileId } }),
    regeneratePost: (options) => request('/ai/regenerate-post', { method: 'POST', body: options }),
    applyRegeneratedPost: (postId, updatedPost) => request('/ai/apply-regenerated-post', { method: 'POST', body: { post_id: postId, updated_post: updatedPost } }),
  },

  // Campaigns
  campaigns: {
    list: (profileId) => request(`/campaigns${profileId ? `?profile_id=${profileId}` : ''}`),
    create: (data) => request('/campaigns', { method: 'POST', body: data }),
    get: (id) => request(`/campaigns/${id}`),
    update: (id, data) => request(`/campaigns/${id}`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
  },

  // Dashboard
  dashboard: {
    getSummary: (profileId) => request(`/dashboard/summary${profileId ? `?profile_id=${profileId}` : ''}`),
  }
};
