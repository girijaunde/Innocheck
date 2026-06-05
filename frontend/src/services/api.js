import axios from 'axios';

const TOKEN_KEY = 'innocheck_token';
const REFRESH_TOKEN_KEY = 'innocheck_refresh_token';
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`✓ API ${response.config?.method?.toUpperCase()} ${response.config?.url}`);
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    console.error(`❌ API Error [${error.response?.status}]: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
    });

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        return api
          .post('/api/auth/refresh', { refresh_token: refreshToken })
          .then((res) => {
            const newToken = res.data.access_token;
            localStorage.setItem(TOKEN_KEY, newToken);
            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            return api(originalRequest);
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            window.location.href = '/login';
            return Promise.reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      const message = 'Rate limit exceeded. Please try again in a moment.';
      console.warn(message);
      return Promise.reject({
        message,
        status: 429,
        original: error
      });
    }

    // Handle 503 Service Unavailable
    if (error.response?.status === 503) {
      const message = error.response?.data?.detail || 'Service temporarily unavailable. Please try again later.';
      console.error(message);
      return Promise.reject({
        message,
        status: 503,
        original: error
      });
    }

    // Handle 500+ Server Errors
    if (error.response?.status >= 500) {
      const message = 'Server error. Please try again later or contact support.';
      console.error(message);
      return Promise.reject({
        message,
        status: error.response.status,
        original: error
      });
    }

    // Handle validation errors (400, 422)
    if (error.response?.status === 400 || error.response?.status === 422) {
      const message = error.response?.data?.detail || 'Invalid request. Please check your input.';
      return Promise.reject({
        message,
        status: error.response.status,
        details: error.response?.data,
        original: error
      });
    }

    // Handle network errors
    if (!error.response) {
      const message = error.message === 'Network Error'
        ? 'Network connection failed. Please check your internet connection.'
        : 'Request failed. Please try again.';
      console.error(message);
      return Promise.reject({
        message,
        status: 0,
        original: error
      });
    }

    return Promise.reject({
      message: error.response?.data?.detail || error.message || 'An error occurred',
      status: error.response?.status,
      original: error
    });
  }
);

// API Services
export const apiService = {
  auth: {
    login: (data) => api.post('/api/auth/login', data),
    register: (data) => api.post('/api/auth/register', data),
    me: () => api.get('/api/auth/me'),
    logout: () => {
      apiService.auth.clearToken();
      return Promise.resolve();
    },
    refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refresh_token: refreshToken }),
    
    // Token management
    saveToken: (token) => localStorage.setItem(TOKEN_KEY, token),
    saveRefreshToken: (refreshToken) => localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    clearToken: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
    getToken: () => localStorage.getItem(TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  },

  // Health Check
  health: {
    check: () => api.get('/api/health'),
  },

  // Dashboard
  dashboard: {
    getOverview: () => api.get('/api/dashboard/overview'),
    getStats: () => api.get('/api/dashboard/stats'),
    getHistory: () => api.get('/api/history/me'),
  },

  // Idea Validator
  ideaValidator: {
    validateIdea: (data) => api.post('/api/validate', data),
    getHistory: () => api.get('/api/history/me'),
    exportComprehensiveMD: (problemId) => api.post('/api/export/comprehensive/md', { problem_id: problemId }, { responseType: 'blob' }),
    exportComprehensivePDF: (problemId) => api.post('/api/export/comprehensive/pdf', { problem_id: problemId }, { responseType: 'blob' }),
  },

  // Code Generator
  codeGenerator: {
    generateCode: (data) => api.post('/api/generate/code', data),
  },

  // CodeStudio (Unified Code Generation & Prototyping)
  codestudio: {
    generateComponent: (data) => api.post('/api/codestudio/component', data),
    generatePrototype: (data) => api.post('/api/codestudio/prototype', data),
    refineCode: (data) => api.post('/api/codestudio/refine', data),
    explainCode: (data) => api.post('/api/codestudio/explain', data),
    suggestStack: (data) => api.post('/api/codestudio/suggest-stack', data),
    analyzeComplexity: (data) => api.post('/api/codestudio/analyze-complexity', data),
    chatRefine: (data) => api.post('/api/codestudio/chat-refine', data),
    testCode: (data) => api.post('/api/codestudio/test-code', data),
    exportPlatform: (data) => api.post('/api/codestudio/export-platform', data),
    getTemplates: () => api.get('/api/codestudio/templates'),
    saveProject: (data) => api.post('/api/codestudio/save-project', data),
    getMyProjects: () => api.get('/api/codestudio/my-projects'),
    forkProject: (projectId) => api.post(`/api/codestudio/fork-project/${projectId}`, {}),
    generateMockData: (data) => api.post('/api/codestudio/mock-data', data),
    generatePitchDeck: (data) => api.post('/api/codestudio/pitch-deck', data),
    checkOriginality: (data) => api.post('/api/codestudio/plagiarism-check', data),
  },

  // Plagiarism Checker
  plagiarismChecker: {
    checkText: (data) => api.post('/api/plagiarism/check', data),
    checkCode: (data) => api.post('/api/plagiarism/check', data),
    checkPlagiarism: (data) => api.post('/api/plagiarism/check', data),
  },

  // Literature Review
  literatureReview: {
    searchPapers: (data) => api.post('/api/literature/search', data),
    summarize: (data) => api.post('/api/literature/summarize', data),
    savePaper: (data) => api.post('/api/literature/save', data),
    getSavedPapers: () => api.get('/api/literature/saved'),
    deleteSavedPaper: (paperId) => api.delete(`/api/literature/saved/${paperId}`),
    getBibliography: () => api.get('/api/literature/bibliography'),
    generateSurvey: (data) => api.post('/api/literature/generate-survey', data),
  },

  // Prototype Builder
  prototypeBuilder: {
    getTemplates: () => api.get('/api/prototype/templates'),
    generatePrototype: (data) => api.post('/api/prototype/generate', data),
    refinePrototype: (data) => api.post('/api/prototype/refine', data),
    explainCode: (data) => api.post('/api/prototype/explain', data),
  },

  // Analytics & Feedback
  feedback: {
    submitFeedback: (data) => api.post('/api/feedback', data),
    rateSuggestion: (data) => api.post('/api/feedback/rate', data),
  },

  // Sessions/Chat
  sessions: {
    createSession: (data) => api.post('/api/sessions', data),
    getSession: (sessionId) => api.get(`/api/sessions/${sessionId}/messages`),
    getSessions: () => api.get('/api/sessions'),
    deleteSession: (sessionId) => api.delete(`/api/sessions/${sessionId}`),
  },

  // Settings API
  settings: {
    getKeys: () => api.get('/api/settings/keys'),
    saveKeys: (data) => api.post('/api/settings/save-keys', data),
  },
};

// Helper function to get user-friendly error message
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  if (typeof error === 'string') return error;
  if (Array.isArray(error)) return error.map((item) => String(item)).join(' | ');

  const data = error?.original?.response?.data ?? error?.response?.data ?? {};
  const detail = data?.detail ?? data?.message ?? error?.detail ?? error?.message;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' | ');
  }

  if (typeof detail === 'object' && detail !== null) {
    try {
      return JSON.stringify(detail);
    } catch {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

// Helper function to check if error is network related
export const isNetworkError = (error) => {
  return error?.status === 0 || !error?.status;
};

export default api;
